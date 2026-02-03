import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GroceryItem, GroceryStats, GroceryCategory } from '@/types/grocery';
import { CATEGORY_KEYWORDS, CATEGORY_CONFIG } from '@/types/grocery';
import * as Crypto from 'expo-crypto';

const GROCERY_STORAGE_KEY = 'daily_groceries';

function generateId(): string {
    return Crypto.randomUUID();
}

function getToday(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Auto-categorize an item based on its name
 */
function autoCategorizeName(name: string): GroceryCategory {
    const lowerName = name.toLowerCase();

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        for (const keyword of keywords) {
            if (lowerName.includes(keyword)) {
                return category as GroceryCategory;
            }
        }
    }

    // Default to pantry if no match
    return 'pantry';
}

/**
 * Get a default emoji for a category
 */
function getDefaultEmoji(category: GroceryCategory): string {
    return CATEGORY_CONFIG[category].emoji;
}

export const [GroceryProvider, useGroceries] = createContextHook(() => {
    const queryClient = useQueryClient();
    const [groceries, setGroceries] = useState<GroceryItem[]>([]);

    const groceriesQuery = useQuery({
        queryKey: ['groceries'],
        queryFn: async () => {
            const stored = await AsyncStorage.getItem(GROCERY_STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        },
    });

    useEffect(() => {
        if (groceriesQuery.data) {
            setGroceries(groceriesQuery.data);
        }
    }, [groceriesQuery.data]);

    const saveGroceries = useCallback(async (newGroceries: GroceryItem[]) => {
        await AsyncStorage.setItem(GROCERY_STORAGE_KEY, JSON.stringify(newGroceries));
        queryClient.invalidateQueries({ queryKey: ['groceries'] });
    }, [queryClient]);

    const addItem = useCallback(async (
        name: string,
        options?: {
            emoji?: string;
            category?: GroceryCategory;
            quantity?: string;
            brand?: string;
            notes?: string;
            frequency?: GroceryItem['frequency'];
            isStaple?: boolean;
            addToListNow?: boolean;
        }
    ) => {
        const category = options?.category || autoCategorizeName(name);
        const maxOrder = groceries.filter(g => g.category === category).length;

        const newItem: GroceryItem = {
            id: generateId(),
            name,
            emoji: options?.emoji || getDefaultEmoji(category),
            category,
            quantity: options?.quantity,
            brand: options?.brand,
            notes: options?.notes,
            frequency: options?.frequency || 'as_needed',
            isStaple: options?.isStaple ?? false,
            isOnList: options?.addToListNow ?? true,
            purchaseHistory: [],
            createdAt: new Date().toISOString(),
            order: maxOrder,
        };

        const newGroceries = [...groceries, newItem];
        setGroceries(newGroceries);
        await saveGroceries(newGroceries);
        return newItem;
    }, [groceries, saveGroceries]);

    const updateItem = useCallback(async (
        id: string,
        updates: Partial<Pick<GroceryItem, 'name' | 'emoji' | 'category' | 'quantity' | 'brand' | 'notes' | 'frequency' | 'isStaple'>>
    ) => {
        const newGroceries = groceries.map(g =>
            g.id === id ? { ...g, ...updates } : g
        );
        setGroceries(newGroceries);
        await saveGroceries(newGroceries);
    }, [groceries, saveGroceries]);

    const deleteItem = useCallback(async (id: string) => {
        const newGroceries = groceries.filter(g => g.id !== id);
        setGroceries(newGroceries);
        await saveGroceries(newGroceries);
    }, [groceries, saveGroceries]);

    const toggleOnList = useCallback(async (id: string): Promise<boolean> => {
        const item = groceries.find(g => g.id === id);
        if (!item) return false;

        const newIsOnList = !item.isOnList;
        const newGroceries = groceries.map(g =>
            g.id === id ? { ...g, isOnList: newIsOnList } : g
        );

        setGroceries(newGroceries);
        await saveGroceries(newGroceries);
        return newIsOnList;
    }, [groceries, saveGroceries]);

    const markPurchased = useCallback(async (id: string) => {
        const item = groceries.find(g => g.id === id);
        if (!item) return;

        const today = getToday();
        const newGroceries = groceries.map(g =>
            g.id === id
                ? {
                    ...g,
                    isOnList: false,
                    lastPurchased: today,
                    purchaseHistory: [...g.purchaseHistory, today],
                }
                : g
        );

        setGroceries(newGroceries);
        await saveGroceries(newGroceries);
    }, [groceries, saveGroceries]);

    const clearShoppingList = useCallback(async () => {
        const today = getToday();
        const newGroceries = groceries.map(g =>
            g.isOnList
                ? {
                    ...g,
                    isOnList: false,
                    lastPurchased: today,
                    purchaseHistory: [...g.purchaseHistory, today],
                }
                : g
        );

        setGroceries(newGroceries);
        await saveGroceries(newGroceries);
    }, [groceries, saveGroceries]);

    // Get items currently on the shopping list, sorted by category
    const shoppingList = useMemo(() => {
        return groceries
            .filter(g => g.isOnList)
            .sort((a, b) => {
                const categoryOrderA = CATEGORY_CONFIG[a.category].order;
                const categoryOrderB = CATEGORY_CONFIG[b.category].order;
                if (categoryOrderA !== categoryOrderB) {
                    return categoryOrderA - categoryOrderB;
                }
                return a.order - b.order;
            });
    }, [groceries]);

    // Get all pantry items (staples)
    const staples = useMemo(() => {
        return groceries.filter(g => g.isStaple);
    }, [groceries]);

    // Get items grouped by category
    const itemsByCategory = useMemo(() => {
        const grouped: Record<GroceryCategory, GroceryItem[]> = {
            produce: [],
            dairy: [],
            meat: [],
            bakery: [],
            frozen: [],
            pantry: [],
            beverages: [],
            snacks: [],
            household: [],
            personal: [],
        };

        groceries.forEach(g => {
            grouped[g.category].push(g);
        });

        // Sort each category by order
        Object.keys(grouped).forEach(cat => {
            grouped[cat as GroceryCategory].sort((a, b) => a.order - b.order);
        });

        return grouped;
    }, [groceries]);

    // Suggest items that may need restocking based on frequency
    const suggestedRestock = useMemo(() => {
        const today = new Date();
        const suggestions: GroceryItem[] = [];

        groceries.forEach(item => {
            if (!item.isStaple || item.isOnList || !item.lastPurchased) return;

            const lastDate = new Date(item.lastPurchased);
            const daysSince = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

            let threshold = 0;
            switch (item.frequency) {
                case 'weekly':
                    threshold = 6; // Suggest a day early
                    break;
                case 'biweekly':
                    threshold = 13;
                    break;
                case 'monthly':
                    threshold = 28;
                    break;
                default:
                    return; // Don't suggest for as_needed or one_time
            }

            if (daysSince >= threshold) {
                suggestions.push(item);
            }
        });

        return suggestions;
    }, [groceries]);

    // Overall stats
    const stats = useMemo((): GroceryStats => {
        const categoryBreakdown: Record<GroceryCategory, number> = {
            produce: 0,
            dairy: 0,
            meat: 0,
            bakery: 0,
            frozen: 0,
            pantry: 0,
            beverages: 0,
            snacks: 0,
            household: 0,
            personal: 0,
        };

        groceries.forEach(g => {
            categoryBreakdown[g.category]++;
        });

        // Calculate average weekly items from purchase history
        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
        const fourWeeksAgoStr = fourWeeksAgo.toISOString().split('T')[0];

        let recentPurchases = 0;
        groceries.forEach(g => {
            g.purchaseHistory.forEach(date => {
                if (date >= fourWeeksAgoStr) {
                    recentPurchases++;
                }
            });
        });

        return {
            totalItems: groceries.length,
            onListCount: shoppingList.length,
            categoryBreakdown,
            avgWeeklyItems: Math.round(recentPurchases / 4),
        };
    }, [groceries, shoppingList]);

    return {
        groceries,
        shoppingList,
        staples,
        itemsByCategory,
        suggestedRestock,
        stats,
        isLoading: groceriesQuery.isLoading,
        addItem,
        updateItem,
        deleteItem,
        toggleOnList,
        markPurchased,
        clearShoppingList,
        autoCategorizeName,
    };
});
