import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { InboxItem, InboxItemType, InboxArea } from '@/types/inbox';

interface DbInboxItem {
    id: string;
    user_id: string;
    content: string;
    note: string | null;
    type: string;
    area: string | null;
    is_pinned: boolean;
    is_archived: boolean;
    archived_at: string | null;
    order: number;
    converted_to_task_id: string | null;
    converted_to_habit_id: string | null;
    created_at: string;
}

function detectType(content: string): InboxItemType {
    const trimmed = content.trim().toLowerCase();

    if (/https?:\/\/[^\s]+/.test(content) || /www\.[^\s]+/.test(content)) {
        return 'idea';
    }

    if (
        trimmed.startsWith('remind me') ||
        trimmed.startsWith("don't forget") ||
        trimmed.startsWith('remember to') ||
        trimmed.startsWith('reminder:')
    ) {
        return 'reminder';
    }

    if (
        trimmed.startsWith('idea:') ||
        trimmed.startsWith('idea -') ||
        trimmed.startsWith('💡')
    ) {
        return 'idea';
    }

    if (
        trimmed.startsWith('todo:') ||
        trimmed.startsWith('task:') ||
        trimmed.startsWith('[ ]')
    ) {
        return 'task';
    }

    if (
        trimmed.startsWith('someday') ||
        trimmed.startsWith('later') ||
        trimmed.startsWith('maybe')
    ) {
        return 'someday';
    }

    return 'thought';
}

function mapDbItemToInboxItem(dbItem: DbInboxItem): InboxItem {
    return {
        id: dbItem.id,
        content: dbItem.content,
        note: dbItem.note || undefined,
        type: dbItem.type as InboxItemType,
        area: dbItem.area as InboxArea | undefined,
        createdAt: dbItem.created_at,
        isPinned: dbItem.is_pinned,
        isArchived: dbItem.is_archived,
        archivedAt: dbItem.archived_at || undefined,
        order: dbItem.order,
        convertedToTaskId: dbItem.converted_to_task_id || undefined,
        convertedToHabitId: dbItem.converted_to_habit_id || undefined,
    };
}

export const [InboxProvider, useInbox] = createContextHook(() => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [items, setItems] = useState<InboxItem[]>([]);

    const itemsQuery = useQuery({
        queryKey: ['inbox', user?.id],
        queryFn: async () => {
            if (!user) return [];

            const { data, error } = await supabase
                .from('inbox_items')
                .select('*')
                .eq('user_id', user.id);

            if (error) throw error;

            return (data as DbInboxItem[]).map(mapDbItemToInboxItem);
        },
        enabled: !!user,
    });

    useEffect(() => {
        if (itemsQuery.data) {
            setItems(itemsQuery.data);
        }
    }, [itemsQuery.data]);

    const addItem = useCallback(async (
        content: string,
        type?: InboxItemType,
        area?: InboxArea,
        note?: string
    ) => {
        if (!user) return null;

        const minOrder = items.length > 0 ? Math.min(...items.map(i => i.order ?? 0)) - 1 : 0;

        const { data, error } = await supabase
            .from('inbox_items')
            .insert({
                user_id: user.id,
                content: content.trim(),
                note: note || null,
                type: type || detectType(content),
                area: area || null,
                order: minOrder,
            })
            .select()
            .single();

        if (error) {
            console.error('Failed to add inbox item:', error);
            return null;
        }

        queryClient.invalidateQueries({ queryKey: ['inbox', user.id] });
        return mapDbItemToInboxItem(data);
    }, [user, items, queryClient]);

    const updateItem = useCallback(async (
        id: string,
        updates: Partial<Pick<InboxItem, 'content' | 'note' | 'type' | 'area'>>
    ) => {
        if (!user) return;

        const { error } = await supabase
            .from('inbox_items')
            .update({
                content: updates.content,
                note: updates.note || null,
                type: updates.type,
                area: updates.area || null,
            })
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            console.error('Failed to update inbox item:', error);
            return;
        }

        queryClient.invalidateQueries({ queryKey: ['inbox', user.id] });
    }, [user, queryClient]);

    const deleteItem = useCallback(async (id: string) => {
        if (!user) return;

        const { error } = await supabase
            .from('inbox_items')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            console.error('Failed to delete inbox item:', error);
            return;
        }

        queryClient.invalidateQueries({ queryKey: ['inbox', user.id] });
    }, [user, queryClient]);

    const togglePin = useCallback(async (id: string) => {
        if (!user) return;

        const item = items.find(i => i.id === id);
        if (!item) return;

        const { error } = await supabase
            .from('inbox_items')
            .update({ is_pinned: !item.isPinned })
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            console.error('Failed to toggle pin:', error);
            return;
        }

        queryClient.invalidateQueries({ queryKey: ['inbox', user.id] });
    }, [user, items, queryClient]);

    const archiveItem = useCallback(async (id: string) => {
        if (!user) return;

        const { error } = await supabase
            .from('inbox_items')
            .update({
                is_archived: true,
                archived_at: new Date().toISOString(),
            })
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            console.error('Failed to archive item:', error);
            return;
        }

        queryClient.invalidateQueries({ queryKey: ['inbox', user.id] });
    }, [user, queryClient]);

    const restoreItem = useCallback(async (id: string) => {
        if (!user) return;

        const { error } = await supabase
            .from('inbox_items')
            .update({
                is_archived: false,
                archived_at: null,
            })
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            console.error('Failed to restore item:', error);
            return;
        }

        queryClient.invalidateQueries({ queryKey: ['inbox', user.id] });
    }, [user, queryClient]);

    const markConvertedToTask = useCallback(async (id: string, taskId: string) => {
        if (!user) return;

        const { error } = await supabase
            .from('inbox_items')
            .update({ converted_to_task_id: taskId })
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            console.error('Failed to mark converted to task:', error);
            return;
        }

        queryClient.invalidateQueries({ queryKey: ['inbox', user.id] });
    }, [user, queryClient]);

    const markConvertedToHabit = useCallback(async (id: string, habitId: string) => {
        if (!user) return;

        const { error } = await supabase
            .from('inbox_items')
            .update({ converted_to_habit_id: habitId })
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            console.error('Failed to mark converted to habit:', error);
            return;
        }

        queryClient.invalidateQueries({ queryKey: ['inbox', user.id] });
    }, [user, queryClient]);

    const reorderItems = useCallback(async (reorderedIds: string[]) => {
        if (!user) return;

        for (let i = 0; i < reorderedIds.length; i++) {
            await supabase
                .from('inbox_items')
                .update({ order: i })
                .eq('id', reorderedIds[i])
                .eq('user_id', user.id);
        }

        queryClient.invalidateQueries({ queryKey: ['inbox', user.id] });
    }, [user, queryClient]);

    // Computed values
    const activeItems = items
        .filter(item => !item.isArchived)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const archivedItems = items
        .filter(item => item.isArchived)
        .sort((a, b) =>
            new Date(b.archivedAt || b.createdAt).getTime() -
            new Date(a.archivedAt || a.createdAt).getTime()
        );

    const getPinnedItems = useCallback(() => {
        return activeItems.filter(item => item.isPinned);
    }, [activeItems]);

    const getItemsByType = useCallback((type: InboxItemType) => {
        return activeItems.filter(item => item.type === type);
    }, [activeItems]);

    const getItemsByArea = useCallback((area: InboxArea) => {
        return activeItems.filter(item => item.area === area);
    }, [activeItems]);

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
