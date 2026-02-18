export type TimeOfDay = 'anytime' | 'morning' | 'afternoon' | 'evening';

export type RepeatOption = 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly';

export interface Subtask {
  id: string;
  title: string;
  emoji?: string;
  completed: boolean;
}

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  /** ISO date string when the task was completed */
  completedAt?: string;
  dueDate: string; // YYYY-MM-DD format
  /** Optional time of day for this task (HH:mm format). If unset, shows as all-day. */
  dueTime?: string;
  priority?: 'low' | 'medium' | 'high';
  /** Whether this is a work-related todo */
  isWork?: boolean;
  /** Emoji icon for the task card */
  emoji?: string;
  /** Background color for the emoji circle (hex, e.g. '#E8D5F5') */
  emojiColor?: string;
  /** Estimated duration in minutes */
  estimatedMinutes?: number;
  /** Time-of-day grouping bucket */
  timeOfDay?: TimeOfDay;
  /** Repeat schedule */
  repeat?: RepeatOption;
  /** Sub-tasks / checklist items */
  subtasks?: Subtask[];
}
