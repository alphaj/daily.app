import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useCallback, useRef } from 'react';
import type { DailyNote } from '@/types/note';

const STORAGE_KEY = 'daily_notes';
const DEBOUNCE_MS = 500;

function getDateKey(date: Date): string {
    return date.toISOString().split('T')[0];
}

export const [NoteProvider, useNotes] = createContextHook(() => {
    const queryClient = useQueryClient();
    const [notes, setNotes] = useState<Record<string, DailyNote>>({});
    const [isSaving, setIsSaving] = useState(false);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const notesQuery = useQuery({
        queryKey: ['notes'],
        queryFn: async () => {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : {};
        }
    });

    const saveMutation = useMutation({
        mutationFn: async (notes: Record<string, DailyNote>) => {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
            return notes;
        },
        onSuccess: (notes) => {
            queryClient.setQueryData(['notes'], notes);
            setIsSaving(false);
        }
    });

    useEffect(() => {
        if (notesQuery.data) {
            setNotes(notesQuery.data);
        }
    }, [notesQuery.data]);

    const getNoteForDate = useCallback((date: Date): string => {
        const key = getDateKey(date);
        return notes[key]?.content || '';
    }, [notes]);

    const hasNoteForDate = useCallback((date: Date): boolean => {
        const key = getDateKey(date);
        return !!notes[key]?.content && notes[key].content.trim().length > 0;
    }, [notes]);

    const { mutate: saveNotes } = saveMutation;

    const updateNoteForDate = useCallback((date: Date, content: string) => {
        const key = getDateKey(date);
        const updated = {
            ...notes,
            [key]: {
                date: key,
                content,
                updatedAt: new Date().toISOString(),
            }
        };
        setNotes(updated);
        setIsSaving(true);

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            saveNotes(updated);
        }, DEBOUNCE_MS);
    }, [notes, saveNotes]);

    return {
        notes,
        isLoading: notesQuery.isLoading,
        isSaving,
        getNoteForDate,
        hasNoteForDate,
        updateNoteForDate,
    };
});
