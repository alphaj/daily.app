import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Habit, ImplementationIntention, DayCompletion, HabitStats } from '@/types/habit';

interface DbHabit {
  id: string;
  user_id: string;
  name: string;
  emoji: string | null;
  intention_when: string | null;
  intention_where: string | null;
  intention_cue: string | null;
  why_statement: string | null;
  celebration_phrase: string | null;
  current_streak: number;
  best_streak: number;
  created_at: string;
}

interface DbHabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  completed_date: string;
}

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

function mapDbHabitToHabit(dbHabit: DbHabit, completions: DbHabitCompletion[]): Habit {
  const completedDates = completions
    .filter(c => c.habit_id === dbHabit.id)
    .map(c => c.completed_date);

  const intention: ImplementationIntention | undefined =
    dbHabit.intention_when || dbHabit.intention_where || dbHabit.intention_cue
      ? {
        when: dbHabit.intention_when || undefined,
        where: dbHabit.intention_where || undefined,
        cue: dbHabit.intention_cue || undefined,
      }
      : undefined;

  return {
    id: dbHabit.id,
    name: dbHabit.name,
    emoji: dbHabit.emoji || undefined,
    createdAt: dbHabit.created_at,
    completedDates,
    currentStreak: dbHabit.current_streak,
    bestStreak: dbHabit.best_streak,
    intention,
    whyStatement: dbHabit.why_statement || undefined,
    celebrationPhrase: dbHabit.celebration_phrase || undefined,
  };
}

export const [HabitProvider, useHabits] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);

  const habitsQuery = useQuery({
    queryKey: ['habits', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const [habitsRes, completionsRes] = await Promise.all([
        supabase.from('habits').select('*').eq('user_id', user.id),
        supabase.from('habit_completions').select('*').eq('user_id', user.id),
      ]);

      if (habitsRes.error) throw habitsRes.error;
      if (completionsRes.error) throw completionsRes.error;

      const dbHabits = habitsRes.data as DbHabit[];
      const dbCompletions = completionsRes.data as DbHabitCompletion[];

      return dbHabits.map(h => mapDbHabitToHabit(h, dbCompletions));
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (habitsQuery.data) {
      setHabits(habitsQuery.data);
    }
  }, [habitsQuery.data]);

  const addHabit = useCallback(async (
    name: string,
    intention?: ImplementationIntention,
    emoji?: string,
    whyStatement?: string,
    celebrationPhrase?: string
  ) => {
    if (!user) return;

    const { error } = await supabase.from('habits').insert({
      user_id: user.id,
      name,
      emoji: emoji || null,
      intention_when: intention?.when || null,
      intention_where: intention?.where || null,
      intention_cue: intention?.cue || null,
      why_statement: whyStatement || null,
      celebration_phrase: celebrationPhrase || null,
    });

    if (error) {
      console.error('Failed to add habit:', error);
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['habits', user.id] });
  }, [user, queryClient]);

  const updateHabit = useCallback(async (
    id: string,
    updates: Partial<Pick<Habit, 'name' | 'intention' | 'emoji' | 'whyStatement' | 'celebrationPhrase'>>
  ) => {
    if (!user) return;

    const { error } = await supabase
      .from('habits')
      .update({
        name: updates.name,
        emoji: updates.emoji || null,
        intention_when: updates.intention?.when || null,
        intention_where: updates.intention?.where || null,
        intention_cue: updates.intention?.cue || null,
        why_statement: updates.whyStatement || null,
        celebration_phrase: updates.celebrationPhrase || null,
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Failed to update habit:', error);
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['habits', user.id] });
  }, [user, queryClient]);

  const deleteHabit = useCallback(async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Failed to delete habit:', error);
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['habits', user.id] });
  }, [user, queryClient]);

  const toggleHabitCompletion = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    const today = getToday();
    const habit = habits.find(h => h.id === id);
    if (!habit) return false;

    const isCompleted = habit.completedDates.includes(today);

    if (isCompleted) {
      // Remove completion
      const { error } = await supabase
        .from('habit_completions')
        .delete()
        .eq('habit_id', id)
        .eq('user_id', user.id)
        .eq('completed_date', today);

      if (error) {
        console.error('Failed to remove habit completion:', error);
        return false;
      }
    } else {
      // Add completion
      const { error } = await supabase
        .from('habit_completions')
        .insert({
          habit_id: id,
          user_id: user.id,
          completed_date: today,
        });

      if (error) {
        console.error('Failed to add habit completion:', error);
        return false;
      }
    }

    // Update streak
    const newCompletedDates = isCompleted
      ? habit.completedDates.filter(d => d !== today)
      : [...habit.completedDates, today];

    const currentStreak = calculateStreak(newCompletedDates);
    const bestStreak = Math.max(habit.bestStreak, currentStreak);

    await supabase
      .from('habits')
      .update({ current_streak: currentStreak, best_streak: bestStreak })
      .eq('id', id)
      .eq('user_id', user.id);

    queryClient.invalidateQueries({ queryKey: ['habits', user.id] });
    return !isCompleted;
  }, [user, habits, queryClient]);

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
