import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import type { Todo } from '@/types/todo';

import type { FocusSessionRecord } from '@/types/focus';
import type { BuddyInteraction } from '@/types/interaction';

const TODOS_KEY = 'daily_todos';

const FOCUS_HISTORY_KEY = 'daily_focus_history';

// ── Push local data to Supabase ────────────────────────────────────

export async function pushTodos(userId: string): Promise<void> {
  const raw = await AsyncStorage.getItem(TODOS_KEY);
  if (!raw) return;

  const todos: Todo[] = JSON.parse(raw);
  if (todos.length === 0) return;

  const rows = todos.map((t) => ({
    id: t.id,
    user_id: userId,
    title: t.title,
    completed: t.completed,
    created_at: t.createdAt,
    completed_at: t.completedAt ?? null,
    due_date: t.dueDate,
    due_time: t.dueTime ?? null,
    priority: t.priority ?? null,
    is_work: t.isWork ?? false,
    emoji: t.emoji ?? null,
    emoji_color: t.emojiColor ?? null,
    estimated_minutes: t.estimatedMinutes ?? null,
    time_of_day: t.timeOfDay ?? null,
    repeat: t.repeat ?? null,
    subtasks: t.subtasks ? JSON.stringify(t.subtasks) : null,
    is_private: t.isPrivate ?? false,
    assigned_by_id: t.assignedById ?? null,
    assigned_by_name: t.assignedByName ?? null,
    is_together: t.isTogether ?? false,
    together_group_id: t.togetherGroupId ?? null,
    together_partner_id: t.togetherPartnerId ?? null,
    synced_at: new Date().toISOString(),
  }));

  // Upsert all todos
  const { error } = await supabase
    .from('synced_todos')
    .upsert(rows, { onConflict: 'id,user_id' });

  if (error) {
    console.error('[sync] Failed to push todos:', error.message);
    return;
  }

  // Delete todos from cloud that no longer exist locally
  const localIds = todos.map((t) => t.id);
  const { error: deleteError } = await supabase
    .from('synced_todos')
    .delete()
    .eq('user_id', userId)
    .not('id', 'in', `(${localIds.join(',')})`);

  if (deleteError) {
    console.error('[sync] Failed to clean stale todos:', deleteError.message);
  }
}

