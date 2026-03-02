import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useBuddy } from '@/contexts/BuddyContext';
import { pushAllData, pullBuddyData, pullAssignedTasks, markAssignedTasksDelivered, pullInteractions, markInteractionsDelivered, pullTogetherTasks, markTogetherTasksDelivered, pullPartnerCompletionStatus, BuddyData } from '@/lib/sync';
import { supabase } from '@/lib/supabase';
import type { Todo } from '@/types/todo';

interface SyncContextType {
  /** Trigger a manual push of local data to cloud */
  syncNow: () => Promise<void>;
  /** Pull buddy's data for a given date */
  fetchBuddyData: (partnerId: string, date?: string) => Promise<BuddyData | null>;
  /** Whether a sync is currently in progress */
  isSyncing: boolean;
  /** Last successful sync timestamp */
  lastSyncAt: Date | null;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

const TODOS_STORAGE_KEY = 'daily_todos';

export function SyncProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const { hasActiveBuddy } = useBuddy();
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const shouldSync = session && hasActiveBuddy;

  const syncNow = useCallback(async () => {
    if (!session?.user?.id || !shouldSync) return;
    if (isSyncing) return;

    setIsSyncing(true);
    try {
      await pushAllData(session.user.id);

      // Pull assigned tasks from buddy
      const assigned = await pullAssignedTasks(session.user.id);
      if (assigned.length > 0) {
        const raw = await AsyncStorage.getItem(TODOS_STORAGE_KEY);
        const localTodos: Todo[] = raw ? JSON.parse(raw) : [];
        const localIds = new Set(localTodos.map((t) => t.id));

        const newTodos: Todo[] = assigned
          .filter((a) => !localIds.has(a.id))
          .map((a) => ({
            id: a.id,
            title: a.title,
            completed: false,
            createdAt: a.created_at,
            dueDate: a.due_date,
            dueTime: a.due_time ?? undefined,
            priority: (a.priority as Todo['priority']) ?? undefined,
            isWork: a.is_work,
            emoji: a.emoji ?? undefined,
            emojiColor: a.emoji_color ?? undefined,
            estimatedMinutes: a.estimated_minutes ?? undefined,
            timeOfDay: (a.time_of_day as Todo['timeOfDay']) ?? undefined,
            repeat: (a.repeat as Todo['repeat']) ?? undefined,
            subtasks: a.subtasks
              ? typeof a.subtasks === 'string'
                ? JSON.parse(a.subtasks)
                : a.subtasks
              : undefined,
            assignedById: a.assigner_id,
            assignedByName: a.assigner_name,
          }));

        if (newTodos.length > 0) {
          const merged = [...localTodos, ...newTodos];
          await AsyncStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify(merged));
          queryClient.invalidateQueries({ queryKey: ['todos'] });
        }

        await markAssignedTasksDelivered(assigned.map((a) => a.id));
      }

      // Pull together tasks from buddy
      const togetherTasks = await pullTogetherTasks(session.user.id);
      if (togetherTasks.length > 0) {
        const raw2 = await AsyncStorage.getItem(TODOS_STORAGE_KEY);
        const localTodos2: Todo[] = raw2 ? JSON.parse(raw2) : [];
        const localIds2 = new Set(localTodos2.map((t) => t.id));

        const newTogetherTodos: Todo[] = togetherTasks
          .filter((tt) => !localIds2.has(tt.task_id))
          .map((tt) => ({
            id: tt.task_id,
            title: tt.title,
            completed: false,
            createdAt: tt.created_at,
            dueDate: tt.due_date,
            dueTime: tt.due_time ?? undefined,
            priority: (tt.priority as Todo['priority']) ?? undefined,
            isWork: tt.is_work,
            emoji: tt.emoji ?? undefined,
            emojiColor: tt.emoji_color ?? undefined,
            estimatedMinutes: tt.estimated_minutes ?? undefined,
            timeOfDay: (tt.time_of_day as Todo['timeOfDay']) ?? undefined,
            repeat: (tt.repeat as Todo['repeat']) ?? undefined,
            subtasks: tt.subtasks
              ? typeof tt.subtasks === 'string'
                ? JSON.parse(tt.subtasks)
                : tt.subtasks
              : undefined,
            isTogether: true,
            togetherGroupId: tt.together_group_id,
            togetherPartnerId: tt.creator_id,
            togetherPartnerName: tt.creator_name,
            togetherPartnerAvatarUrl: tt.creator_avatar_url ?? undefined,
          }));

        if (newTogetherTodos.length > 0) {
          const merged = [...localTodos2, ...newTogetherTodos];
          await AsyncStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify(merged));
          queryClient.invalidateQueries({ queryKey: ['todos'] });
        }

        await markTogetherTasksDelivered(togetherTasks.map((tt) => tt.id));
      }

      // Pull partner completion status for together tasks
      {
        const raw3 = await AsyncStorage.getItem(TODOS_STORAGE_KEY);
        const localTodos3: Todo[] = raw3 ? JSON.parse(raw3) : [];
        const groupIds = localTodos3
          .filter((t) => t.isTogether && t.togetherGroupId)
          .map((t) => t.togetherGroupId!);

        if (groupIds.length > 0) {
          const statusMap = await pullPartnerCompletionStatus(groupIds, session.user.id);
          if (statusMap.size > 0) {
            let changed = false;
            const updated = localTodos3.map((t) => {
              if (!t.togetherGroupId) return t;
              const status = statusMap.get(t.togetherGroupId);
              if (status !== undefined && t.partnerCompleted !== status.completed) {
                changed = true;
                return { ...t, partnerCompleted: status.completed };
              }
              return t;
            });
            if (changed) {
              await AsyncStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify(updated));
              queryClient.invalidateQueries({ queryKey: ['todos'] });
            }
          }
        }
      }

