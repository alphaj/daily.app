import { useMemo, useCallback } from 'react';
import {
    format,
    startOfMonth,
    startOfWeek,
    addDays,
    getDay,
} from 'date-fns';
import * as Haptics from 'expo-haptics';
import { getHourFromTimeOfDay } from '@/lib/notifications';
import { getNextRestockDate } from '@/contexts/GroceryContext';
import type { Habit } from '@/types/habit';
import type { CalendarEvent as CustomEvent } from '@/types/event';

export interface CalendarEventDisplay {
    id: string;
    type: 'habit' | 'task' | 'supplement' | 'event' | 'grocery';
    title: string;
    emoji?: string;
    completed: boolean;
    color: string;
    originalId: string;
    dateStr: string;
    isCustomEvent?: boolean;
    startTime?: string;
    endTime?: string;
    isAllDay?: boolean;
}

export const parseTimeToHour = (timeStr?: string): number => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours + minutes / 60;
};

interface UseCalendarEventAggregationParams {
    currentMonth: Date;
    selectedDate: Date | null;
    habits: Habit[];
    activeSupplements: any[];
    todos: any[];
    customEvents: CustomEvent[];
    groceries: any[];
    toggleHabitCompletion: (id: string) => void;
    toggleTaken: (id: string) => void;
    toggleTodo: (id: string) => void;
    toggleOnList: (id: string) => void;
}

