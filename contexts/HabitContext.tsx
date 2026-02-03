import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Habit, ImplementationIntention, DayCompletion, HabitStats, DayOfWeek, HabitType } from '@/types/habit';
import * as Crypto from 'expo-crypto';
import { scheduleHabitNotification, cancelHabitNotification, rescheduleHabitNotification } from '@/lib/notifications';

const HABITS_STORAGE_KEY = 'daily_habits';

function getToday(): string {
  // Uses local time instead of UTC to avoid "tormorrow" bug late at night
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year} -${month} -${day} `;
}

function calculateStreak(completedDates: string[], scheduledDays?: DayOfWeek[]): number {
  if (completedDates.length === 0) return 0;

  const sortedDates = [...completedDates].sort().reverse();
  const today = getToday();
  const lastCompleted = sortedDates[0];

  // If the last completion was before yesterday (and strictly needed), streak might be broken.
  // But we'll iterate day by day backwards from "today" (or yesterday if not done today) to count.

  // We allow "today" to be missing (streak remains if done yesterday)
  // If today is completed, start check from today.
  // If today is NOT completed, start check from yesterday.

  let checkDate = new Date();
  if (!completedDates.includes(today)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  let streak = 0;
  // Safety break to prevent infinite loops (e.g. 5 years)
  const MAX_DAYS = 365 * 5;

  for (let i = 0; i < MAX_DAYS; i++) {
    const year = checkDate.getFullYear();
    const month = String(checkDate.getMonth() + 1).padStart(2, '0');
    const day = String(checkDate.getDate()).padStart(2, '0');
    const dateStr = `${year} -${month} -${day} `;

    // Check if this day is scheduled
    // If scheduledDays is undefined/null, assume EVERY DAY (legacy/default behavior)
    const dayOfWeek = checkDate.getDay() as DayOfWeek;
    const isScheduled = !scheduledDays || scheduledDays.length === 0 || scheduledDays.includes(dayOfWeek);

    if (!isScheduled) {
      // Skip this day, it doesn't break the streak
      checkDate.setDate(checkDate.getDate() - 1);
      continue;
    }

    // It is a scheduled day, so it MUST be completed
    if (completedDates.includes(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      // Missed a scheduled day -> streak ends
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
  return Crypto.randomUUID();
}

export const [HabitProvider, useHabits] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [habits, setHabits] = useState<Habit[]>([]);

  const habitsQuery = useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(HABITS_STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      // Migrate existing habits without type to 'building'
      return parsed.map((h: Habit) => ({
        ...h,
        type: h.type || 'building',
        slipDates: h.slipDates || [],
      }));
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
    celebrationPhrase?: string,
    scheduledDays?: DayOfWeek[],
    isWork?: boolean,
    habitType: HabitType = 'building',
    triggerNotes?: string,
    energyLevel?: 'low' | 'medium' | 'high'
  ) => {
    const newHabit: Habit = {
      id: generateId(),
      name,
      type: habitType,
      emoji,
      createdAt: new Date().toISOString(),
      completedDates: [],
      currentStreak: 0,
      bestStreak: 0,
      intention,
      whyStatement,
      celebrationPhrase,
      scheduledDays,
      isWork,
      triggerNotes,
      slipDates: [],
      energyLevel,
    };

    const newHabits = [...habits, newHabit];
    setHabits(newHabits);
    await saveHabits(newHabits);
  }, [habits, saveHabits]);

  const updateHabit = useCallback(async (
    id: string,
    updates: Partial<Pick<Habit, 'name' | 'intention' | 'emoji' | 'whyStatement' | 'celebrationPhrase' | 'scheduledDays'>>
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

    const currentStreak = calculateStreak(newCompletedDates, habit.scheduledDays);
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
    const dayOfWeek = new Date().getDay() as DayOfWeek;

    // Filter habits that are active today
    const habitsToday = habits.filter(h =>
      !h.scheduledDays || h.scheduledDays.length === 0 || h.scheduledDays.includes(dayOfWeek)
    );

    const completedToday = habitsToday.filter(h => h.completedDates.includes(today)).length;
    const total = habitsToday.length;

    if (total === 0) return "No habits scheduled for today";
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

  /** Log a slip for a breaking habit - resets streak */
  const logSlip = useCallback(async (id: string): Promise<void> => {
    const today = getToday();
    const habit = habits.find(h => h.id === id);
    if (!habit || habit.type !== 'breaking') return;

    const newSlipDates = [...(habit.slipDates || []), today];
    // Remove today from completed dates if present
    const newCompletedDates = habit.completedDates.filter(d => d !== today);

    const newHabits = habits.map(h =>
      h.id === id
        ? {
          ...h,
          slipDates: newSlipDates,
          completedDates: newCompletedDates,
          currentStreak: 0  // Reset streak on slip
        }
        : h
    );

    setHabits(newHabits);
    await saveHabits(newHabits);
  }, [habits, saveHabits]);

  /** Get habits filtered by type */
  const getHabitsByType = useCallback((type: HabitType): Habit[] => {
    return habits.filter(h => h.type === type);
  }, [habits]);

  /** Get building habits */
  const buildingHabits = useMemo(() => habits.filter(h => h.type === 'building'), [habits]);

  /** Get breaking habits */
  const breakingHabits = useMemo(() => habits.filter(h => h.type === 'breaking'), [habits]);

  return {
    habits,
    buildingHabits,
    breakingHabits,
    isLoading: habitsQuery.isLoading,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleHabitCompletion,
    logSlip,
    isCompletedToday,
    getWeeklyProgress,
    getOverallStats,
    getMotivationalMessage,
    getAllHabitsCompleted,
    getCelebrationPhrase,
    getStreakAtRiskHabits,
    getHabitsByType,
  };
});
