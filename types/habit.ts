export interface ImplementationIntention {
  when?: string;
  where?: string;
  cue?: string;
}

/** Day of week indices (0 = Sunday, 1 = Monday, ..., 6 = Saturday) */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Type of habit: building (want to do) vs breaking (want to stop) */
export type HabitType = 'building' | 'breaking';

export interface Habit {
  id: string;
  name: string;
  /** Type of habit: 'building' for positive habits, 'breaking' for habits to quit */
  type: HabitType;
  emoji?: string;
  createdAt: string;
  /** For building: dates completed. For breaking: dates maintained (clean days) */
  completedDates: string[];
  currentStreak: number;
  bestStreak: number;
  intention?: ImplementationIntention;
  /** User's personal reason for building this habit */
  whyStatement?: string;
  /** 3-word celebration phrase shown when all habits are complete */
  celebrationPhrase?: string;
  /** Days of week this habit should be tracked (0-6, Sunday-Saturday). Empty/undefined = every day */
  scheduledDays?: DayOfWeek[];
  /** Whether this is a work-related habit */
  isWork?: boolean;
  /** For breaking habits: optional notes about triggers */
  triggerNotes?: string;
  /** For breaking habits: dates when user slipped */
  slipDates?: string[];
}

export interface HabitStats {
  totalCompletions: number;
  weeklyCompletionRate: number;
  currentWeekCompletions: number;
  longestStreak: number;
}

export interface DayCompletion {
  date: string;
  dayName: string;
  isToday: boolean;
  completed: boolean;
  isBeforeCreation?: boolean;
}
