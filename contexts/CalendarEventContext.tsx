import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { CalendarEvent } from '@/types/event';

const EVENTS_STORAGE_KEY = 'calendar_events';

function generateId(): string {
    return Crypto.randomUUID();
}

export const [CalendarEventProvider, useCalendarEvents] = createContextHook(() => {
    const queryClient = useQueryClient();
    const [events, setEvents] = useState<CalendarEvent[]>([]);

    const eventsQuery = useQuery({
        queryKey: ['calendar_events'],
        queryFn: async () => {
            try {
                const stored = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);
                if (stored) {
                    return JSON.parse(stored) as CalendarEvent[];
                }
                return [];
            } catch (error) {
                console.error('Error loading calendar events:', error);
                return [];
            }
        },
        staleTime: Infinity,
    });

    useEffect(() => {
        if (eventsQuery.data) {
            setEvents(eventsQuery.data);
        }
    }, [eventsQuery.data]);

    const saveEvents = useCallback(async (newEvents: CalendarEvent[]) => {
        try {
            await AsyncStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(newEvents));
            queryClient.setQueryData(['calendar_events'], newEvents);
        } catch (error) {
            console.error('Error saving calendar events:', error);
        }
    }, [queryClient]);

    const addEvent = useCallback(async (
        title: string,
        date: string,
        isAllDay: boolean,
        color: string,
        startTime?: string,
        endTime?: string,
        notes?: string
    ): Promise<CalendarEvent> => {
        const newEvent: CalendarEvent = {
            id: generateId(),
            title,
            date,
            startTime,
            endTime,
            isAllDay,
            color,
            notes,
            createdAt: new Date().toISOString(),
        };

        const newEvents = [...events, newEvent];
        setEvents(newEvents);
        await saveEvents(newEvents);
        return newEvent;
    }, [events, saveEvents]);

    const updateEvent = useCallback(async (
        id: string,
        updates: Partial<Omit<CalendarEvent, 'id' | 'createdAt'>>
    ): Promise<void> => {
        const newEvents = events.map(e =>
            e.id === id ? { ...e, ...updates } : e
        );
        setEvents(newEvents);
        await saveEvents(newEvents);
    }, [events, saveEvents]);

    const deleteEvent = useCallback(async (id: string): Promise<void> => {
        const newEvents = events.filter(e => e.id !== id);
        setEvents(newEvents);
        await saveEvents(newEvents);
    }, [events, saveEvents]);

    const getEventsForDate = useCallback((date: string): CalendarEvent[] => {
        return events.filter(e => e.date === date);
    }, [events]);

    const getEventById = useCallback((id: string): CalendarEvent | undefined => {
        return events.find(e => e.id === id);
    }, [events]);

    return {
        events,
        isLoading: eventsQuery.isLoading,
        addEvent,
        updateEvent,
        deleteEvent,
        getEventsForDate,
        getEventById,
    };
});
