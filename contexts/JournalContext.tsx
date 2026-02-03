import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { JournalEntry, Mood } from '@/types/journal';

const JOURNAL_STORAGE_KEY = 'daily_journal_entries';

function getToday(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function generateId(): string {
    return Crypto.randomUUID();
}

export const [JournalProvider, useJournal] = createContextHook(() => {
    const queryClient = useQueryClient();
    const [entries, setEntries] = useState<JournalEntry[]>([]);

    const entriesQuery = useQuery({
        queryKey: ['journal_entries'],
        queryFn: async () => {
            const stored = await AsyncStorage.getItem(JOURNAL_STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored) as JournalEntry[];
            }
            return [];
        },
        staleTime: Infinity,
    });

    useEffect(() => {
        if (entriesQuery.data) {
            setEntries(entriesQuery.data);
        }
    }, [entriesQuery.data]);

    const saveEntries = useCallback(async (newEntries: JournalEntry[]) => {
        await AsyncStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(newEntries));
        queryClient.setQueryData(['journal_entries'], newEntries);
    }, [queryClient]);

    const addEntry = useCallback(async (
        transcript: string,
        duration: number,
        audioUri?: string,
        mood?: Mood,
        date?: string
    ): Promise<JournalEntry> => {
        const now = new Date().toISOString();
        const entryDate = date || getToday();

        const newEntry: JournalEntry = {
            id: generateId(),
            date: entryDate,
            audioUri,
            transcript,
            duration,
            mood,
            createdAt: now,
            updatedAt: now,
        };

        const newEntries = [newEntry, ...entries];
        setEntries(newEntries);
        await saveEntries(newEntries);
        return newEntry;
    }, [entries, saveEntries]);

    const updateEntry = useCallback(async (
        id: string,
        updates: Partial<Pick<JournalEntry, 'transcript' | 'mood'>>
    ): Promise<void> => {
        const now = new Date().toISOString();
        const newEntries = entries.map(entry =>
            entry.id === id
                ? { ...entry, ...updates, updatedAt: now }
                : entry
        );
        setEntries(newEntries);
        await saveEntries(newEntries);
    }, [entries, saveEntries]);

    const deleteEntry = useCallback(async (id: string): Promise<void> => {
        const newEntries = entries.filter(entry => entry.id !== id);
        setEntries(newEntries);
        await saveEntries(newEntries);
    }, [entries, saveEntries]);

    const getEntryForDate = useCallback((date: string): JournalEntry | undefined => {
        return entries.find(entry => entry.date === date);
    }, [entries]);

    const getEntriesForDate = useCallback((date: string): JournalEntry[] => {
        return entries.filter(entry => entry.date === date);
    }, [entries]);

    const getTodayEntries = useCallback((): JournalEntry[] => {
        return getEntriesForDate(getToday());
    }, [getEntriesForDate]);

    const hasTodayEntry = useMemo((): boolean => {
        return entries.some(entry => entry.date === getToday());
    }, [entries]);

    const totalEntries = useMemo((): number => {
        return entries.length;
    }, [entries]);

    const entriesByDate = useMemo((): Map<string, JournalEntry[]> => {
        const map = new Map<string, JournalEntry[]>();
        entries.forEach(entry => {
            const existing = map.get(entry.date) || [];
            map.set(entry.date, [...existing, entry]);
        });
        return map;
    }, [entries]);

    const recentEntries = useMemo((): JournalEntry[] => {
        return entries.slice(0, 10);
    }, [entries]);

    return {
        entries,
        isLoading: entriesQuery.isLoading,
        addEntry,
        updateEntry,
        deleteEntry,
        getEntryForDate,
        getEntriesForDate,
        getTodayEntries,
        hasTodayEntry,
        totalEntries,
        entriesByDate,
        recentEntries,
    };
});
