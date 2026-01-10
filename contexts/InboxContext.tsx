import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useCallback } from 'react';
import type { InboxItem, InboxItemType, InboxArea } from '@/types/inbox';

const STORAGE_KEY = 'inbox_items';
const MIGRATION_KEY = 'inbox_migration_done';
const OLD_BRAIN_DUMP_KEY = 'brain_dump_items';
const OLD_LATER_KEY = 'later_items';

// Auto-detect content type based on input
function detectType(content: string): InboxItemType {
    const trimmed = content.trim().toLowerCase();

    // Check for URLs
    if (/https?:\/\/[^\s]+/.test(content) || /www\.[^\s]+/.test(content)) {
        return 'idea'; // Links are often ideas to explore
    }

    // Check for reminder patterns
    if (
        trimmed.startsWith('remind me') ||
        trimmed.startsWith("don't forget") ||
        trimmed.startsWith('remember to') ||
        trimmed.startsWith('reminder:')
    ) {
        return 'reminder';
    }

    // Check for idea patterns
    if (
        trimmed.startsWith('idea:') ||
        trimmed.startsWith('idea -') ||
        trimmed.startsWith('💡')
    ) {
        return 'idea';
    }

    // Check for task patterns
    if (
        trimmed.startsWith('todo:') ||
        trimmed.startsWith('task:') ||
        trimmed.startsWith('[ ]')
    ) {
        return 'task';
    }

    // Check for someday/later patterns
    if (
        trimmed.startsWith('someday') ||
        trimmed.startsWith('later') ||
        trimmed.startsWith('maybe')
    ) {
        return 'someday';
    }

    // Default to thought
    return 'thought';
}

function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Migration function to convert old data
async function migrateOldData(): Promise<InboxItem[]> {
    const migrated: InboxItem[] = [];

    try {
        // Migrate Brain Dump items
        const brainDumpData = await AsyncStorage.getItem(OLD_BRAIN_DUMP_KEY);
        if (brainDumpData) {
            const items = JSON.parse(brainDumpData);
            for (const item of items) {
                migrated.push({
                    id: item.id || generateId(),
                    content: item.content,
                    type: item.type === 'link' ? 'idea' : (item.type || 'thought'),
                    createdAt: item.createdAt || new Date().toISOString(),
                    isPinned: item.isPinned || false,
                    isArchived: item.isArchived || false,
                    convertedToTaskId: item.convertedToTaskId,
                    convertedToHabitId: item.convertedToHabitId,
                });
            }
        }

        // Migrate Later items
        const laterData = await AsyncStorage.getItem(OLD_LATER_KEY);
        if (laterData) {
            const items = JSON.parse(laterData);
            for (const item of items) {
                migrated.push({
                    id: item.id || generateId(),
                    content: item.title,
                    note: item.note,
                    type: 'someday', // Later items become "someday" type
                    area: item.area,
                    createdAt: item.createdAt || new Date().toISOString(),
                    isPinned: false,
                    isArchived: !!item.archivedAt,
                    archivedAt: item.archivedAt,
                    order: item.order,
                });
            }
        }
    } catch (error) {
        console.error('[InboxContext] Migration error:', error);
    }

    return migrated;
}

