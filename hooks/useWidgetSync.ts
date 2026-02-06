import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import { useTodos } from '@/contexts/TodoContext';
import { useHabits } from '@/contexts/HabitContext';
import { useSupplements } from '@/contexts/SupplementContext';
import {
  syncAllWidgetData,
  type WidgetTaskData,
  type WidgetHabitData,
  type WidgetSupplementData,
} from '@/modules/widget-data';

function getToday(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getWeekDots(completedDates: string[]): boolean[] {
  const today = new Date();
  const dots: boolean[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    dots.push(completedDates.includes(dateStr));
  }
  return dots;
}

function getWeeklyCompletionRate(completedDates: string[]): number {
  const weekDots = getWeekDots(completedDates);
  const completed = weekDots.filter(Boolean).length;
  return (completed / 7) * 100;
}

/**
 * Hook that automatically syncs app data to iOS widgets via shared UserDefaults.
 * Place this in your root layout or home screen component.
 *
 * On Android/web this is a no-op.
 */
export function useWidgetSync() {
  const { todos } = useTodos();
  const { habits, isCompletedToday } = useHabits();
  const { activeSupplements } = useSupplements();
  const lastSyncRef = useRef<string>('');

  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    const today = getToday();

    // Build a fingerprint to avoid redundant syncs
    const fingerprint = JSON.stringify({
      t: todos.map(t => `${t.id}:${t.completed}`).join(','),
      h: habits.map(h => `${h.id}:${isCompletedToday(h)}`).join(','),
      s: activeSupplements.map(s => `${s.id}:${s.takenDates.includes(today)}`).join(','),
    });

    if (fingerprint === lastSyncRef.current) return;
    lastSyncRef.current = fingerprint;

    // Transform data for the widget
    const todayTodos = todos.filter(t => t.dueDate === today || (!t.completed && t.dueDate <= today));

    const widgetTasks: WidgetTaskData[] = todayTodos.map(t => ({
      id: t.id,
      title: t.title,
      completed: t.completed,
      dueDate: t.dueDate,
      priority: t.priority,
      isWork: t.isWork,
      energyLevel: t.energyLevel,
    }));

    const widgetHabits: WidgetHabitData[] = habits.map(h => ({
      id: h.id,
      name: h.name,
      emoji: h.emoji,
      type: h.type,
      isCompletedToday: isCompletedToday(h),
      currentStreak: h.currentStreak,
      bestStreak: h.bestStreak,
      weeklyCompletionRate: getWeeklyCompletionRate(h.completedDates),
      weekDots: getWeekDots(h.completedDates),
      energyLevel: h.energyLevel,
    }));

    const widgetSupplements: WidgetSupplementData[] = activeSupplements.map(s => ({
      id: s.id,
      name: s.name,
      emoji: s.emoji,
      dosage: s.dosage,
      isTakenToday: s.takenDates.includes(today),
      currentStreak: s.currentStreak,
      timeOfDay: s.timeOfDay,
    }));

    syncAllWidgetData({
      tasks: widgetTasks,
      habits: widgetHabits,
      supplements: widgetSupplements,
    });
  }, [todos, habits, activeSupplements, isCompletedToday]);

  // Also sync when app comes back to foreground (user might have changed date)
  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        // Reset fingerprint to force a re-sync on foreground
        lastSyncRef.current = '';
      }
    });

    return () => subscription.remove();
  }, []);
}
