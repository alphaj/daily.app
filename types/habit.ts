export type HabitFrequency = 'daily' | 'weekdays' | 'weekly';

export interface Habit {
  id: string;
  title: string;
  emoji?: string;
  emojiColor?: string;
  frequency: HabitFrequency;
  /** For 'weekly': which days (0=Sun..6=Sat) */
  weeklyDays?: number[];
  timeOfDay?: 'anytime' | 'morning' | 'afternoon' | 'evening';
  createdAt: string;
  /** Date keys when this habit was completed: { '2026-02-18': true } */
  completions: Record<string, boolean>;
}
