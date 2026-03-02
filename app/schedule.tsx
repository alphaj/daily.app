import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { format, isSameDay } from 'date-fns';
import { useTodos } from '@/contexts/TodoContext';
import { BottomNavBar } from '@/components/BottomNavBar';
import { AmbientBackground } from '@/components/AmbientBackground';
import { DayTimeGrid } from '@/components/schedule/DayTimeGrid';
import type { Todo } from '@/types/todo';

export default function ScheduleScreen() {
  const router = useRouter();
  const { getTodosForDate, getCompletedTodosForDate, updateTodo } = useTodos();

  const today = new Date();
  const todosForToday = getTodosForDate(today);

  const handleEditTodo = useCallback((todo: Todo) => {
    router.push(`/edit-todo?id=${todo.id}` as any);
  }, [router]);

  const handleUpdateTodo = useCallback((id: string, updates: Partial<Todo>) => {
    updateTodo(id, updates);
  }, [updateTodo]);

  return (
    <View style={styles.root}>
      <AmbientBackground />
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Schedule</Text>
          <Text style={styles.subtitle}>{format(today, 'EEEE, MMMM d')}</Text>
        </View>

        <DayTimeGrid
          todos={todosForToday}
          onEditTodo={handleEditTodo}
          onUpdateTodo={handleUpdateTodo}
        />

        <BottomNavBar />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 2,
  },
});
