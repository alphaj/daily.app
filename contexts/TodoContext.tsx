import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Todo, TimeOfDay, RepeatOption, Subtask } from '@/types/todo';
import { getNextRepeatDate } from '@/lib/repeatDate';

const TODOS_STORAGE_KEY = 'daily_todos';

function getDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getToday(): string {
  return getDateKey(new Date());
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export const [TodoProvider, useTodos] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [todos, setTodos] = useState<Todo[]>([]);

  const todosQuery = useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(TODOS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    },
  });

  useEffect(() => {
    if (todosQuery.data) {
      setTodos(todosQuery.data);
    }
  }, [todosQuery.data]);

  const saveTodos = useCallback(async (newTodos: Todo[]) => {
    await AsyncStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify(newTodos));
    queryClient.invalidateQueries({ queryKey: ['todos'] });
  }, [queryClient]);

  const addTodo = useCallback(async (
    title: string,
    date?: Date,
    priority?: 'low' | 'medium' | 'high',
    isWork?: boolean,
    dueTime?: string,
    extras?: { emoji?: string; emojiColor?: string; estimatedMinutes?: number; timeOfDay?: TimeOfDay; repeat?: RepeatOption; subtasks?: Subtask[]; isPrivate?: boolean; isDefault?: boolean; isTogether?: boolean; togetherGroupId?: string; togetherPartnerId?: string; togetherPartnerName?: string; togetherPartnerAvatarUrl?: string }
  ) => {
    const dueDate = date ? getDateKey(date) : getToday();

    const newTodo: Todo = {
      id: generateId(),
      title,
      completed: false,
      dueDate,
      dueTime,
      priority,
      isWork,
      createdAt: new Date().toISOString(),
      ...extras,
    };

    const newTodos = [...todos, newTodo];
    setTodos(newTodos);
    await saveTodos(newTodos);
  }, [todos, saveTodos]);

  const deleteTodo = useCallback(async (id: string) => {
    const newTodos = todos.filter(t => t.id !== id);
    setTodos(newTodos);
    await saveTodos(newTodos);
  }, [todos, saveTodos]);

  const restoreTodo = useCallback(async (todo: Todo) => {
    const newTodos = [...todos, todo];
    setTodos(newTodos);
    await saveTodos(newTodos);
  }, [todos, saveTodos]);

  const toggleTodo = useCallback(async (id: string): Promise<boolean> => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return false;

    const newCompleted = !todo.completed;
    let newTodos = todos.map(t =>
      t.id === id ? {
        ...t,
        completed: newCompleted,
        completedAt: newCompleted ? new Date().toISOString() : undefined,
        // Sync all subtasks with parent completion state
        subtasks: t.subtasks?.map(st => ({ ...st, completed: newCompleted })),
      } : t
    );

    // Generate next repeat instance on completion
    if (newCompleted && todo.repeat && todo.repeat !== 'none') {
      const alreadySpawned = todos.some(t => t.repeatSourceId === id);
      if (!alreadySpawned) {
        const nextDate = getNextRepeatDate(todo.repeat, new Date());
        if (nextDate) {
          // For together tasks, skip if partner already delivered the next instance
          const alreadyDelivered = todo.isTogether && todos.some(t =>
            t.isTogether && t.dueDate === nextDate && t.title === todo.title && t.id !== id && !t.completed
          );
          if (alreadyDelivered) {
            setTodos(newTodos);
            await saveTodos(newTodos);
            return newCompleted;
          }
          const nextTodo: Todo = {
            id: generateId(),
            title: todo.title,
            completed: false,
            createdAt: new Date().toISOString(),
            dueDate: nextDate,
            dueTime: todo.dueTime,
            priority: todo.priority,
            isWork: todo.isWork,
            emoji: todo.emoji,
            emojiColor: todo.emojiColor,
            estimatedMinutes: todo.estimatedMinutes,
            timeOfDay: todo.timeOfDay,
            repeat: todo.repeat,
            isPrivate: todo.isPrivate,
            repeatSourceId: id,
            subtasks: todo.subtasks?.map(st => ({
              ...st,
              id: generateId(),
              completed: false,
            })),
            isTogether: todo.isTogether,
            togetherPartnerId: todo.togetherPartnerId,
            togetherPartnerName: todo.togetherPartnerName,
            togetherPartnerAvatarUrl: todo.togetherPartnerAvatarUrl,
          };
          newTodos = [...newTodos, nextTodo];
        }
      }
    }

    setTodos(newTodos);
    await saveTodos(newTodos);
    return newCompleted;
  }, [todos, saveTodos]);

  const getTodosForDate = useCallback((date: Date): Todo[] => {
    const dateKey = getDateKey(date);
    const todayKey = getToday();

    if (dateKey >= todayKey) {
      return todos.filter(todo => {
        if (todo.dueDate === dateKey) return true;
        if (!todo.completed && todo.dueDate < todayKey) return true;
        return false;
      });
    }

    return todos.filter(todo => todo.dueDate === dateKey);
  }, [todos]);

  const clearCompletedTodos = useCallback(async () => {
    const newTodos = todos.filter(t => !t.completed);
    setTodos(newTodos);
    await saveTodos(newTodos);
  }, [todos, saveTodos]);

  const reorderTodos = useCallback(async (reorderedTodos: Todo[]) => {
    setTodos(reorderedTodos);
    await saveTodos(reorderedTodos);
  }, [saveTodos]);

  /** Get todos that were completed on a specific date */
  const getCompletedTodosForDate = useCallback((date: Date): Todo[] => {
    const dateKey = getDateKey(date);
    return todos.filter(todo => {
      if (!todo.completedAt) return false;
      const completedDateKey = todo.completedAt.split('T')[0];
      return completedDateKey === dateKey;
    });
  }, [todos]);

  const updateTodo = useCallback(async (id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>) => {
    const newTodos = todos.map(t =>
      t.id === id ? { ...t, ...updates } : t
    );
    setTodos(newTodos);
    await saveTodos(newTodos);
  }, [todos, saveTodos]);

  const duplicateTodo = useCallback(async (id: string) => {
    const original = todos.find(t => t.id === id);
    if (!original) return;
    const copy: Todo = {
      ...original,
      id: generateId(),
      completed: false,
      completedAt: undefined,
      createdAt: new Date().toISOString(),
      title: original.title,
    };
    const newTodos = [...todos, copy];
    setTodos(newTodos);
    await saveTodos(newTodos);
  }, [todos, saveTodos]);

  const rescheduleTodo = useCallback(async (id: string, newDate: string) => {
    const newTodos = todos.map(t =>
      t.id === id ? { ...t, dueDate: newDate } : t
    );
    setTodos(newTodos);
    await saveTodos(newTodos);
  }, [todos, saveTodos]);

  const addSubtask = useCallback(async (todoId: string, title: string) => {
    const newSubtask: Subtask = {
      id: generateId(),
      title,
      completed: false,
    };
    const newTodos = todos.map(t =>
      t.id === todoId
        ? { ...t, subtasks: [...(t.subtasks || []), newSubtask] }
        : t
    );
    setTodos(newTodos);
    await saveTodos(newTodos);
  }, [todos, saveTodos]);

  const toggleSubtask = useCallback(async (todoId: string, subtaskId: string) => {
    const todo = todos.find(t => t.id === todoId);
    if (!todo || !todo.subtasks) return;

    const updatedSubtasks = todo.subtasks.map(st =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    const allCompleted = updatedSubtasks.every(st => st.completed);
    const anyIncomplete = updatedSubtasks.some(st => !st.completed);

    let newTodos = todos.map(t => {
      if (t.id !== todoId) return t;

      if (allCompleted && !t.completed) {
        // All subtasks done → auto-complete parent
        return { ...t, subtasks: updatedSubtasks, completed: true, completedAt: new Date().toISOString() };
      } else if (anyIncomplete && t.completed) {
        // Subtask unchecked on completed parent → uncomplete parent
        return { ...t, subtasks: updatedSubtasks, completed: false, completedAt: undefined };
      }

      return { ...t, subtasks: updatedSubtasks };
    });

    // Handle repeat spawning when auto-completing via last subtask
    if (allCompleted && !todo.completed && todo.repeat && todo.repeat !== 'none') {
      const alreadySpawned = newTodos.some(t => t.repeatSourceId === todoId);
      if (!alreadySpawned) {
        const nextDate = getNextRepeatDate(todo.repeat, new Date());
        if (nextDate) {
          const alreadyDelivered = todo.isTogether && newTodos.some(t =>
            t.isTogether && t.dueDate === nextDate && t.title === todo.title && t.id !== todoId && !t.completed
          );
          if (!alreadyDelivered) {
            const nextTodo: Todo = {
              id: generateId(),
              title: todo.title,
              completed: false,
              createdAt: new Date().toISOString(),
              dueDate: nextDate,
              dueTime: todo.dueTime,
              priority: todo.priority,
              isWork: todo.isWork,
              emoji: todo.emoji,
              emojiColor: todo.emojiColor,
              estimatedMinutes: todo.estimatedMinutes,
              timeOfDay: todo.timeOfDay,
              repeat: todo.repeat,
              isPrivate: todo.isPrivate,
              repeatSourceId: todoId,
              subtasks: todo.subtasks?.map(st => ({
                ...st,
                id: generateId(),
                completed: false,
              })),
              isTogether: todo.isTogether,
              togetherPartnerId: todo.togetherPartnerId,
              togetherPartnerName: todo.togetherPartnerName,
              togetherPartnerAvatarUrl: todo.togetherPartnerAvatarUrl,
            };
            newTodos = [...newTodos, nextTodo];
          }
        }
      }
    }

    setTodos(newTodos);
    await saveTodos(newTodos);
  }, [todos, saveTodos]);

  const deleteSubtask = useCallback(async (todoId: string, subtaskId: string) => {
    const newTodos = todos.map(t => {
      if (t.id !== todoId || !t.subtasks) return t;
      const filtered = t.subtasks.filter(st => st.id !== subtaskId);
      return { ...t, subtasks: filtered.length > 0 ? filtered : undefined };
    });
    setTodos(newTodos);
    await saveTodos(newTodos);
  }, [todos, saveTodos]);

  const editSubtask = useCallback(async (todoId: string, subtaskId: string, newTitle: string) => {
    const newTodos = todos.map(t => {
      if (t.id !== todoId || !t.subtasks) return t;
      return {
        ...t,
        subtasks: t.subtasks.map(st =>
          st.id === subtaskId ? { ...st, title: newTitle } : st
        ),
      };
    });
    setTodos(newTodos);
    await saveTodos(newTodos);
  }, [todos, saveTodos]);

  const convertSubtaskToTask = useCallback(async (todoId: string, subtaskId: string) => {
    const parentTodo = todos.find(t => t.id === todoId);
    if (!parentTodo?.subtasks) return;
    const subtask = parentTodo.subtasks.find(st => st.id === subtaskId);
    if (!subtask) return;

    // Create a new standalone task from the subtask
    const newTask: Todo = {
      id: generateId(),
      title: subtask.title,
      completed: subtask.completed,
      completedAt: subtask.completed ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(),
      dueDate: parentTodo.dueDate,
      timeOfDay: parentTodo.timeOfDay,
      emoji: subtask.emoji,
    };

    // Remove subtask from parent and add as standalone task
    const newTodos = todos.map(t => {
      if (t.id !== todoId || !t.subtasks) return t;
      const filtered = t.subtasks.filter(st => st.id !== subtaskId);
      return { ...t, subtasks: filtered.length > 0 ? filtered : undefined };
    });
    newTodos.push(newTask);

    setTodos(newTodos);
    await saveTodos(newTodos);
  }, [todos, saveTodos]);

  const incompleteDateMap = useMemo(() => {
    const todayKey = getToday();
    const map: Record<string, { incomplete: number; total: number }> = {};

    for (const todo of todos) {
      const dateKey = todo.originalDueDate || todo.dueDate;
      if (dateKey >= todayKey) continue;
      if (!map[dateKey]) map[dateKey] = { incomplete: 0, total: 0 };
      map[dateKey].total++;
      if (!todo.completed) {
        map[dateKey].incomplete++;
      }
    }

    const result: Record<string, { incomplete: number; total: number }> = {};
    for (const [date, counts] of Object.entries(map)) {
      if (counts.incomplete > 0) {
        result[date] = counts;
      }
    }
    return result;
  }, [todos]);

  const getIncompleteTodosForDate = useCallback((dateKey: string): Todo[] => {
    return todos.filter(todo => {
      const effectiveDate = todo.originalDueDate || todo.dueDate;
      return effectiveDate === dateKey && !todo.completed;
    });
  }, [todos]);

  const completedCount = useMemo(() => todos.filter(t => t.completed).length, [todos]);
  const workCompletedCount = useMemo(() => todos.filter(t => t.completed && t.isWork === true).length, [todos]);
  const lifeCompletedCount = useMemo(() => todos.filter(t => t.completed && (t.isWork === false || t.isWork === undefined)).length, [todos]);
  const totalCount = todos.length;

  return {
    todos,
    isLoading: todosQuery.isLoading,
    addTodo,
    deleteTodo,
    restoreTodo,
    toggleTodo,
    updateTodo,
    duplicateTodo,
    rescheduleTodo,
    getTodosForDate,
    getCompletedTodosForDate,
    clearCompletedTodos,
    reorderTodos,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    editSubtask,
    convertSubtaskToTask,
    completedCount,
    workCompletedCount,
    lifeCompletedCount,
    totalCount,
    incompleteDateMap,
    getIncompleteTodosForDate,
  };
});