      // Pull pending interactions and mark delivered
      const pending = await pullInteractions(session.user.id);
      if (pending.length > 0) {
        const pendingIds = pending.filter((i) => i.status === 'pending').map((i) => i.id);
        if (pendingIds.length > 0) {
          await markInteractionsDelivered(pendingIds);
        }
        queryClient.invalidateQueries({ queryKey: ['buddy-interactions'] });
        queryClient.invalidateQueries({ queryKey: ['my-task-reactions'] });
      }

      setLastSyncAt(new Date());
    } catch (err) {
      console.error('[sync] Push failed:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [session?.user?.id, shouldSync, isSyncing, queryClient]);

  const fetchBuddyData = useCallback(async (partnerId: string, date?: string): Promise<BuddyData | null> => {
    try {
      return await pullBuddyData(partnerId, date);
    } catch (err) {
      console.error('[sync] Pull failed:', err);
      return null;
    }
  }, []);

  // Sync when app comes to foreground
  useEffect(() => {
    if (!shouldSync) return;

    const handleAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        syncNow();
        // Always update last_active on foreground, even if syncNow skips due to isSyncing guard
        supabase.rpc('update_last_active').then(() => {});
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [shouldSync, syncNow]);

  // Realtime: sync immediately when a task is assigned to us
  useEffect(() => {
    if (!session?.user?.id || !shouldSync) return;

    const channel = supabase
      .channel('assigned-tasks-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'assigned_tasks',
          filter: `assignee_id=eq.${session.user.id}`,
        },
        () => {
          console.log('[sync] New assigned task detected via realtime');
          syncNow();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, shouldSync, syncNow]);

  // Realtime: sync immediately when a together task is created for us
  useEffect(() => {
    if (!session?.user?.id || !shouldSync) return;

    const channel = supabase
      .channel('together-tasks-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'together_tasks',
          filter: `partner_id=eq.${session.user.id}`,
        },
        () => {
          console.log('[sync] New together task detected via realtime');
          syncNow();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, shouldSync, syncNow]);

  // Realtime: sync immediately when an interaction is sent to us
  useEffect(() => {
    if (!session?.user?.id || !shouldSync) return;

    const channel = supabase
      .channel('buddy-interactions-sync')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'partner_interactions',
          filter: `receiver_id=eq.${session.user.id}`,
        },
        () => {
          console.log('[sync] New buddy interaction detected via realtime');
          queryClient.invalidateQueries({ queryKey: ['buddy-interactions'] });
          queryClient.invalidateQueries({ queryKey: ['my-task-reactions'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, shouldSync, queryClient]);

  // Sync on buddy becoming active
  useEffect(() => {
    if (shouldSync) {
      syncNow();
    }
  }, [shouldSync]);

  // Periodic sync
  useEffect(() => {
    if (!shouldSync) {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
      return;
    }

    syncIntervalRef.current = setInterval(syncNow, SYNC_INTERVAL_MS);
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [shouldSync, syncNow]);

  return (
    <SyncContext.Provider value={{ syncNow, fetchBuddyData, isSyncing, lastSyncAt }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
}
