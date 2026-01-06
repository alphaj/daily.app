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
