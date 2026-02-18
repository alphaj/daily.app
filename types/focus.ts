export type FocusSessionStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface FocusSession {
  id: string;
  durationMs: number;
  startedAt: string;
  endAt: string;
  pausedAt: string | null;
  accumulatedPauseMs: number;
  status: FocusSessionStatus;
  completedAt: string | null;
  todoId?: string | null;
  todoTitle?: string | null;
  todoEmoji?: string | null;
}

export interface FocusSessionRecord {
  id: string;
  date: string;
  durationMs: number;
  actualMs: number;
  startedAt: string;
  completedAt: string;
  completed: boolean;
  todoId?: string | null;
  todoTitle?: string | null;
  todoEmoji?: string | null;
}
