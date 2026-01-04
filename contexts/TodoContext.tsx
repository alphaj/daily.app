import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useCallback, useMemo } from 'react';
import type { Todo } from '@/types/todo';

const STORAGE_KEY = 'daily_todos';

function getDateKey(date: Date): string {
    return date.toISOString().split('T')[0];
}

function getToday(): string {
    return getDateKey(new Date());
}

export const [TodoProvider, useTodos] = createContextHook(() => {
    const queryClient = useQueryClient();
    const [todos, setTodos] = useState<Todo[]>([]);

    const todosQuery = useQuery({
        queryKey: ['todos'],
        queryFn: async () => {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        }
    });

    const saveMutation = useMutation({
        mutationFn: async (todos: Todo[]) => {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
            return todos;
        },
        onSuccess: (todos) => {
            queryClient.setQueryData(['todos'], todos);
        }
    });

    useEffect(() => {
        if (todosQuery.data) {
            setTodos(todosQuery.data);
        }
    }, [todosQuery.data]);

    // Add a new todo for a specific date
    const addTodo = useCallback((title: string, date?: Date) => {
        const dueDate = date ? getDateKey(date) : getToday();
        const newTodo: Todo = {
            id: Date.now().toString(),
            title,
            completed: false,
            createdAt: new Date().toISOString(),
            dueDate,
        };
        const updated = [...todos, newTodo];
        setTodos(updated);
        saveMutation.mutate(updated);
    }, [todos, saveMutation]);

    const deleteTodo = useCallback((id: string) => {
        const updated = todos.filter(t => t.id !== id);
        setTodos(updated);
        saveMutation.mutate(updated);
    }, [todos, saveMutation]);

    const toggleTodo = useCallback((id: string): boolean => {
        let wasCompleted = false;
        const updated = todos.map(todo => {
            if (todo.id === id) {
                wasCompleted = !todo.completed;
                return { ...todo, completed: !todo.completed };
            }
            return todo;
        });
        setTodos(updated);
        saveMutation.mutate(updated);
        return wasCompleted;
    }, [todos, saveMutation]);

    // Get todos for a specific date, including rolled-over incomplete tasks from past days
    const getTodosForDate = useCallback((date: Date): Todo[] => {
        const dateKey = getDateKey(date);
        const todayKey = getToday();

        // If viewing today or future, include rolled-over incomplete tasks
        if (dateKey >= todayKey) {
            return todos.filter(todo => {
                // Include tasks explicitly for this date
                if (todo.dueDate === dateKey) return true;
                // Include incomplete tasks from past days (rollover)
                if (!todo.completed && todo.dueDate < todayKey) return true;
                return false;
            });
        }

        // For past dates, only show tasks that were originally for that date
        return todos.filter(todo => todo.dueDate === dateKey);
    }, [todos]);

    // Rollover: Move all incomplete past tasks to today
    const rolloverTasks = useCallback(() => {
        const todayKey = getToday();
        const updated = todos.map(todo => {
            if (!todo.completed && todo.dueDate < todayKey) {
                return { ...todo, dueDate: todayKey };
            }
            return todo;
        });
        if (JSON.stringify(updated) !== JSON.stringify(todos)) {
            setTodos(updated);
            saveMutation.mutate(updated);
        }
    }, [todos, saveMutation]);

    const clearCompletedTodos = useCallback(() => {
        const updated = todos.filter(t => !t.completed);
        setTodos(updated);
        saveMutation.mutate(updated);
    }, [todos, saveMutation]);

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
        completedCount,
        totalCount,
    };
});

