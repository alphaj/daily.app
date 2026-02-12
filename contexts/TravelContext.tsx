import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import type { Trip, PackingItem, PackingCategory, TripStatus, ChecklistItem, TripExpense, ExpenseCategory, PackingTemplate } from '@/types/travel';
import { PACKING_CATEGORY_CONFIG } from '@/types/travel';

const TRAVEL_STORAGE_KEY = 'daily_travel';
const TEMPLATES_STORAGE_KEY = 'daily_travel_templates';

function generateId(): string {
    return Crypto.randomUUID();
}

export const [TravelProvider, useTravel] = createContextHook(() => {
    const queryClient = useQueryClient();
    const [trips, setTrips] = useState<Trip[]>([]);
    const [templates, setTemplates] = useState<PackingTemplate[]>([]);

    const tripsQuery = useQuery({
        queryKey: ['travel'],
        queryFn: async () => {
            const stored = await AsyncStorage.getItem(TRAVEL_STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        },
    });

    const templatesQuery = useQuery({
        queryKey: ['travel_templates'],
        queryFn: async () => {
            const stored = await AsyncStorage.getItem(TEMPLATES_STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        },
    });

    useEffect(() => {
        if (tripsQuery.data) {
            setTrips(tripsQuery.data);
        }
    }, [tripsQuery.data]);

    useEffect(() => {
        if (templatesQuery.data) {
            setTemplates(templatesQuery.data);
        }
    }, [templatesQuery.data]);

    const saveTrips = useCallback(async (newTrips: Trip[]) => {
        await AsyncStorage.setItem(TRAVEL_STORAGE_KEY, JSON.stringify(newTrips));
        queryClient.invalidateQueries({ queryKey: ['travel'] });
    }, [queryClient]);

    const saveTemplates = useCallback(async (newTemplates: PackingTemplate[]) => {
        await AsyncStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(newTemplates));
        queryClient.invalidateQueries({ queryKey: ['travel_templates'] });
    }, [queryClient]);

    // Trip CRUD
    const addTrip = useCallback(async (
        name: string,
        options?: { destination?: string; startDate?: string; endDate?: string }
    ) => {
        const newTrip: Trip = {
            id: generateId(),
            name,
            destination: options?.destination,
            startDate: options?.startDate,
            endDate: options?.endDate,
            items: [],
            status: 'packing',
            createdAt: new Date().toISOString(),
        };
        const newTrips = [...trips, newTrip];
        setTrips(newTrips);
        await saveTrips(newTrips);
        return newTrip;
    }, [trips, saveTrips]);

    const updateTrip = useCallback(async (
        id: string,
        updates: Partial<Pick<Trip, 'name' | 'destination' | 'startDate' | 'endDate' | 'status'>>
    ) => {
        const newTrips = trips.map(t =>
            t.id === id ? { ...t, ...updates } : t
        );
        setTrips(newTrips);
        await saveTrips(newTrips);
    }, [trips, saveTrips]);

    const deleteTrip = useCallback(async (id: string) => {
        const newTrips = trips.filter(t => t.id !== id);
        setTrips(newTrips);
        await saveTrips(newTrips);
    }, [trips, saveTrips]);

    const duplicateTrip = useCallback(async (sourceTripId: string, newName?: string) => {
        const source = trips.find(t => t.id === sourceTripId);
        if (!source) return null;

        const newTrip: Trip = {
            id: generateId(),
            name: newName || `${source.name} (copy)`,
            destination: source.destination,
            items: source.items.map(item => ({
                ...item,
                id: generateId(),
                packed: false,
            })),
            checklist: (source.checklist || []).map(item => ({
                ...item,
                id: generateId(),
                completed: false,
            })),
            status: 'packing',
            createdAt: new Date().toISOString(),
        };
        const newTrips = [...trips, newTrip];
        setTrips(newTrips);
        await saveTrips(newTrips);
        return newTrip;
    }, [trips, saveTrips]);

    // Item CRUD
    const addItemToTrip = useCallback(async (
        tripId: string,
        name: string,
        category: PackingCategory,
        quantity: number = 1,
    ) => {
        const newTrips = trips.map(t => {
            if (t.id !== tripId) return t;
            const maxOrder = t.items.filter(i => i.category === category).length;
            const newItem: PackingItem = {
                id: generateId(),
                name,
                category,
                packed: false,
                quantity,
                createdAt: new Date().toISOString(),
                order: maxOrder,
            };
            return { ...t, items: [...t.items, newItem] };
        });
        setTrips(newTrips);
        await saveTrips(newTrips);
    }, [trips, saveTrips]);

    const toggleItemPacked = useCallback(async (tripId: string, itemId: string) => {
        const newTrips = trips.map(t => {
            if (t.id !== tripId) return t;
            return {
                ...t,
                items: t.items.map(i =>
                    i.id === itemId ? { ...i, packed: !i.packed } : i
                ),
            };
        });
        setTrips(newTrips);
        await saveTrips(newTrips);
    }, [trips, saveTrips]);

    const deleteItemFromTrip = useCallback(async (tripId: string, itemId: string) => {
        const newTrips = trips.map(t => {
            if (t.id !== tripId) return t;
            return { ...t, items: t.items.filter(i => i.id !== itemId) };
        });
        setTrips(newTrips);
        await saveTrips(newTrips);
    }, [trips, saveTrips]);

    const addSuggestedItems = useCallback(async (
        tripId: string,
        items: { name: string; category: PackingCategory }[],
    ) => {
        const newTrips = trips.map(t => {
            if (t.id !== tripId) return t;
            const newItems = items.map((item) => {
                const maxOrder = t.items.filter(i => i.category === item.category).length;
                return {
                    id: generateId(),
                    name: item.name,
                    category: item.category,
                    packed: false,
                    quantity: 1,
                    createdAt: new Date().toISOString(),
                    order: maxOrder,
                } as PackingItem;
            });
            return { ...t, items: [...t.items, ...newItems] };
        });
        setTrips(newTrips);
        await saveTrips(newTrips);
    }, [trips, saveTrips]);

    // Checklist CRUD
    const addChecklistItem = useCallback(async (tripId: string, text: string) => {
        const newTrips = trips.map(t => {
            if (t.id !== tripId) return t;
            const checklist = t.checklist || [];
            const newItem: ChecklistItem = {
                id: generateId(),
                text,
                completed: false,
                createdAt: new Date().toISOString(),
                order: checklist.length,
            };
            return { ...t, checklist: [...checklist, newItem] };
        });
        setTrips(newTrips);
        await saveTrips(newTrips);
    }, [trips, saveTrips]);

    const toggleChecklistItem = useCallback(async (tripId: string, itemId: string) => {
        const newTrips = trips.map(t => {
            if (t.id !== tripId) return t;
            return {
                ...t,
                checklist: (t.checklist || []).map(i =>
                    i.id === itemId ? { ...i, completed: !i.completed } : i
                ),
            };
        });
        setTrips(newTrips);
        await saveTrips(newTrips);
    }, [trips, saveTrips]);

    const deleteChecklistItem = useCallback(async (tripId: string, itemId: string) => {
        const newTrips = trips.map(t => {
            if (t.id !== tripId) return t;
            return { ...t, checklist: (t.checklist || []).filter(i => i.id !== itemId) };
        });
        setTrips(newTrips);
        await saveTrips(newTrips);
    }, [trips, saveTrips]);

    // Expense CRUD
    const addExpense = useCallback(async (
        tripId: string,
        description: string,
        amount: number,
        category: ExpenseCategory,
        date?: string,
    ) => {
        const newTrips = trips.map(t => {
            if (t.id !== tripId) return t;
            const newExpense: TripExpense = {
                id: generateId(),
                description,
                amount,
                category,
                date: date || new Date().toISOString().split('T')[0],
                createdAt: new Date().toISOString(),
            };
            return { ...t, expenses: [...(t.expenses || []), newExpense] };
        });
        setTrips(newTrips);
        await saveTrips(newTrips);
    }, [trips, saveTrips]);

    const deleteExpense = useCallback(async (tripId: string, expenseId: string) => {
        const newTrips = trips.map(t => {
            if (t.id !== tripId) return t;
            return { ...t, expenses: (t.expenses || []).filter(e => e.id !== expenseId) };
        });
        setTrips(newTrips);
        await saveTrips(newTrips);
    }, [trips, saveTrips]);

    const getTripExpenseTotal = useCallback((trip: Trip) => {
        return (trip.expenses || []).reduce((sum, e) => sum + e.amount, 0);
    }, []);

    // Template CRUD
    const saveAsTemplate = useCallback(async (tripId: string, templateName?: string) => {
        const trip = trips.find(t => t.id === tripId);
        if (!trip) return null;

        const template: PackingTemplate = {
            id: generateId(),
            name: templateName || trip.name,
            items: trip.items.map(i => ({ name: i.name, category: i.category, quantity: i.quantity })),
            checklistItems: (trip.checklist || []).map(c => c.text),
            createdAt: new Date().toISOString(),
        };
        const newTemplates = [...templates, template];
        setTemplates(newTemplates);
        await saveTemplates(newTemplates);
        return template;
    }, [trips, templates, saveTemplates]);

    const deleteTemplate = useCallback(async (templateId: string) => {
        const newTemplates = templates.filter(t => t.id !== templateId);
        setTemplates(newTemplates);
        await saveTemplates(newTemplates);
    }, [templates, saveTemplates]);

    const createTripFromTemplate = useCallback(async (
        templateId: string,
        tripName: string,
        options?: { destination?: string; startDate?: string; endDate?: string },
    ) => {
        const template = templates.find(t => t.id === templateId);
        if (!template) return null;

        const newTrip: Trip = {
            id: generateId(),
            name: tripName,
            destination: options?.destination,
            startDate: options?.startDate,
            endDate: options?.endDate,
            items: template.items.map((item, idx) => ({
                id: generateId(),
                name: item.name,
                category: item.category,
                packed: false,
                quantity: item.quantity,
                createdAt: new Date().toISOString(),
                order: idx,
            })),
            checklist: (template.checklistItems || []).map((text, idx) => ({
                id: generateId(),
                text,
                completed: false,
                createdAt: new Date().toISOString(),
                order: idx,
            })),
            status: 'packing',
            createdAt: new Date().toISOString(),
        };
        const newTrips = [...trips, newTrip];
        setTrips(newTrips);
        await saveTrips(newTrips);
        return newTrip;
    }, [trips, templates, saveTrips]);

    // Computed
    const activeTrips = useMemo(() => {
        return trips.filter(t => t.status !== 'completed');
    }, [trips]);

    const completedTrips = useMemo(() => {
        return trips.filter(t => t.status === 'completed');
    }, [trips]);

    const getTripProgress = useCallback((trip: Trip) => {
        if (trip.items.length === 0) return 0;
        const packed = trip.items.filter(i => i.packed).length;
        return Math.round((packed / trip.items.length) * 100);
    }, []);

    const getItemsByCategory = useCallback((trip: Trip) => {
        const grouped: Partial<Record<PackingCategory, PackingItem[]>> = {};

        trip.items.forEach(item => {
            if (!grouped[item.category]) {
                grouped[item.category] = [];
            }
            grouped[item.category]!.push(item);
        });

        // Sort each category: unpacked first (by order), then packed (by order)
        Object.keys(grouped).forEach(cat => {
            grouped[cat as PackingCategory]!.sort((a, b) => {
                if (a.packed !== b.packed) return a.packed ? 1 : -1;
                return a.order - b.order;
            });
        });

        // Return sorted by category config order
        const sorted = Object.entries(grouped).sort(([a], [b]) => {
            return PACKING_CATEGORY_CONFIG[a as PackingCategory].order -
                PACKING_CATEGORY_CONFIG[b as PackingCategory].order;
        });

        return sorted as [PackingCategory, PackingItem[]][];
    }, []);

    return {
        trips,
        activeTrips,
        completedTrips,
        templates,
        isLoading: tripsQuery.isLoading,
        addTrip,
        updateTrip,
        deleteTrip,
        duplicateTrip,
        addItemToTrip,
        toggleItemPacked,
        deleteItemFromTrip,
        addSuggestedItems,
        addChecklistItem,
        toggleChecklistItem,
        deleteChecklistItem,
        addExpense,
        deleteExpense,
        getTripExpenseTotal,
        saveAsTemplate,
        deleteTemplate,
        createTripFromTemplate,
        getTripProgress,
        getItemsByCategory,
    };
});
