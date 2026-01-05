import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useCallback } from 'react';
import type { BrainDumpItem, DumpItemType } from '@/types/braindump';

const STORAGE_KEY = 'brain_dump_items';

// Auto-detect content type based on input
function detectType(content: string): DumpItemType {
    const trimmed = content.trim().toLowerCase();

    // Check for URLs
    if (/https?:\/\/[^\s]+/.test(content) || /www\.[^\s]+/.test(content)) {
        return 'link';
    }

    // Check for reminder patterns
    if (
        trimmed.startsWith('remind me') ||
        trimmed.startsWith('don\'t forget') ||
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

    // Default to thought
    return 'thought';
}

function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export const [BrainDumpProvider, useBrainDump] = createContextHook(() => {
    const queryClient = useQueryClient();
    const [items, setItems] = useState<BrainDumpItem[]>([]);

    const itemsQuery = useQuery({
        queryKey: ['brainDump'],
        queryFn: async () => {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        }
    });

    const saveMutation = useMutation({
        mutationFn: async (items: BrainDumpItem[]) => {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
            return items;
        },
        onSuccess: (items) => {
            queryClient.setQueryData(['brainDump'], items);
        }
    });

    useEffect(() => {
        if (itemsQuery.data) {
            setItems(itemsQuery.data);
        }
    }, [itemsQuery.data]);

    const addItem = useCallback((content: string, type?: DumpItemType) => {
        const newItem: BrainDumpItem = {
            id: generateId(),
            content: content.trim(),
            type: type || detectType(content),
            createdAt: new Date().toISOString(),
            isPinned: false,
            isArchived: false,
        };
        const updated = [newItem, ...items];
        setItems(updated);
        saveMutation.mutate(updated);
        return newItem;
    }, [items, saveMutation]);

    const deleteItem = useCallback((id: string) => {
        const updated = items.filter(item => item.id !== id);
        setItems(updated);
        saveMutation.mutate(updated);
    }, [items, saveMutation]);

    const togglePin = useCallback((id: string) => {
        const updated = items.map(item =>
            item.id === id ? { ...item, isPinned: !item.isPinned } : item
        );
        setItems(updated);
        saveMutation.mutate(updated);
    }, [items, saveMutation]);

    const archiveItem = useCallback((id: string) => {
        const updated = items.map(item =>
            item.id === id ? { ...item, isArchived: true } : item
        );
        setItems(updated);
        saveMutation.mutate(updated);
    }, [items, saveMutation]);

    const updateItemType = useCallback((id: string, type: DumpItemType) => {
        const updated = items.map(item =>
            item.id === id ? { ...item, type } : item
        );
        setItems(updated);
        saveMutation.mutate(updated);
    }, [items, saveMutation]);

    const markConvertedToTask = useCallback((id: string, taskId: string) => {
        const updated = items.map(item =>
            item.id === id ? { ...item, convertedToTaskId: taskId } : item
        );
        setItems(updated);
        saveMutation.mutate(updated);
    }, [items, saveMutation]);

    // Get non-archived items
    const activeItems = items.filter(item => !item.isArchived);

    // Filter helpers
    const getItemsByType = useCallback((type: DumpItemType) => {
        return activeItems.filter(item => item.type === type);
    }, [activeItems]);

    const getPinnedItems = useCallback(() => {
        return activeItems.filter(item => item.isPinned);
    }, [activeItems]);

    return {
        items: activeItems,
        allItems: items,
        isLoading: itemsQuery.isLoading,
        addItem,
        deleteItem,
        togglePin,
        archiveItem,
        updateItemType,
        markConvertedToTask,
        getItemsByType,
        getPinnedItems,
    };
});
