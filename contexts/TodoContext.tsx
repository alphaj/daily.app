import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Todo } from '@/types/todo';

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

  const addTodo = useCallback(async (title: string, date?: Date, priority?: 'low' | 'medium' | 'high') => {
    const dueDate = date ? getDateKey(date) : getToday();

    const newTodo: Todo = {
      id: generateId(),
      title,
      completed: false,
      dueDate,
      priority,
      createdAt: new Date().toISOString(),
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
      t.id === id ? { ...t, completed: newCompleted } : t
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

  const reorderTodos = useCallback((reorderedTodos: Todo[]) => {
    setTodos(reorderedTodos);
  }, []);

  const completedCount = useMemo(() => todos.filter(t => t.completed).length, [todos]);
  const totalCount = todos.length;

  return {
    todos,
    isLoading: todosQuery.isLoading,
    addTodo,
    deleteTodo,
    toggleTodo,
    getTodosForDate,
    rolloverTasks,
    clearCompletedTodos,
    reorderTodos,
    completedCount,
    totalCount,
  };
});
