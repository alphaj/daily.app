import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState } from 'react';
import type { LaterItem, LaterArea } from '@/types/later';

const STORAGE_KEY = 'later_items';

export const [LaterProvider, useLater] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<LaterItem[]>([]);

  const itemsQuery = useQuery({
    queryKey: ['later_items'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (items: LaterItem[]) => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      return items;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['later_items'] });
    },
  });

  useEffect(() => {
    if (itemsQuery.data) {
      setItems(itemsQuery.data);
    }
  }, [itemsQuery.data]);

  const addItem = (title: string, area: LaterArea, note?: string) => {
    const newItem: LaterItem = {
      id: Date.now().toString(),
      title,
      note,
      area,
      createdAt: new Date().toISOString(),
    };
    const updated = [newItem, ...items];
    setItems(updated);
    syncMutation.mutate(updated);
    console.log('[LaterContext] Added item:', newItem.title);
  };

  const updateItem = (id: string, updates: Partial<Pick<LaterItem, 'title' | 'note' | 'area'>>) => {
    const updated = items.map(item =>
      item.id === id ? { ...item, ...updates } : item
    );
    setItems(updated);
    syncMutation.mutate(updated);
    console.log('[LaterContext] Updated item:', id);
  };

  const archiveItem = (id: string) => {
    const updated = items.map(item =>
      item.id === id ? { ...item, archivedAt: new Date().toISOString() } : item
    );
    setItems(updated);
    syncMutation.mutate(updated);
    console.log('[LaterContext] Archived item:', id);
  };

  const deleteItem = (id: string) => {
    const updated = items.filter(item => item.id !== id);
    setItems(updated);
    syncMutation.mutate(updated);
    console.log('[LaterContext] Deleted item:', id);
  };

  const restoreItem = (id: string) => {
    const updated = items.map(item =>
      item.id === id ? { ...item, archivedAt: undefined } : item
    );
    setItems(updated);
    syncMutation.mutate(updated);
    console.log('[LaterContext] Restored item:', id);
  };

  const activeItems = items.filter(item => !item.archivedAt);
  const archivedItems = items.filter(item => item.archivedAt);

  const getItemsByArea = (area: LaterArea) => activeItems.filter(item => item.area === area);

  return {
    items,
    activeItems,
    archivedItems,
    addItem,
    updateItem,
    archiveItem,
    deleteItem,
    restoreItem,
    getItemsByArea,
    isLoading: itemsQuery.isLoading,
  };
});
