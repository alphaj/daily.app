import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import type { FocusSession, FocusSessionStatus, FocusSessionRecord } from '@/types/focus';

const SESSION_KEY = 'daily_focus_session';
const HISTORY_KEY = 'daily_focus_history';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

export const [FocusProvider, useFocus] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<FocusSession | null>(null);
  const [history, setHistory] = useState<FocusSessionRecord[]>([]);
  const [remainingMs, setRemainingMs] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load persisted session
  const sessionQuery = useQuery({
    queryKey: ['focusSession'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) as FocusSession : null;
    },
  });

  // Load history
  const historyQuery = useQuery({
    queryKey: ['focusHistory'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(HISTORY_KEY);
      return stored ? JSON.parse(stored) as FocusSessionRecord[] : [];
    },
  });

  useEffect(() => {
    if (sessionQuery.data !== undefined) {
      setSession(sessionQuery.data);
    }
  }, [sessionQuery.data]);

  useEffect(() => {
    if (historyQuery.data) {
      setHistory(historyQuery.data);
    }
  }, [historyQuery.data]);

  // Persist session
  const saveSession = useCallback(async (s: FocusSession | null) => {
    if (s) {
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(s));
    } else {
      await AsyncStorage.removeItem(SESSION_KEY);
    }
    queryClient.invalidateQueries({ queryKey: ['focusSession'] });
  }, [queryClient]);

  // Persist history
  const saveHistory = useCallback(async (h: FocusSessionRecord[]) => {
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(h));
    queryClient.invalidateQueries({ queryKey: ['focusHistory'] });
  }, [queryClient]);

  // Compute remaining time from timestamps
  const computeRemaining = useCallback((s: FocusSession | null): number => {
    if (!s || s.status === 'idle' || s.status === 'completed') return 0;

    const now = Date.now();
    let elapsed: number;

    if (s.status === 'paused' && s.pausedAt) {
      elapsed = new Date(s.pausedAt).getTime() - new Date(s.startedAt).getTime() - s.accumulatedPauseMs;
    } else {
      elapsed = now - new Date(s.startedAt).getTime() - s.accumulatedPauseMs;
    }

    return Math.max(s.durationMs - elapsed, 0);
  }, []);

  // Complete the session
  const completeSession = useCallback(async (s: FocusSession) => {
    const completedAt = new Date().toISOString();
    const actualMs = s.durationMs; // They ran the full duration

    const record: FocusSessionRecord = {
      id: s.id,
      date: getDateKey(new Date(s.startedAt)),
      durationMs: s.durationMs,
      actualMs,
      startedAt: s.startedAt,
      completedAt,
      completed: true,
      todoId: s.todoId,
      todoTitle: s.todoTitle,
      todoEmoji: s.todoEmoji,
    };

    const newHistory = [...history, record];
    setHistory(newHistory);
    await saveHistory(newHistory);

    const completed: FocusSession = { ...s, status: 'completed', completedAt };
    setSession(completed);
    await saveSession(completed);
    setRemainingMs(0);
  }, [history, saveHistory, saveSession]);

  // Timer tick
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (session?.status === 'running') {
      const tick = () => {
        const remaining = computeRemaining(session);
        setRemainingMs(remaining);
        if (remaining <= 0) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          completeSession(session);
        }
      };

      tick(); // immediate
      intervalRef.current = setInterval(tick, 1000);
    } else if (session?.status === 'paused') {
      setRemainingMs(computeRemaining(session));
    } else if (!session || session.status === 'completed') {
      setRemainingMs(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [session, computeRemaining, completeSession]);

  // Handle app foreground return
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && session?.status === 'running') {
        const remaining = computeRemaining(session);
        setRemainingMs(remaining);
        if (remaining <= 0) {
          completeSession(session);
        }
      }
    });
    return () => sub.remove();
  }, [session, computeRemaining, completeSession]);

  // Handle recovered running session that has expired
  useEffect(() => {
    if (session?.status === 'running') {
      const remaining = computeRemaining(session);
      if (remaining <= 0) {
        completeSession(session);
      }
    }
  }, [session?.id]);

  const status: FocusSessionStatus = session?.status ?? 'idle';
  const progress = session && session.durationMs > 0
    ? Math.min(1, 1 - remainingMs / session.durationMs)
    : 0;

  const startSession = useCallback(async (
    durationMinutes: number = 45,
    task?: { todoId: string; title: string; emoji?: string } | null,
  ) => {
    const now = new Date();
    const durationMs = durationMinutes * 60 * 1000;
    const endAt = new Date(now.getTime() + durationMs);

    const newSession: FocusSession = {
      id: generateId(),
      durationMs,
      startedAt: now.toISOString(),
      endAt: endAt.toISOString(),
      pausedAt: null,
      accumulatedPauseMs: 0,
      status: 'running',
      completedAt: null,
      todoId: task?.todoId ?? null,
      todoTitle: task?.title ?? null,
      todoEmoji: task?.emoji ?? null,
    };

    setSession(newSession);
    setRemainingMs(durationMs);
    saveSession(newSession); // fire-and-forget so haptics aren't blocked
  }, [saveSession]);

  const pauseSession = useCallback(async () => {
    if (!session || session.status !== 'running') return;

    const paused: FocusSession = {
      ...session,
      status: 'paused',
      pausedAt: new Date().toISOString(),
    };

    setSession(paused);
    saveSession(paused); // fire-and-forget so haptics aren't blocked
  }, [session, saveSession]);

  const resumeSession = useCallback(async () => {
    if (!session || session.status !== 'paused' || !session.pausedAt) return;

    const pauseDuration = Date.now() - new Date(session.pausedAt).getTime();
    const newEndAt = new Date(new Date(session.endAt).getTime() + pauseDuration);

    const resumed: FocusSession = {
      ...session,
      status: 'running',
      pausedAt: null,
      accumulatedPauseMs: session.accumulatedPauseMs + pauseDuration,
      endAt: newEndAt.toISOString(),
    };

    setSession(resumed);
    saveSession(resumed); // fire-and-forget so haptics aren't blocked
  }, [session, saveSession]);

  const extendSession = useCallback(async (minutes: number) => {
    if (!session || (session.status !== 'running' && session.status !== 'paused')) return;

    const addMs = minutes * 60 * 1000;
    const newEndAt = new Date(new Date(session.endAt).getTime() + addMs);

    const extended: FocusSession = {
      ...session,
      durationMs: session.durationMs + addMs,
      endAt: newEndAt.toISOString(),
    };

    setSession(extended);
    saveSession(extended); // fire-and-forget so haptics aren't blocked
  }, [session, saveSession]);

  const cancelSession = useCallback(async () => {
    if (!session) return;

    if (session.status === 'running' || session.status === 'paused') {
      const now = Date.now();
      let actualMs: number;
      if (session.status === 'paused' && session.pausedAt) {
        actualMs = new Date(session.pausedAt).getTime() - new Date(session.startedAt).getTime() - session.accumulatedPauseMs;
      } else {
        actualMs = now - new Date(session.startedAt).getTime() - session.accumulatedPauseMs;
      }

      const record: FocusSessionRecord = {
        id: session.id,
        date: getDateKey(new Date(session.startedAt)),
        durationMs: session.durationMs,
        actualMs: Math.max(actualMs, 0),
        startedAt: session.startedAt,
        completedAt: new Date().toISOString(),
        completed: false,
        todoId: session.todoId,
        todoTitle: session.todoTitle,
        todoEmoji: session.todoEmoji,
      };

      const newHistory = [...history, record];
      setHistory(newHistory);
      saveHistory(newHistory); // fire-and-forget
    }

    setSession(null);
    setRemainingMs(0);
    saveSession(null); // fire-and-forget
  }, [session, history, saveHistory, saveSession]);

  const resetSession = useCallback(async () => {
    setSession(null);
    setRemainingMs(0);
    saveSession(null); // fire-and-forget
  }, [saveSession]);

  const isLoading = sessionQuery.isLoading || historyQuery.isLoading;

  return {
    session,
    status,
    remainingMs,
    progress,
    isLoading,
    startSession,
    pauseSession,
    resumeSession,
    extendSession,
    cancelSession,
    resetSession,
    history,
  };
});
