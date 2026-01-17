import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { InboxItem, InboxItemType, InboxArea } from '@/types/inbox';

const INBOX_STORAGE_KEY = 'inbox_items';

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

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export const [InboxProvider, useInbox] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<InboxItem[]>([]);

  const itemsQuery = useQuery({
    queryKey: ['inbox'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(INBOX_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    },
  });

  useEffect(() => {
    if (itemsQuery.data) {
      setItems(itemsQuery.data);
    }
  }, [itemsQuery.data]);

  const saveItems = useCallback(async (newItems: InboxItem[]) => {
    await AsyncStorage.setItem(INBOX_STORAGE_KEY, JSON.stringify(newItems));
    queryClient.invalidateQueries({ queryKey: ['inbox'] });
  }, [queryClient]);

  const addItem = useCallback(async (
    content: string,
    type?: InboxItemType,
    area?: InboxArea,
    note?: string
  ) => {
    const minOrder = items.length > 0 ? Math.min(...items.map(i => i.order ?? 0)) - 1 : 0;

    const newItem: InboxItem = {
      id: generateId(),
      content: content.trim(),
      note,
      type: type || detectType(content),
      area,
      createdAt: new Date().toISOString(),
      isPinned: false,
      isArchived: false,
      order: minOrder,
    };

    const newItems = [newItem, ...items];
    setItems(newItems);
    await saveItems(newItems);
    return newItem;
  }, [items, saveItems]);

  const updateItem = useCallback(async (
    id: string,
    updates: Partial<Pick<InboxItem, 'content' | 'note' | 'type' | 'area'>>
  ) => {
    const newItems = items.map(item =>
      item.id === id ? { ...item, ...updates } : item
    );
    setItems(newItems);
    await saveItems(newItems);
  }, [items, saveItems]);

  const deleteItem = useCallback(async (id: string) => {
    const newItems = items.filter(i => i.id !== id);
    setItems(newItems);
    await saveItems(newItems);
  }, [items, saveItems]);

  const togglePin = useCallback(async (id: string) => {
    const newItems = items.map(item =>
      item.id === id ? { ...item, isPinned: !item.isPinned } : item
    );
    setItems(newItems);
    await saveItems(newItems);
  }, [items, saveItems]);

  const archiveItem = useCallback(async (id: string) => {
    const newItems = items.map(item =>
      item.id === id
        ? { ...item, isArchived: true, archivedAt: new Date().toISOString() }
        : item
    );
    setItems(newItems);
    await saveItems(newItems);
  }, [items, saveItems]);

  const restoreItem = useCallback(async (id: string) => {
    const newItems = items.map(item =>
      item.id === id
        ? { ...item, isArchived: false, archivedAt: undefined }
        : item
    );
    setItems(newItems);
    await saveItems(newItems);
  }, [items, saveItems]);

  const markConvertedToTask = useCallback(async (id: string, taskId: string) => {
    const newItems = items.map(item =>
      item.id === id ? { ...item, convertedToTaskId: taskId } : item
    );
    setItems(newItems);
    await saveItems(newItems);
  }, [items, saveItems]);

  const markConvertedToHabit = useCallback(async (id: string, habitId: string) => {
    const newItems = items.map(item =>
      item.id === id ? { ...item, convertedToHabitId: habitId } : item
    );
    setItems(newItems);
    await saveItems(newItems);
  }, [items, saveItems]);

  const reorderItems = useCallback(async (reorderedIds: string[]) => {
    const newItems = items.map(item => {
      const index = reorderedIds.indexOf(item.id);
      return index !== -1 ? { ...item, order: index } : item;
    });
    setItems(newItems);
    await saveItems(newItems);
  }, [items, saveItems]);

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
