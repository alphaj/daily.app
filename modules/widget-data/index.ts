import { Platform } from 'react-native';

// Types matching the Swift WidgetData models
export interface WidgetTaskData {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string;
  priority?: string;
  isWork?: boolean;
  energyLevel?: string;
}

export interface WidgetHabitData {
  id: string;
  name: string;
  emoji?: string;
  type: string;
  isCompletedToday: boolean;
  currentStreak: number;
  bestStreak: number;
  weeklyCompletionRate: number;
  weekDots: boolean[];
  energyLevel?: string;
}

export interface WidgetSupplementData {
  id: string;
  name: string;
  emoji?: string;
  dosage?: string;
  isTakenToday: boolean;
  currentStreak: number;
  timeOfDay?: string;
}

const APP_GROUP = 'group.app.rork.daily-habit-tracker-t8o4w6l';

// Dynamic import of the native module - only available on iOS after prebuild
let NativeWidgetDataModule: {
  setItem(key: string, value: string, suiteName: string): Promise<void>;
  reloadWidgets(): Promise<void>;
} | null = null;

try {
  if (Platform.OS === 'ios') {
    // The native module will be available after expo prebuild
    const { requireNativeModule } = require('expo-modules-core');
    NativeWidgetDataModule = requireNativeModule('WidgetDataModule');
  }
} catch {
  // Module not available (e.g., web, Android, or before prebuild)
}

async function setSharedData(key: string, jsonString: string): Promise<void> {
  if (!NativeWidgetDataModule) return;
  try {
    await NativeWidgetDataModule.setItem(key, jsonString, APP_GROUP);
  } catch (error) {
    console.warn('[WidgetData] Failed to write shared data:', error);
  }
}

async function reloadWidgets(): Promise<void> {
  if (!NativeWidgetDataModule) return;
  try {
    await NativeWidgetDataModule.reloadWidgets();
  } catch (error) {
    console.warn('[WidgetData] Failed to reload widgets:', error);
  }
}

/**
 * Sync tasks data to the widget
 */
export async function syncTasks(tasks: WidgetTaskData[]): Promise<void> {
  await setSharedData('widget_tasks', JSON.stringify(tasks));
}

/**
 * Sync habits data to the widget
 */
export async function syncHabits(habits: WidgetHabitData[]): Promise<void> {
  await setSharedData('widget_habits', JSON.stringify(habits));
}

/**
 * Sync supplements data to the widget
 */
export async function syncSupplements(supplements: WidgetSupplementData[]): Promise<void> {
  await setSharedData('widget_supplements', JSON.stringify(supplements));
}

/**
 * Sync all widget data and trigger a widget refresh
 */
export async function syncAllWidgetData(data: {
  tasks: WidgetTaskData[];
  habits: WidgetHabitData[];
  supplements: WidgetSupplementData[];
}): Promise<void> {
  await Promise.all([
    syncTasks(data.tasks),
    syncHabits(data.habits),
    syncSupplements(data.supplements),
    setSharedData('widget_last_updated', JSON.stringify(new Date().toISOString())),
  ]);
  await reloadWidgets();
}

/**
 * Trigger a widget timeline reload (call after any data change)
 */
export { reloadWidgets };