export const [InboxProvider, useInbox] = createContextHook(() => {
    const queryClient = useQueryClient();
    const [items, setItems] = useState<InboxItem[]>([]);

    const itemsQuery = useQuery({
        queryKey: ['inbox'],
        queryFn: async () => {
            // Check if migration is needed
            const migrationDone = await AsyncStorage.getItem(MIGRATION_KEY);

            if (!migrationDone) {
                // Perform migration
                const migratedItems = await migrateOldData();
                const existingData = await AsyncStorage.getItem(STORAGE_KEY);
                const existingItems = existingData ? JSON.parse(existingData) : [];

                // Combine migrated + existing (if any)
                const allItems = [...migratedItems, ...existingItems];

                // Save and mark migration complete
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(allItems));
                await AsyncStorage.setItem(MIGRATION_KEY, 'true');

                console.log('[InboxContext] Migration complete:', allItems.length, 'items');
                return allItems;
            }

            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        },
    });

    const saveMutation = useMutation({
        mutationFn: async (items: InboxItem[]) => {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
            return items;
        },
        onSuccess: (items) => {
            queryClient.setQueryData(['inbox'], items);
        },
    });

    useEffect(() => {
        if (itemsQuery.data) {
            setItems(itemsQuery.data);
        }
    }, [itemsQuery.data]);

    const addItem = useCallback(
        (content: string, type?: InboxItemType, area?: InboxArea, note?: string) => {
            const newItem: InboxItem = {
                id: generateId(),
                content: content.trim(),
                note,
                type: type || detectType(content),
                area,
                createdAt: new Date().toISOString(),
                isPinned: false,
                isArchived: false,
                order: items.length > 0 ? Math.min(...items.map((i) => i.order ?? 0)) - 1 : 0,
            };
            const updated = [newItem, ...items];
            setItems(updated);
            saveMutation.mutate(updated);
            return newItem;
        },
        [items, saveMutation]
    );

    const updateItem = useCallback(
        (id: string, updates: Partial<Pick<InboxItem, 'content' | 'note' | 'type' | 'area'>>) => {
            const updated = items.map((item) =>
                item.id === id ? { ...item, ...updates } : item
            );
            setItems(updated);
            saveMutation.mutate(updated);
        },
        [items, saveMutation]
    );

    const deleteItem = useCallback(
        (id: string) => {
            const updated = items.filter((item) => item.id !== id);
            setItems(updated);
            saveMutation.mutate(updated);
        },
        [items, saveMutation]
    );

    const togglePin = useCallback(
        (id: string) => {
            const updated = items.map((item) =>
                item.id === id ? { ...item, isPinned: !item.isPinned } : item
            );
            setItems(updated);
            saveMutation.mutate(updated);
        },
        [items, saveMutation]
    );

    const archiveItem = useCallback(
        (id: string) => {
            const updated = items.map((item) =>
                item.id === id
                    ? { ...item, isArchived: true, archivedAt: new Date().toISOString() }
                    : item
            );
            setItems(updated);
            saveMutation.mutate(updated);
        },
        [items, saveMutation]
    );

    const restoreItem = useCallback(
        (id: string) => {
            const updated = items.map((item) =>
                item.id === id ? { ...item, isArchived: false, archivedAt: undefined } : item
            );
            setItems(updated);
            saveMutation.mutate(updated);
        },
        [items, saveMutation]
    );

    const markConvertedToTask = useCallback(
        (id: string, taskId: string) => {
            const updated = items.map((item) =>
                item.id === id ? { ...item, convertedToTaskId: taskId } : item
            );
            setItems(updated);
            saveMutation.mutate(updated);
        },
        [items, saveMutation]
    );

    const markConvertedToHabit = useCallback(
        (id: string, habitId: string) => {
            const updated = items.map((item) =>
                item.id === id ? { ...item, convertedToHabitId: habitId } : item
            );
            setItems(updated);
            saveMutation.mutate(updated);
        },
        [items, saveMutation]
    );

    const reorderItems = useCallback(
        (reorderedIds: string[]) => {
            const updated = items.map((item) => {
                const newIndex = reorderedIds.indexOf(item.id);
                if (newIndex !== -1) {
                    return { ...item, order: newIndex };
                }
                return item;
            });
            setItems(updated);
            saveMutation.mutate(updated);
        },
        [items, saveMutation]
    );

    // Computed values
    const activeItems = items
        .filter((item) => !item.isArchived)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const archivedItems = items
        .filter((item) => item.isArchived)
        .sort((a, b) => new Date(b.archivedAt || b.createdAt).getTime() - new Date(a.archivedAt || a.createdAt).getTime());

    const getPinnedItems = useCallback(() => {
        return activeItems.filter((item) => item.isPinned);
    }, [activeItems]);

    const getItemsByType = useCallback(
        (type: InboxItemType) => {
            return activeItems.filter((item) => item.type === type);
        },
        [activeItems]
    );

    const getItemsByArea = useCallback(
        (area: InboxArea) => {
            return activeItems.filter((item) => item.area === area);
        },
        [activeItems]
    );

    return {
        items: activeItems,
        allItems: items,
        archivedItems,
        isLoading: itemsQuery.isLoading,
        addItem,
        updateItem,
        deleteItem,
        togglePin,
        archiveItem,
        restoreItem,
        markConvertedToTask,
        markConvertedToHabit,
        reorderItems,
        getPinnedItems,
        getItemsByType,
        getItemsByArea,
    };
});
