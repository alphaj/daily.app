import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Todo } from '@/types/todo';

interface DbTodo {
    id: string;
    user_id: string;
    title: string;
    completed: boolean;
    due_date: string;
    priority: string | null;
    created_at: string;
}

function getDateKey(date: Date): string {
    return date.toISOString().split('T')[0];
}

function getToday(): string {
    return getDateKey(new Date());
}

function mapDbTodoToTodo(dbTodo: DbTodo): Todo {
    return {
        id: dbTodo.id,
        title: dbTodo.title,
        completed: dbTodo.completed,
        dueDate: dbTodo.due_date,
        priority: dbTodo.priority as 'low' | 'medium' | 'high' | undefined,
        createdAt: dbTodo.created_at,
    };
}

export const [TodoProvider, useTodos] = createContextHook(() => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [todos, setTodos] = useState<Todo[]>([]);

    const todosQuery = useQuery({
        queryKey: ['todos', user?.id],
        queryFn: async () => {
            if (!user) return [];

            const { data, error } = await supabase
                .from('todos')
                .select('*')
                .eq('user_id', user.id);

            if (error) throw error;

            return (data as DbTodo[]).map(mapDbTodoToTodo);
        },
        enabled: !!user,
    });

    useEffect(() => {
        if (todosQuery.data) {
            setTodos(todosQuery.data);
        }
    }, [todosQuery.data]);

    const addTodo = useCallback(async (title: string, date?: Date, priority?: 'low' | 'medium' | 'high') => {
        if (!user) return;

        const dueDate = date ? getDateKey(date) : getToday();

        const { error } = await supabase
            .from('todos')
            .insert({
                user_id: user.id,
                title,
                due_date: dueDate,
                priority: priority || null,
            });

        if (error) {
            console.error('Failed to add todo:', error);
            return;
        }

        queryClient.invalidateQueries({ queryKey: ['todos', user.id] });
    }, [user, queryClient]);

    const deleteTodo = useCallback(async (id: string) => {
        if (!user) return;

        const { error } = await supabase
            .from('todos')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            console.error('Failed to delete todo:', error);
            return;
        }

        queryClient.invalidateQueries({ queryKey: ['todos', user.id] });
    }, [user, queryClient]);

    const toggleTodo = useCallback(async (id: string): Promise<boolean> => {
        if (!user) return false;

        const todo = todos.find(t => t.id === id);
        if (!todo) return false;

        const newCompleted = !todo.completed;

        const { error } = await supabase
            .from('todos')
            .update({ completed: newCompleted })
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            console.error('Failed to toggle todo:', error);
            return false;
        }

        queryClient.invalidateQueries({ queryKey: ['todos', user.id] });
        return newCompleted;
    }, [user, todos, queryClient]);

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
        if (!user) return;

        const todayKey = getToday();
        const tasksToRollover = todos.filter(
            todo => !todo.completed && todo.dueDate < todayKey
        );

        for (const task of tasksToRollover) {
            await supabase
                .from('todos')
                .update({ due_date: todayKey })
                .eq('id', task.id)
                .eq('user_id', user.id);
        }

        if (tasksToRollover.length > 0) {
            queryClient.invalidateQueries({ queryKey: ['todos', user.id] });
        }
    }, [user, todos, queryClient]);

    const clearCompletedTodos = useCallback(async () => {
        if (!user) return;

        const { error } = await supabase
            .from('todos')
            .delete()
            .eq('user_id', user.id)
            .eq('completed', true);

        if (error) {
            console.error('Failed to clear completed todos:', error);
            return;
        }

        queryClient.invalidateQueries({ queryKey: ['todos', user.id] });
    }, [user, queryClient]);

    const reorderTodos = useCallback((reorderedTodos: Todo[]) => {
        // For now, just update local state
        // Could add order column to todos table if needed
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
