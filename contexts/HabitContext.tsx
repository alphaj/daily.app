import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useMemo } from 'react';
import type { Habit, ImplementationIntention, DayCompletion, HabitStats } from '@/types/habit';

const STORAGE_KEY = 'daily_habits';

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

export const [HabitProvider, useHabits] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [habits, setHabits] = useState<Habit[]>([]);

  const habitsQuery = useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (habits: Habit[]) => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
      return habits;
    },
    onSuccess: (habits) => {
      queryClient.setQueryData(['habits'], habits);
    }
  });

  useEffect(() => {
    if (habitsQuery.data) {
      setHabits(habitsQuery.data);
    }
  }, [habitsQuery.data]);

  const addHabit = (name: string, intention?: ImplementationIntention) => {
    const newHabit: Habit = {
      id: Date.now().toString(),
      name,
      createdAt: new Date().toISOString(),
      completedDates: [],
      currentStreak: 0,
      bestStreak: 0,
      intention,
    };
    const updated = [...habits, newHabit];
    setHabits(updated);
    saveMutation.mutate(updated);
  };

  const updateHabit = (id: string, updates: Partial<Pick<Habit, 'name' | 'intention'>>) => {
    const updated = habits.map(habit => 
      habit.id === id ? { ...habit, ...updates } : habit
    );
    setHabits(updated);
    saveMutation.mutate(updated);
  };

  const deleteHabit = (id: string) => {
    const updated = habits.filter(h => h.id !== id);
    setHabits(updated);
    saveMutation.mutate(updated);
  };

  const toggleHabitCompletion = (id: string): boolean => {
    const today = getToday();
    let wasCompleted = false;
    
    const updated = habits.map(habit => {
      if (habit.id === id) {
        const isCompleted = habit.completedDates.includes(today);
        wasCompleted = !isCompleted;
        
        const newCompletedDates = isCompleted
          ? habit.completedDates.filter(d => d !== today)
          : [...habit.completedDates, today];
        
        const currentStreak = calculateStreak(newCompletedDates);
        const bestStreak = Math.max(habit.bestStreak, currentStreak);
        
        return {
          ...habit,
          completedDates: newCompletedDates,
          currentStreak,
          bestStreak,
        };
      }
      return habit;
    });
    setHabits(updated);
    saveMutation.mutate(updated);
    return wasCompleted;
  };

  const isCompletedToday = (habit: Habit): boolean => {
    return habit.completedDates.includes(getToday());
  };

  const getWeeklyProgress = (habit: Habit): DayCompletion[] => {
    const weekDates = getWeekDates();
    const today = getToday();
    
    return weekDates.map(date => ({
      date,
      dayName: getDayName(date),
      isToday: date === today,
      completed: habit.completedDates.includes(date),
    }));
  };

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

  const getMotivationalMessage = (): string => {
    const today = getToday();
    const completedToday = habits.filter(h => h.completedDates.includes(today)).length;
    const total = habits.length;
    
    if (total === 0) return "Add your first habit to get started";
    if (completedToday === total) return "Perfect day! All habits complete";
    if (completedToday === 0) return "Start strong today";
    if (completedToday >= total * 0.5) return "Great momentum, keep going!";
    return `${total - completedToday} habits left today`;
  };

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
  };
});
