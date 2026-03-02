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
  /** Hide this item from buddy view */
  isPrivate?: boolean;
  /** User ID of the buddy who assigned this task */
  assignedById?: string;
  /** Display name of the buddy who assigned this task */
  assignedByName?: string;
  /** Whether this is a default-seeded task from onboarding */
  isDefault?: boolean;
  /** Original due date before rollover (YYYY-MM-DD). If unset, dueDate is the original. */
  originalDueDate?: string;
  /** ID of the completed task that spawned this repeat instance (duplicate prevention) */
  repeatSourceId?: string;
  /** Whether this is a "do together" collaborative task */
  isTogether?: boolean;
  /** Shared UUID linking both users' copies of this together task */
  togetherGroupId?: string;
  /** The other user's ID for this together task */
  togetherPartnerId?: string;
  /** Display name of the together partner */
  togetherPartnerName?: string;
  /** Avatar URL of the together partner */
  togetherPartnerAvatarUrl?: string;
  /** Whether the partner has completed their copy */
  partnerCompleted?: boolean;
}
