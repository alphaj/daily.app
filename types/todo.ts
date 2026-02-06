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
  /** Energy cost of the task */
  energyLevel?: 'low' | 'medium' | 'high';
}