export async function pushFocusSessions(userId: string): Promise<void> {
  const raw = await AsyncStorage.getItem(FOCUS_HISTORY_KEY);
  if (!raw) return;

  const sessions: FocusSessionRecord[] = JSON.parse(raw);
  if (sessions.length === 0) return;

  // Deduplicate by id, keeping the last occurrence (most recent)
  const deduped = [...new Map(sessions.map((s) => [s.id, s] as const)).values()];

  const rows = deduped.map((s) => ({
    id: s.id,
    user_id: userId,
    date: s.date,
    duration_ms: s.durationMs,
    actual_ms: s.actualMs,
    started_at: s.startedAt,
    completed_at: s.completedAt,
    completed: s.completed,
    todo_title: s.todoTitle ?? null,
    todo_emoji: s.todoEmoji ?? null,
    synced_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('synced_focus_sessions')
    .upsert(rows, { onConflict: 'id,user_id' });

  if (error) {
    console.error('[sync] Failed to push focus sessions:', error.message);
  }
}

// ── Push everything ────────────────────────────────────────────────

export async function pushAllData(userId: string): Promise<void> {
  await Promise.all([
    pushTodos(userId),
    pushFocusSessions(userId),
    supabase.rpc('update_last_active'),
  ]);
  console.log('[sync] Push complete');
}

// ── Pull buddy data ──────────────────────────────────────────────

export interface BuddyData {
  todos: BuddyTodo[];
  focusSessions: BuddyFocusSession[];
}

export interface BuddyTodo {
  id: string;
  title: string;
  completed: boolean;
  completedAt: string | null;
  dueDate: string;
  dueTime: string | null;
  priority: string | null;
  isWork: boolean;
  emoji: string | null;
  emojiColor: string | null;
  estimatedMinutes: number | null;
  timeOfDay: string | null;
  subtasks: any[] | null;
  assignedById: string | null;
  assignedByName: string | null;
}

export interface BuddyFocusSession {
  id: string;
  date: string;
  durationMs: number;
  actualMs: number;
  startedAt: string;
  completedAt: string;
  todoTitle: string | null;
  todoEmoji: string | null;
}

export type BuddyPrivacyMode = 'visible' | 'private' | null;

export async function fetchBuddyPrivacyMode(partnerUserId: string): Promise<BuddyPrivacyMode> {
  const { data, error } = await supabase.rpc('get_partner_privacy_mode', {
    partner_user_id: partnerUserId,
  });

  if (error) {
    console.error('[sync] Failed to fetch partner privacy mode:', error.message);
    return null;
  }

  return data as BuddyPrivacyMode;
}

export async function fetchBuddyLastActive(partnerUserId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('get_partner_last_active', {
    partner_user_id: partnerUserId,
  });

  if (error) {
    console.error('[sync] Failed to fetch partner last active:', error.message);
    return null;
  }

  return data as string | null;
}

export async function pullBuddyData(partnerId: string, date?: string): Promise<BuddyData> {
  const targetDate = date ?? new Date().toISOString().split('T')[0];

  const [todosRes, focusRes] = await Promise.all([
    supabase
      .from('synced_todos')
      .select('id, title, completed, completed_at, due_date, due_time, priority, is_work, emoji, emoji_color, estimated_minutes, time_of_day, subtasks, assigned_by_id, assigned_by_name')
      .eq('user_id', partnerId)
      .eq('is_private', false)
      .or(`due_date.eq.${targetDate},and(due_date.lt.${targetDate},completed.eq.false)`),

    supabase
      .from('synced_focus_sessions')
      .select('id, date, duration_ms, actual_ms, started_at, completed_at, todo_title, todo_emoji')
      .eq('user_id', partnerId)
      .eq('date', targetDate),
  ]);

  return {
    todos: (todosRes.data ?? []).map((r: any) => ({
      id: r.id,
      title: r.title,
      completed: r.completed,
      completedAt: r.completed_at,
      dueDate: r.due_date,
      dueTime: r.due_time,
      priority: r.priority,
      isWork: r.is_work,
      emoji: r.emoji,
      emojiColor: r.emoji_color,
      estimatedMinutes: r.estimated_minutes,
      timeOfDay: r.time_of_day,
      subtasks: r.subtasks ? (typeof r.subtasks === 'string' ? JSON.parse(r.subtasks) : r.subtasks) : null,
      assignedById: r.assigned_by_id,
      assignedByName: r.assigned_by_name,
    })),
    focusSessions: (focusRes.data ?? []).map((r: any) => ({
      id: r.id,
      date: r.date,
      durationMs: r.duration_ms,
      actualMs: r.actual_ms,
      startedAt: r.started_at,
      completedAt: r.completed_at,
      todoTitle: r.todo_title,
      todoEmoji: r.todo_emoji,
    })),
  };
}

// ── Assign tasks to buddy ────────────────────────────────────────

export interface AssignedTask {
  id: string;
  assigner_id: string;
  assigner_name: string;
  title: string;
  created_at: string;
  due_date: string;
  due_time: string | null;
  priority: string | null;
  is_work: boolean;
  emoji: string | null;
  emoji_color: string | null;
  estimated_minutes: number | null;
  time_of_day: string | null;
  repeat: string | null;
  subtasks: any | null;
}

export async function assignTaskToBuddy(task: {
  id: string;
  title: string;
  createdAt: string;
  dueDate: string;
  dueTime?: string;
  priority?: string;
  isWork?: boolean;
  emoji?: string;
  emojiColor?: string;
  estimatedMinutes?: number;
  timeOfDay?: string;
  repeat?: string;
  subtasks?: any[];
}, partnerId?: string): Promise<{ success?: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('assign_task_to_partner', {
    task_id: task.id,
    task_title: task.title,
    task_created_at: task.createdAt,
    task_due_date: task.dueDate,
    task_due_time: task.dueTime ?? null,
    task_priority: task.priority ?? null,
    task_is_work: task.isWork ?? false,
    task_emoji: task.emoji ?? null,
    task_emoji_color: task.emojiColor ?? null,
    task_estimated_minutes: task.estimatedMinutes ?? null,
    task_time_of_day: task.timeOfDay ?? null,
    task_repeat: task.repeat ?? null,
    task_subtasks: task.subtasks ? JSON.stringify(task.subtasks) : null,
    p_partner_id: partnerId ?? null,
  });

  if (error) {
    console.error('[sync] Failed to assign task:', error.message);
    return { error: error.message };
  }

  const result = data as any;
  if (result?.error) {
    return { error: result.error };
  }

  // Fire-and-forget push notification to assignee
  if (result?.assignee_id && result?.assigner_name) {
    supabase.functions.invoke('send-push-notification', {
      body: {
        assignee_id: result.assignee_id,
        task_title: task.title,
        assigner_name: result.assigner_name,
      },
    }).catch((err) => {
      console.log('[sync] Push notification failed (non-blocking):', err);
    });
  }

  return { success: true };
}

export async function pullAssignedTasks(userId: string): Promise<AssignedTask[]> {
  const { data, error } = await supabase
    .from('assigned_tasks')
    .select('id, assigner_id, assigner_name, title, created_at, due_date, due_time, priority, is_work, emoji, emoji_color, estimated_minutes, time_of_day, repeat, subtasks')
    .eq('assignee_id', userId)
    .eq('status', 'pending');

  if (error) {
    console.error('[sync] Failed to pull assigned tasks:', error.message);
    return [];
  }

  return (data ?? []) as AssignedTask[];
}

export async function markAssignedTasksDelivered(ids: string[]): Promise<void> {
  if (ids.length === 0) return;

  const { error } = await supabase
    .from('assigned_tasks')
    .update({ status: 'delivered', delivered_at: new Date().toISOString() })
    .in('id', ids);

  if (error) {
    console.error('[sync] Failed to mark assigned tasks delivered:', error.message);
  }
}

export async function deleteAssignedTask(taskId: string, partnerId: string): Promise<{ success?: boolean; error?: string }> {
  // Delete from partner's synced_todos (the task we assigned to them)
  const { error: syncError } = await supabase
    .from('synced_todos')
    .delete()
    .eq('id', taskId)
    .eq('user_id', partnerId);

  if (syncError) {
    console.error('[sync] Failed to delete from synced_todos:', syncError.message);
  }

  // Also delete from assigned_tasks table
  const { error: assignError } = await supabase
    .from('assigned_tasks')
    .delete()
    .eq('id', taskId);

  if (assignError) {
    console.error('[sync] Failed to delete from assigned_tasks:', assignError.message);
  }

  if (syncError && assignError) {
    return { error: syncError.message };
  }

  return { success: true };
}

// ── Buddy interactions (reactions & nudges) ──────────────────────

export async function sendReaction(todoId: string, emoji: string, partnerId?: string): Promise<{ success?: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('send_reaction', {
    p_target_todo_id: todoId,
    p_emoji: emoji,
    p_partner_id: partnerId ?? null,
  });

  if (error) {
    console.error('[sync] Failed to send reaction:', error.message);
    return { error: error.message };
  }

  const result = data as any;
  if (result?.error) return { error: result.error };
  return { success: true };
}

export async function sendNudge(emoji: string, message: string, partnerId?: string): Promise<{ success?: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('send_nudge', {
    p_emoji: emoji,
    p_message: message,
    p_partner_id: partnerId ?? null,
  });

  if (error) {
    console.error('[sync] Failed to send nudge:', error.message);
    return { error: error.message };
  }

  const result = data as any;
  if (result?.error) return { error: result.error };
  return { success: true };
}

export async function pullInteractions(userId: string): Promise<BuddyInteraction[]> {
  const { data, error } = await supabase
    .from('partner_interactions')
    .select('*')
    .eq('receiver_id', userId)
    .in('status', ['pending', 'delivered'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[sync] Failed to pull interactions:', error.message);
    return [];
  }

  return (data ?? []) as BuddyInteraction[];
}

export async function pullReactionsOnMyTasks(userId: string): Promise<BuddyInteraction[]> {
  const { data, error } = await supabase
    .from('partner_interactions')
    .select('*')
    .eq('target_todo_user_id', userId)
    .eq('type', 'reaction')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[sync] Failed to pull reactions on my tasks:', error.message);
    return [];
  }

  return (data ?? []) as BuddyInteraction[];
}

export async function markInteractionsDelivered(ids: string[]): Promise<void> {
  if (ids.length === 0) return;

  const { error } = await supabase
    .from('partner_interactions')
    .update({ status: 'delivered', delivered_at: new Date().toISOString() })
    .in('id', ids);

  if (error) {
    console.error('[sync] Failed to mark interactions delivered:', error.message);
  }
}

export async function markInteractionsRead(ids: string[]): Promise<void> {
  if (ids.length === 0) return;

  const { error } = await supabase
    .from('partner_interactions')
    .update({ status: 'read', read_at: new Date().toISOString() })
    .in('id', ids);

  if (error) {
    console.error('[sync] Failed to mark interactions read:', error.message);
  }
}

// ── Together tasks (collaborative) ──────────────────────────────

export interface TogetherTask {
  id: string;
  together_group_id: string;
  creator_id: string;
  creator_name: string;
  creator_avatar_url: string | null;
  partner_id: string;
  task_id: string;
  title: string;
  created_at: string;
  due_date: string;
  due_time: string | null;
  priority: string | null;
  is_work: boolean;
  emoji: string | null;
  emoji_color: string | null;
  estimated_minutes: number | null;
  time_of_day: string | null;
  repeat: string | null;
  subtasks: any | null;
}

export async function createTogetherTask(task: {
  id: string;
  title: string;
  createdAt: string;
  dueDate: string;
  dueTime?: string;
  priority?: string;
  isWork?: boolean;
  emoji?: string;
  emojiColor?: string;
  estimatedMinutes?: number;
  timeOfDay?: string;
  repeat?: string;
  subtasks?: any[];
}, partnerId?: string): Promise<{ togetherGroupId?: string; partnerName?: string; error?: string }> {
  const { data, error } = await supabase.rpc('create_together_task', {
    task_id: task.id,
    task_title: task.title,
    task_created_at: task.createdAt,
    task_due_date: task.dueDate,
    task_due_time: task.dueTime ?? null,
    task_priority: task.priority ?? null,
    task_is_work: task.isWork ?? false,
    task_emoji: task.emoji ?? null,
    task_emoji_color: task.emojiColor ?? null,
    task_estimated_minutes: task.estimatedMinutes ?? null,
    task_time_of_day: task.timeOfDay ?? null,
    task_repeat: task.repeat ?? null,
    task_subtasks: task.subtasks ? JSON.stringify(task.subtasks) : null,
    p_partner_id: partnerId ?? null,
  });

  if (error) {
    console.error('[sync] Failed to create together task:', error.message);
    return { error: error.message };
  }

  const result = data as any;
  if (result?.error) {
    return { error: result.error };
  }

  // Fire-and-forget push notification
  if (result?.partner_id && result?.creator_name) {
    supabase.functions.invoke('send-push-notification', {
      body: {
        assignee_id: result.partner_id,
        task_title: task.title,
        assigner_name: `${result.creator_name} (together)`,
      },
    }).catch((err) => {
      console.log('[sync] Together push notification failed (non-blocking):', err);
    });
  }

  return { togetherGroupId: result?.together_group_id };
}

export async function pullTogetherTasks(userId: string): Promise<TogetherTask[]> {
  const { data, error } = await supabase
    .from('together_tasks')
    .select('id, together_group_id, creator_id, creator_name, creator_avatar_url, partner_id, task_id, title, created_at, due_date, due_time, priority, is_work, emoji, emoji_color, estimated_minutes, time_of_day, repeat, subtasks')
    .eq('partner_id', userId)
    .eq('status', 'pending');

  if (error) {
    console.error('[sync] Failed to pull together tasks:', error.message);
    return [];
  }

  return (data ?? []) as TogetherTask[];
}

export async function markTogetherTasksDelivered(ids: string[]): Promise<void> {
  if (ids.length === 0) return;

  const { error } = await supabase
    .from('together_tasks')
    .update({ status: 'delivered', delivered_at: new Date().toISOString() })
    .in('id', ids);

  if (error) {
    console.error('[sync] Failed to mark together tasks delivered:', error.message);
  }
}

export async function pullPartnerCompletionStatus(
  togetherGroupIds: string[],
  myUserId: string
): Promise<Map<string, { completed: boolean; completedAt: string | null }>> {
  const result = new Map<string, { completed: boolean; completedAt: string | null }>();
  if (togetherGroupIds.length === 0) return result;

  const { data, error } = await supabase
    .from('synced_todos')
    .select('together_group_id, completed, completed_at')
    .in('together_group_id', togetherGroupIds)
    .neq('user_id', myUserId);

  if (error) {
    console.error('[sync] Failed to pull partner completion status:', error.message);
    return result;
  }

  for (const row of data ?? []) {
    result.set(row.together_group_id, {
      completed: row.completed,
      completedAt: row.completed_at,
    });
  }

  return result;
}
