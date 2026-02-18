import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Habit, HabitFrequency } from '@/types/habit';

const HABITS_STORAGE_KEY = 'daily_habits';

function getDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function isHabitDueOnDate(habit: Habit, date: Date): boolean {
  // Habit must have been created on or before this date
  const createdDate = habit.createdAt.split('T')[0];
  const dateKey = getDateKey(date);
  if (dateKey < createdDate) return false;

  switch (habit.frequency) {
    case 'daily':
      return true;
    case 'weekdays': {
      const day = date.getDay();
      return day >= 1 && day <= 5;
    }
    case 'weekly': {
      const day = date.getDay();
      return habit.weeklyDays?.includes(day) ?? false;
    }
    default:
      return true;
  }
}

export const [HabitProvider, useHabits] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [habits, setHabits] = useState<Habit[]>([]);

  const habitsQuery = useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(HABITS_STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored) as Habit[];
      return parsed.map(h => ({ ...h, completions: h.completions ?? {} }));
    },
  });

  useEffect(() => {
    if (habitsQuery.data) {
      setHabits(habitsQuery.data);
    }
  }, [habitsQuery.data]);

  const saveHabits = useCallback(async (newHabits: Habit[]) => {
    await AsyncStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(newHabits));
    queryClient.invalidateQueries({ queryKey: ['habits'] });
  }, [queryClient]);

  const addHabit = useCallback(async (
    title: string,
    frequency: HabitFrequency,
    extras?: {
      emoji?: string;
      emojiColor?: string;
      weeklyDays?: number[];
      timeOfDay?: 'anytime' | 'morning' | 'afternoon' | 'evening';
    }
  ) => {
    const newHabit: Habit = {
      id: generateId(),
      title,
      frequency,
      createdAt: new Date().toISOString(),
      completions: {},
      ...extras,
    };

    const newHabits = [...habits, newHabit];
    setHabits(newHabits);
    await saveHabits(newHabits);
  }, [habits, saveHabits]);

  const deleteHabit = useCallback(async (id: string) => {
    const newHabits = habits.filter(h => h.id !== id);
    setHabits(newHabits);
    await saveHabits(newHabits);
  }, [habits, saveHabits]);

  const toggleHabitForDate = useCallback(async (id: string, date: Date) => {
    const dateKey = getDateKey(date);
    const newHabits = habits.map(h => {
      if (h.id !== id) return h;
      const newCompletions = { ...h.completions };
      if (newCompletions[dateKey]) {
        delete newCompletions[dateKey];
      } else {
        newCompletions[dateKey] = true;
      }
      return { ...h, completions: newCompletions };
    });
    setHabits(newHabits);
    await saveHabits(newHabits);
  }, [habits, saveHabits]);

  const getHabitsForDate = useCallback((date: Date): Habit[] => {
    return habits.filter(h => isHabitDueOnDate(h, date));
  }, [habits]);

  const getStreak = useCallback((id: string): number => {
    const habit = habits.find(h => h.id === id);
    if (!habit) return 0;

    let streak = 0;
    const today = new Date();
    const current = new Date(today);

    // Check today first — if not completed, start from yesterday
    const todayKey = getDateKey(current);
    if (!habit.completions?.[todayKey]) {
      current.setDate(current.getDate() - 1);
    }

    while (true) {
      const key = getDateKey(current);
      if (!isHabitDueOnDate(habit, current)) {
        // Skip non-due days
        current.setDate(current.getDate() - 1);
        continue;
      }
      if (habit.completions?.[key]) {
        streak++;
        current.setDate(current.getDate() - 1);
      } else {
        break;
      }
      // Safety: don't go back more than 365 days
      if (streak > 365) break;
    }

    return streak;
  }, [habits]);

  return {
    habits,
    isLoading: habitsQuery.isLoading,
    addHabit,
    deleteHabit,
    toggleHabitForDate,
    getHabitsForDate,
    getStreak,
  };
});
