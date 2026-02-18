import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Todo, TimeOfDay, RepeatOption, Subtask } from '@/types/todo';

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
    extras?: { emoji?: string; emojiColor?: string; estimatedMinutes?: number; timeOfDay?: TimeOfDay; repeat?: RepeatOption; subtasks?: Subtask[] }
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

  const toggleTodo = useCallback(async (id: string): Promise<boolean> => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return false;

    const newCompleted = !todo.completed;
    const newTodos = todos.map(t =>
      t.id === id ? {
        ...t,
        completed: newCompleted,
        completedAt: newCompleted ? new Date().toISOString() : undefined,
      } : t
    );

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

  const rolloverTasks = useCallback(async () => {
    const todayKey = getToday();
    const tasksToRollover = todos.filter(
      todo => !todo.completed && todo.dueDate < todayKey
    );

    if (tasksToRollover.length > 0) {
      const newTodos = todos.map(todo =>
        !todo.completed && todo.dueDate < todayKey
          ? { ...todo, dueDate: todayKey }
          : todo
      );
      setTodos(newTodos);
      await saveTodos(newTodos);
    }
  }, [todos, saveTodos]);

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
    const newTodos = todos.map(t => {
      if (t.id !== todoId || !t.subtasks) return t;
      return {
        ...t,
        subtasks: t.subtasks.map(st =>
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        ),
      };
    });
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

  const completedCount = useMemo(() => todos.filter(t => t.completed).length, [todos]);
  const workCompletedCount = useMemo(() => todos.filter(t => t.completed && t.isWork === true).length, [todos]);
  const lifeCompletedCount = useMemo(() => todos.filter(t => t.completed && (t.isWork === false || t.isWork === undefined)).length, [todos]);
  const totalCount = todos.length;

  return {
    todos,
    isLoading: todosQuery.isLoading,
    addTodo,
    deleteTodo,
    toggleTodo,
    updateTodo,
    duplicateTodo,
    rescheduleTodo,
    getTodosForDate,
    getCompletedTodosForDate,
    rolloverTasks,
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
  };
});