export function useCalendarEventAggregation({
    currentMonth,
    selectedDate,
    habits,
    activeSupplements,
    todos,
    customEvents,
    groceries,
    toggleHabitCompletion,
    toggleTaken,
    toggleTodo,
    toggleOnList,
}: UseCalendarEventAggregationParams) {
    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const startDate = startOfWeek(monthStart);
        const days: Date[] = [];
        for (let i = 0; i < 42; i++) {
            days.push(addDays(startDate, i));
        }
        return days;
    }, [currentMonth]);

    const eventsMap = useMemo(() => {
        const map: Record<string, CalendarEventDisplay[]> = {};

        calendarDays.forEach(date => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const dayOfWeek = getDay(date);
            const events: CalendarEventDisplay[] = [];

            customEvents.forEach(event => {
                if (event.date === dateStr) {
                    events.push({
                        id: `event-${event.id}`,
                        type: 'event',
                        title: event.title,
                        completed: false,
                        color: event.color,
                        originalId: event.id,
                        dateStr,
                        isCustomEvent: true,
                        startTime: event.startTime,
                        endTime: event.endTime,
                        isAllDay: event.isAllDay,
                    });
                }
            });

            habits.forEach(habit => {
                const isScheduledToday = !habit.scheduledDays || habit.scheduledDays.length === 0 ||
                    habit.scheduledDays.includes(dayOfWeek as any);

                if (isScheduledToday) {
                    const completed = habit.completedDates.includes(dateStr);
                    const color = completed ? '#34C759' : '#34C75980';

                    if (habit.preferredTime) {
                        const [h, m] = habit.preferredTime.split(':').map(Number);
                        const endH = m >= 30 ? h + 1 : h;
                        const endM = m >= 30 ? m - 30 : m + 30;
                        events.push({
                            id: `habit-${habit.id}-${dateStr}`,
                            type: 'habit',
                            title: habit.name,
                            emoji: habit.emoji,
                            completed,
                            color,
                            originalId: habit.id,
                            dateStr,
                            isAllDay: false,
                            startTime: habit.preferredTime,
                            endTime: `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`,
                        });
                    } else {
                        events.push({
                            id: `habit-${habit.id}-${dateStr}`,
                            type: 'habit',
                            title: habit.name,
                            emoji: habit.emoji,
                            completed,
                            color,
                            originalId: habit.id,
                            dateStr,
                            isAllDay: true,
                        });
                    }
                }
            });

            activeSupplements.forEach(supplement => {
                const shouldShow = supplement.frequency === 'daily' ||
                    (supplement.frequency === 'twice_daily') ||
                    (supplement.frequency === 'weekly' && dayOfWeek === 0);

                if (shouldShow) {
                    const taken = supplement.takenDates.includes(dateStr);
                    const color = taken ? '#AF52DE' : '#AF52DE80';

                    if (supplement.frequency === 'twice_daily') {
                        events.push({
                            id: `supplement-${supplement.id}-${dateStr}-am`,
                            type: 'supplement',
                            title: supplement.name,
                            emoji: supplement.emoji,
                            completed: taken,
                            color,
                            originalId: supplement.id,
                            dateStr,
                            isAllDay: false,
                            startTime: '08:00',
                            endTime: '08:30',
                        });
                        events.push({
                            id: `supplement-${supplement.id}-${dateStr}-pm`,
                            type: 'supplement',
                            title: supplement.name,
                            emoji: supplement.emoji,
                            completed: taken,
                            color,
                            originalId: supplement.id,
                            dateStr,
                            isAllDay: false,
                            startTime: '19:00',
                            endTime: '19:30',
                        });
                    } else if (supplement.timeOfDay) {
                        const hour = getHourFromTimeOfDay(supplement.timeOfDay);
                        const startTime = `${hour.toString().padStart(2, '0')}:00`;
                        const endTime = `${hour.toString().padStart(2, '0')}:30`;
                        events.push({
                            id: `supplement-${supplement.id}-${dateStr}`,
                            type: 'supplement',
                            title: supplement.name,
                            emoji: supplement.emoji,
                            completed: taken,
                            color,
                            originalId: supplement.id,
                            dateStr,
                            isAllDay: false,
                            startTime,
                            endTime,
                        });
                    } else {
                        events.push({
                            id: `supplement-${supplement.id}-${dateStr}`,
                            type: 'supplement',
                            title: supplement.name,
                            emoji: supplement.emoji,
                            completed: taken,
                            color,
                            originalId: supplement.id,
                            dateStr,
                            isAllDay: true,
                        });
                    }
                }
            });

            todos.forEach(task => {
                if (task.dueDate === dateStr) {
                    if (task.dueTime) {
                        const [h, m] = task.dueTime.split(':').map(Number);
                        const endH = h + 1;
                        events.push({
                            id: `task-${task.id}`,
                            type: 'task',
                            title: task.title,
                            completed: task.completed,
                            color: task.completed ? '#FF9500' : '#FF950080',
                            originalId: task.id,
                            dateStr,
                            isAllDay: false,
                            startTime: task.dueTime,
                            endTime: `${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
                        });
                    } else {
                        events.push({
                            id: `task-${task.id}`,
                            type: 'task',
                            title: task.title,
                            completed: task.completed,
                            color: task.completed ? '#FF9500' : '#FF950080',
                            originalId: task.id,
                            dateStr,
                            isAllDay: true,
                        });
                    }
                }
            });

            groceries.forEach(item => {
                const restockDate = getNextRestockDate(item);
                if (restockDate === dateStr) {
                    events.push({
                        id: `grocery-${item.id}-${dateStr}`,
                        type: 'grocery',
                        title: item.name,
                        emoji: item.emoji,
                        completed: item.isOnList,
                        color: item.isOnList ? '#FF9500' : '#FF950080',
                        originalId: item.id,
                        dateStr,
                        isAllDay: true,
                    });
                }
            });

            map[dateStr] = events;
        });

        return map;
    }, [calendarDays, habits, activeSupplements, todos, customEvents, groceries]);

    const handleEventToggle = useCallback((event: CalendarEventDisplay) => {
        if (event.isCustomEvent) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (event.type === 'habit') {
            toggleHabitCompletion(event.originalId);
        } else if (event.type === 'supplement') {
            toggleTaken(event.originalId);
        } else if (event.type === 'task') {
            toggleTodo(event.originalId);
        } else if (event.type === 'grocery') {
            toggleOnList(event.originalId);
        }
    }, [toggleHabitCompletion, toggleTaken, toggleTodo, toggleOnList]);

    const weeks = useMemo(() => {
        const weeksArray: Date[][] = [];
        for (let i = 0; i < calendarDays.length; i += 7) {
            weeksArray.push(calendarDays.slice(i, i + 7));
        }
        return weeksArray;
    }, [calendarDays]);

    const selectedDateEvents = useMemo(() => {
        if (!selectedDate) return [];
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        return eventsMap[dateStr] || [];
    }, [selectedDate, eventsMap]);

    const { allDayEvents, timedEvents } = useMemo(() => {
        const allDay = selectedDateEvents.filter(e => e.isAllDay !== false && !e.startTime);
        const timed = selectedDateEvents.filter(e => e.startTime);
        return { allDayEvents: allDay, timedEvents: timed };
    }, [selectedDateEvents]);

    return {
        calendarDays,
        eventsMap,
        weeks,
        selectedDateEvents,
        allDayEvents,
        timedEvents,
        handleEventToggle,
    };
}
