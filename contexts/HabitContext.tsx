import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Habit, ImplementationIntention, DayCompletion, HabitStats } from '@/types/habit';

const HABITS_STORAGE_KEY = 'daily_habits';

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function calculateStreak(completedDates: string[]): number {
  if (completedDates.length === 0) return 0;

  const sortedDates = [...completedDates].sort().reverse();
  let streak = 0;
  let checkDate = new Date();

  for (const dateStr of sortedDates) {
    const completedDate = new Date(dateStr + 'T00:00:00');
    const expectedDate = new Date(checkDate);
    expectedDate.setHours(0, 0, 0, 0);

    if (completedDate.getTime() === expectedDate.getTime()) {
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

function getDayName(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export const [HabitProvider, useHabits] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [habits, setHabits] = useState<Habit[]>([]);

  const habitsQuery = useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(HABITS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
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
    name: string,
    intention?: ImplementationIntention,
    emoji?: string,
    whyStatement?: string,
    celebrationPhrase?: string
  ) => {
    const newHabit: Habit = {
      id: generateId(),
      name,
      emoji,
      createdAt: new Date().toISOString(),
      completedDates: [],
      currentStreak: 0,
      bestStreak: 0,
      intention,
      whyStatement,
      celebrationPhrase,
    };

    const newHabits = [...habits, newHabit];
    setHabits(newHabits);
    await saveHabits(newHabits);
  }, [habits, saveHabits]);

  const updateHabit = useCallback(async (
    id: string,
    updates: Partial<Pick<Habit, 'name' | 'intention' | 'emoji' | 'whyStatement' | 'celebrationPhrase'>>
  ) => {
    const newHabits = habits.map(h =>
      h.id === id ? { ...h, ...updates } : h
    );
    setHabits(newHabits);
    await saveHabits(newHabits);
  }, [habits, saveHabits]);

  const deleteHabit = useCallback(async (id: string) => {
    const newHabits = habits.filter(h => h.id !== id);
    setHabits(newHabits);
    await saveHabits(newHabits);
  }, [habits, saveHabits]);

  const toggleHabitCompletion = useCallback(async (id: string): Promise<boolean> => {
    const today = getToday();
    const habit = habits.find(h => h.id === id);
    if (!habit) return false;

    const isCompleted = habit.completedDates.includes(today);
    const newCompletedDates = isCompleted
      ? habit.completedDates.filter(d => d !== today)
      : [...habit.completedDates, today];

    const currentStreak = calculateStreak(newCompletedDates);
    const bestStreak = Math.max(habit.bestStreak, currentStreak);

    const newHabits = habits.map(h =>
      h.id === id
        ? { ...h, completedDates: newCompletedDates, currentStreak, bestStreak }
        : h
    );

    setHabits(newHabits);
    await saveHabits(newHabits);
    return !isCompleted;
  }, [habits, saveHabits]);

  const isCompletedToday = useCallback((habit: Habit): boolean => {
    return habit.completedDates.includes(getToday());
  }, []);

  const getWeeklyProgress = useCallback((habit: Habit): DayCompletion[] => {
    const weekDates = getWeekDates();
    const today = getToday();
    const createdDate = habit.createdAt.split('T')[0];

    return weekDates.map(date => ({
      date,
      dayName: getDayName(date),
      isToday: date === today,
      completed: habit.completedDates.includes(date),
      isBeforeCreation: date < createdDate,
    }));
  }, []);

  const getOverallStats = useMemo((): HabitStats => {
    const weekDates = getWeekDates();
    const totalPossible = habits.length * 7;

    let weeklyCompletions = 0;
    habits.forEach(habit => {
      weekDates.forEach(date => {
        if (habit.completedDates.includes(date)) {
          weeklyCompletions++;
        }
      });
    });

    const totalCompletions = habits.reduce((sum, h) => sum + h.completedDates.length, 0);
    const longestStreak = habits.reduce((max, h) => Math.max(max, h.bestStreak), 0);

    return {
      totalCompletions,
      weeklyCompletionRate: totalPossible > 0 ? weeklyCompletions / totalPossible : 0,
      currentWeekCompletions: weeklyCompletions,
      longestStreak,
    };
  }, [habits]);

  const getMotivationalMessage = useCallback((): string => {
    const today = getToday();
    const completedToday = habits.filter(h => h.completedDates.includes(today)).length;
    const total = habits.length;

    if (total === 0) return "Add your first habit to get started";
    if (completedToday === total) return "Perfect day! All habits complete";
    if (completedToday === 0) return "Start strong today";
    if (completedToday >= total * 0.5) return "Great momentum, keep going!";
    return `${total - completedToday} habits left today`;
  }, [habits]);

  const getAllHabitsCompleted = useCallback((): boolean => {
    if (habits.length === 0) return false;
    const today = getToday();
    return habits.every(h => h.completedDates.includes(today));
  }, [habits]);

  const getCelebrationPhrase = useCallback((): string | null => {
    const habitWithPhrase = habits.find(h => h.celebrationPhrase);
    return habitWithPhrase?.celebrationPhrase || null;
  }, [habits]);

  const getStreakAtRiskHabits = useCallback((): Habit[] => {
    const today = getToday();
    return habits.filter(h =>
      h.completedDates.includes(today) && h.currentStreak > 0
    );
  }, [habits]);

  return {
    habits,
    isLoading: habitsQuery.isLoading,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleHabitCompletion,
    isCompletedToday,
    getWeeklyProgress,
    getOverallStats,
    getMotivationalMessage,
    getAllHabitsCompleted,
    getCelebrationPhrase,
    getStreakAtRiskHabits,
  };
});
