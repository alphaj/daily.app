export interface ImplementationIntention {
  when?: string;
  where?: string;
  cue?: string;
}

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
