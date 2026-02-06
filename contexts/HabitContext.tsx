import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Habit, ImplementationIntention, DayCompletion, HabitStats, DayOfWeek, HabitType, SlipEntry } from '@/types/habit';
import * as Crypto from 'expo-crypto';
import { scheduleHabitNotification, cancelHabitNotification, rescheduleHabitNotification } from '@/lib/notifications';

const HABITS_STORAGE_KEY = 'daily_habits';

function getToday(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function calculateStreak(completedDates: string[], scheduledDays?: DayOfWeek[]): number {
  if (completedDates.length === 0) return 0;

  const today = getToday();

  let checkDate = new Date();
  if (!completedDates.includes(today)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  let streak = 0;
  const MAX_DAYS = 365 * 5;

  for (let i = 0; i < MAX_DAYS; i++) {
    const dateStr = formatLocalDate(checkDate);

    const dayOfWeek = checkDate.getDay() as DayOfWeek;
    const isScheduled = !scheduledDays || scheduledDays.length === 0 || scheduledDays.includes(dayOfWeek);

    if (!isScheduled) {
      checkDate.setDate(checkDate.getDate() - 1);
      continue;
    }

    if (completedDates.includes(dateStr)) {
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
  return Crypto.randomUUID();
}

/** Normalize date strings by stripping spaces (migration for old format bug) */
function normalizeDateStr(date: string): string {
  return date.replace(/\s/g, '');
}

// --- Rhythm helpers ---

export interface HabitRhythm {
  thisWeek: { completed: number; scheduled: number; rate: number };
  thisMonth: { completed: number; scheduled: number; rate: number };
  lastMonth: { completed: number; scheduled: number; rate: number };
  trend: 'rising' | 'steady' | 'declining';
  monthlyRates: number[];
}

function getCalendarWeekDates(): string[] {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    if (d <= now) {
      dates.push(formatLocalDate(d));
    }
  }
  return dates;
}

function getMonthDates(offset: number): string[] {
  const now = new Date();
  const targetMonth = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const lastDay = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);
  const end = offset === 0 ? now : lastDay;
  const dates: string[] = [];
  for (let d = new Date(targetMonth); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(formatLocalDate(d));
  }
  return dates;
}

function countScheduledDays(dates: string[], scheduledDays?: DayOfWeek[]): number {
  if (!scheduledDays || scheduledDays.length === 0) return dates.length;
  return dates.filter(dateStr => {
    const d = new Date(dateStr + 'T00:00:00');
    return scheduledDays.includes(d.getDay() as DayOfWeek);
  }).length;
}

function countCompletionsInRange(dates: string[], completedDates: string[], scheduledDays?: DayOfWeek[]): number {
  const scheduledSet = new Set(
    dates.filter(dateStr => {
      if (!scheduledDays || scheduledDays.length === 0) return true;
      const d = new Date(dateStr + 'T00:00:00');
      return scheduledDays.includes(d.getDay() as DayOfWeek);
    })
  );
  return completedDates.filter(d => scheduledSet.has(d)).length;
}

export function getHabitRhythm(habit: Habit): HabitRhythm {
  const weekDates = getCalendarWeekDates();
  const thisMonthDates = getMonthDates(0);
  const lastMonthDates = getMonthDates(-1);

  const weekScheduled = countScheduledDays(weekDates, habit.scheduledDays);
  const weekCompleted = countCompletionsInRange(weekDates, habit.completedDates, habit.scheduledDays);

  const monthScheduled = countScheduledDays(thisMonthDates, habit.scheduledDays);
  const monthCompleted = countCompletionsInRange(thisMonthDates, habit.completedDates, habit.scheduledDays);

  const lastMonthScheduled = countScheduledDays(lastMonthDates, habit.scheduledDays);
  const lastMonthCompleted = countCompletionsInRange(lastMonthDates, habit.completedDates, habit.scheduledDays);

  const thisMonthRate = monthScheduled > 0 ? monthCompleted / monthScheduled : 0;
  const lastMonthRate = lastMonthScheduled > 0 ? lastMonthCompleted / lastMonthScheduled : 0;

  const diff = thisMonthRate - lastMonthRate;
  const trend: 'rising' | 'steady' | 'declining' = diff > 0.05 ? 'rising' : diff < -0.05 ? 'declining' : 'steady';

  // Last 4 rolling 7-day windows for sparkline
  const monthlyRates: number[] = [];
  const today = new Date();
  for (let w = 3; w >= 0; w--) {
    const windowDates: string[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() - (w * 7 + d));
      windowDates.push(formatLocalDate(date));
    }
    const scheduled = countScheduledDays(windowDates, habit.scheduledDays);
    const completed = countCompletionsInRange(windowDates, habit.completedDates, habit.scheduledDays);
    monthlyRates.push(scheduled > 0 ? completed / scheduled : 0);
  }

  return {
    thisWeek: { completed: weekCompleted, scheduled: weekScheduled, rate: weekScheduled > 0 ? weekCompleted / weekScheduled : 0 },
    thisMonth: { completed: monthCompleted, scheduled: monthScheduled, rate: thisMonthRate },
    lastMonth: { completed: lastMonthCompleted, scheduled: lastMonthScheduled, rate: lastMonthRate },
    trend,
    monthlyRates,
  };
}

// --- Insights helpers ---

export interface HabitInsights {
  bestDay: { name: string; rate: number };
  hardestDay: { name: string; rate: number };
  momentum: number[];
  totalCompletions: number;
  averageCompletionsPerWeek: number;
}

export function getHabitInsights(habit: Habit): HabitInsights {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const createdDate = new Date(habit.createdAt.split('T')[0] + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Count how many of each weekday since creation
  const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];
  const weekdayCompletions = [0, 0, 0, 0, 0, 0, 0];

  for (let d = new Date(createdDate); d <= today; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay();
    const isScheduled = !habit.scheduledDays || habit.scheduledDays.length === 0 || habit.scheduledDays.includes(dow as DayOfWeek);
    if (isScheduled) {
      weekdayCounts[dow]++;
      if (habit.completedDates.includes(formatLocalDate(d))) {
        weekdayCompletions[dow]++;
      }
    }
  }

  const dayRates = dayNames.map((name, i) => ({
    name,
    rate: weekdayCounts[i] > 0 ? weekdayCompletions[i] / weekdayCounts[i] : 0,
  }));

  const activeDayRates = dayRates.filter((_, i) => weekdayCounts[i] > 0);
  const bestDay = activeDayRates.length > 0
    ? activeDayRates.reduce((a, b) => a.rate >= b.rate ? a : b)
    : { name: 'N/A', rate: 0 };
  const hardestDay = activeDayRates.length > 0
    ? activeDayRates.reduce((a, b) => a.rate <= b.rate ? a : b)
    : { name: 'N/A', rate: 0 };

  // Momentum: last 4 rolling week rates
  const momentum: number[] = [];
  const todayForMomentum = new Date();
  for (let w = 3; w >= 0; w--) {
    const windowDates: string[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(todayForMomentum);
      date.setDate(todayForMomentum.getDate() - (w * 7 + d));
      windowDates.push(formatLocalDate(date));
    }
    const scheduled = countScheduledDays(windowDates, habit.scheduledDays);
    const completed = countCompletionsInRange(windowDates, habit.completedDates, habit.scheduledDays);
    momentum.push(scheduled > 0 ? completed / scheduled : 0);
  }

  // Average completions per week
  const daysSinceCreation = Math.max(1, Math.floor((todayForMomentum.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));
  const weeksSinceCreation = Math.max(1, daysSinceCreation / 7);

  return {
    bestDay,
    hardestDay,
    momentum,
    totalCompletions: habit.completedDates.length,
    averageCompletionsPerWeek: habit.completedDates.length / weeksSinceCreation,
  };
}

export const [HabitProvider, useHabits] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [habits, setHabits] = useState<Habit[]>([]);

  const habitsQuery = useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(HABITS_STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      // Migration: normalize dates, add type, migrate slipDates -> slipLog
      const migrated = parsed.map((h: any) => {
        const completedDates = (h.completedDates || []).map(normalizeDateStr);
        let slipLog: SlipEntry[] = h.slipLog || [];
        if ((!slipLog.length) && h.slipDates && h.slipDates.length > 0) {
          slipLog = h.slipDates.map((d: string) => ({ date: normalizeDateStr(d) }));
        }
        return {
          ...h,
          type: h.type || 'building',
          completedDates,
          slipDates: (h.slipDates || []).map(normalizeDateStr),
          slipLog,
        };
      });
      return migrated as Habit[];
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
    energyLevel?: 'low' | 'medium' | 'high',
    preferredTime?: string
  ) => {
    // Fix: generate ID once and use for both notification and habit
    const habitId = generateId();

    const notificationIds = await scheduleHabitNotification(
      habitId,
      name,
      emoji || '⚡',
      scheduledDays?.map(d => d as number),
      preferredTime
    );

    const newHabit: Habit = {
      id: habitId,
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
      slipLog: [],
      energyLevel,
      preferredTime,
      notificationIds,
    };

    const newHabits = [...habits, newHabit];
    setHabits(newHabits);
    await saveHabits(newHabits);
  }, [habits, saveHabits]);

  const updateHabit = useCallback(async (
    id: string,
    updates: Partial<Pick<Habit, 'name' | 'intention' | 'emoji' | 'whyStatement' | 'celebrationPhrase' | 'scheduledDays' | 'preferredTime' | 'energyLevel' | 'isWork' | 'triggerNotes'>>
  ) => {
    const habit = habits.find(h => h.id === id);
    let notificationIds = habit?.notificationIds;

    if (habit && ('scheduledDays' in updates || 'preferredTime' in updates || 'name' in updates || 'emoji' in updates)) {
      const newScheduledDays = updates.scheduledDays ?? habit.scheduledDays;
      const newPreferredTime = updates.preferredTime ?? habit.preferredTime;
      const newName = updates.name ?? habit.name;
      const newEmoji = updates.emoji ?? habit.emoji;
      notificationIds = await rescheduleHabitNotification(
        habit.notificationIds || [],
        id,
        newName,
        newEmoji || '⚡',
        newScheduledDays?.map(d => d as number),
        newPreferredTime
      );
    }

    const newHabits = habits.map(h =>
      h.id === id ? { ...h, ...updates, notificationIds } : h
    );
    setHabits(newHabits);
    await saveHabits(newHabits);
  }, [habits, saveHabits]);

  const deleteHabit = useCallback(async (id: string) => {
    const habit = habits.find(h => h.id === id);
    if (habit?.notificationIds) {
      await cancelHabitNotification(habit.notificationIds);
    }
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

    const habitsToday = habits.filter(h =>
      !h.scheduledDays || h.scheduledDays.length === 0 || h.scheduledDays.includes(dayOfWeek)
    );

    const completedToday = habitsToday.filter(h => h.completedDates.includes(today)).length;
    const total = habitsToday.length;

    if (total === 0) return "No habits scheduled for today";
    if (completedToday === total) return "Perfect day! All habits complete";

    // Rhythm-aware messages
    const avgMonthlyRate = habits.length > 0
      ? habits.reduce((sum, h) => sum + getHabitRhythm(h).thisMonth.rate, 0) / habits.length
      : 0;

    if (completedToday === 0 && avgMonthlyRate >= 0.7) {
      return "Welcome back. Your rhythm is still strong.";
    }
    if (completedToday === 0) return "Start strong today";
    if (completedToday >= total * 0.5) {
      const pct = Math.round(avgMonthlyRate * 100);
      if (pct >= 80) return `${pct}% this month \u2014 keep the momentum`;
      return "Great momentum, keep going!";
    }
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

  // Fix: return habits NOT completed today that have an active streak
  const getStreakAtRiskHabits = useCallback((): Habit[] => {
    const today = getToday();
    return habits.filter(h =>
      !h.completedDates.includes(today) && h.currentStreak > 0
    );
  }, [habits]);

  /** Log a slip with optional trigger context for breaking habits */
  const logSlip = useCallback(async (id: string, trigger?: SlipEntry['trigger'], strategy?: string): Promise<void> => {
    const today = getToday();
    const habit = habits.find(h => h.id === id);
    if (!habit || habit.type !== 'breaking') return;

    const slipEntry: SlipEntry = { date: today, trigger, strategy };
    const newSlipLog = [...(habit.slipLog || []), slipEntry];
    const newSlipDates = [...(habit.slipDates || []), today];
    const newCompletedDates = habit.completedDates.filter(d => d !== today);

    const newHabits = habits.map(h =>
      h.id === id
        ? {
          ...h,
          slipLog: newSlipLog,
          slipDates: newSlipDates,
          completedDates: newCompletedDates,
          currentStreak: 0,
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

  const buildingHabits = useMemo(() => habits.filter(h => h.type === 'building'), [habits]);
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
