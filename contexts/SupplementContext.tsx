import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Supplement, SupplementStats } from '@/types/supplement';
import * as Crypto from 'expo-crypto';
import { scheduleSupplementNotification, cancelSupplementNotifications, rescheduleSupplementNotification } from '@/lib/notifications';

const SUPPLEMENTS_STORAGE_KEY = 'daily_supplements';

function getToday(): string {
    // Uses local time instead of UTC
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function calculateStreak(takenDates: string[]): number {
    if (takenDates.length === 0) return 0;

    const sortedDates = [...takenDates].sort().reverse();
    const today = getToday();

    let checkDate = new Date();
    if (!takenDates.includes(today)) {
        checkDate.setDate(checkDate.getDate() - 1);
    }

    let streak = 0;
    const MAX_DAYS = 365 * 5;

    for (let i = 0; i < MAX_DAYS; i++) {
        const year = checkDate.getFullYear();
        const month = String(checkDate.getMonth() + 1).padStart(2, '0');
        const day = String(checkDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        if (takenDates.includes(dateStr)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }

    return streak;
}

function getWeekDates(): string[] {
    const dates: string[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
    }

    return dates;
}

// Get dates for the current calendar week (Monday to Sunday)
function getCurrentWeekDates(): string[] {
    const dates: string[] = [];
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    // Calculate Monday of current week (if Sunday, go back 6 days)
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + mondayOffset + i);
        dates.push(date.toISOString().split('T')[0]);
    }

    return dates;
}

// Check if supplement is complete for its frequency period
function isCompleteForFrequency(supplement: Supplement): boolean {
    const today = getToday();

    switch (supplement.frequency) {
        case 'daily':
            // Must be taken today
            return supplement.takenDates.includes(today);

        case 'twice_daily':
            // For now, treat as daily (data structure doesn't support multiple times per day)
            // TODO: Could enhance to track AM/PM separately
            return supplement.takenDates.includes(today);

        case 'weekly':
            // Complete if taken any day this calendar week (Mon-Sun)
            const weekDates = getCurrentWeekDates();
            return weekDates.some(date => supplement.takenDates.includes(date));

        case 'as_needed':
            // Never shows as "complete" - always available to take
            return false;

        default:
            return supplement.takenDates.includes(today);
    }
}

function generateId(): string {
    return Crypto.randomUUID();
}

export const [SupplementProvider, useSupplements] = createContextHook(() => {
    const queryClient = useQueryClient();
    const [supplements, setSupplements] = useState<Supplement[]>([]);

    const supplementsQuery = useQuery({
        queryKey: ['supplements'],
        queryFn: async () => {
            const stored = await AsyncStorage.getItem(SUPPLEMENTS_STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        },
    });

    useEffect(() => {
        if (supplementsQuery.data) {
            setSupplements(supplementsQuery.data);
        }
    }, [supplementsQuery.data]);

    const saveSupplements = useCallback(async (newSupplements: Supplement[]) => {
        await AsyncStorage.setItem(SUPPLEMENTS_STORAGE_KEY, JSON.stringify(newSupplements));
        queryClient.invalidateQueries({ queryKey: ['supplements'] });
    }, [queryClient]);

    const addSupplement = useCallback(async (
        name: string,
        emoji?: string,
        dosage?: string,
        frequency: Supplement['frequency'] = 'daily',
        timeOfDay?: Supplement['timeOfDay'],
        notes?: string
    ) => {
        const newSupplementId = generateId();

        // Schedule notifications
        const notificationIds = await scheduleSupplementNotification(
            newSupplementId,
            name,
            emoji || '💊',
            frequency,
            timeOfDay
        );

        const newSupplement: Supplement = {
            id: newSupplementId,
            name,
            emoji: emoji || '💊',
            dosage,
            frequency,
            timeOfDay,
            notes,
            createdAt: new Date().toISOString(),
            takenDates: [],
            currentStreak: 0,
            bestStreak: 0,
            isActive: true,
            notificationIds,
        };

        const newSupplements = [...supplements, newSupplement];
        setSupplements(newSupplements);
        await saveSupplements(newSupplements);
        return newSupplement;
    }, [supplements, saveSupplements]);

    const updateSupplement = useCallback(async (
        id: string,
        updates: Partial<Pick<Supplement, 'name' | 'emoji' | 'dosage' | 'frequency' | 'timeOfDay' | 'notes' | 'isActive'>>
    ) => {
        const supplement = supplements.find(s => s.id === id);
        if (!supplement) return;

        // If frequency or timeOfDay changed, reschedule notifications
        let newNotificationIds = supplement.notificationIds;
        if (updates.frequency || updates.timeOfDay) {
            const frequency = updates.frequency || supplement.frequency;
            const timeOfDay = updates.timeOfDay !== undefined ? updates.timeOfDay : supplement.timeOfDay;
            const name = updates.name || supplement.name;
            const emoji = updates.emoji || supplement.emoji || '💊';

            newNotificationIds = await rescheduleSupplementNotification(
                supplement.notificationIds || [],
                id,
                name,
                emoji,
                frequency,
                timeOfDay
            );
        }

        const newSupplements = supplements.map(s =>
            s.id === id ? { ...s, ...updates, notificationIds: newNotificationIds } : s
        );
        setSupplements(newSupplements);
        await saveSupplements(newSupplements);
    }, [supplements, saveSupplements]);

    const deleteSupplement = useCallback(async (id: string) => {
        const supplement = supplements.find(s => s.id === id);
        if (supplement?.notificationIds) {
            await cancelSupplementNotifications(supplement.notificationIds);
        }

        const newSupplements = supplements.filter(s => s.id !== id);
        setSupplements(newSupplements);
        await saveSupplements(newSupplements);
    }, [supplements, saveSupplements]);

    const toggleTaken = useCallback(async (id: string): Promise<boolean> => {
        const today = getToday();
        const supplement = supplements.find(s => s.id === id);
        if (!supplement) return false;

        const isTaken = supplement.takenDates.includes(today);
        const newTakenDates = isTaken
            ? supplement.takenDates.filter(d => d !== today)
            : [...supplement.takenDates, today];

        const currentStreak = calculateStreak(newTakenDates);
        const bestStreak = Math.max(supplement.bestStreak, currentStreak);

        const newSupplements = supplements.map(s =>
            s.id === id
                ? { ...s, takenDates: newTakenDates, currentStreak, bestStreak }
                : s
        );

        setSupplements(newSupplements);
        await saveSupplements(newSupplements);
        return !isTaken;
    }, [supplements, saveSupplements]);

    const isTakenToday = useCallback((supplement: Supplement): boolean => {
        return supplement.takenDates.includes(getToday());
    }, []);

    const isComplete = useCallback((supplement: Supplement): boolean => {
        return isCompleteForFrequency(supplement);
    }, []);

    const activeSupplements = useMemo(() =>
        supplements.filter(s => s.isActive),
        [supplements]
    );

    const getOverallStats = useMemo((): SupplementStats => {
        const weekDates = getWeekDates();
        const totalPossible = activeSupplements.length * 7;

        let weeklyTaken = 0;
        activeSupplements.forEach(supplement => {
            weekDates.forEach(date => {
                if (supplement.takenDates.includes(date)) {
                    weeklyTaken++;
                }
            });
        });

        const totalTaken = supplements.reduce((sum, s) => sum + s.takenDates.length, 0);
        const longestStreak = supplements.reduce((max, s) => Math.max(max, s.bestStreak), 0);

        return {
            totalTaken,
            weeklyCompletionRate: totalPossible > 0 ? weeklyTaken / totalPossible : 0,
            currentWeekTaken: weeklyTaken,
            longestStreak,
        };
    }, [supplements, activeSupplements]);

    const getTakenTodayCount = useCallback((): number => {
        const today = getToday();
        return activeSupplements.filter(s => s.takenDates.includes(today)).length;
    }, [activeSupplements]);

    return {
        supplements,
        activeSupplements,
        isLoading: supplementsQuery.isLoading,
        addSupplement,
        updateSupplement,
        deleteSupplement,
        toggleTaken,
        isTakenToday,
        isComplete,
        getOverallStats,
        getTakenTodayCount,
    };
});
