export interface ImplementationIntention {
  when?: string;
  where?: string;
  cue?: string;
}

/** Day of week indices (0 = Sunday, 1 = Monday, ..., 6 = Saturday) */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Habit {
  id: string;
  name: string;
  emoji?: string;
  createdAt: string;
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
