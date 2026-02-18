import React, { useState, useMemo, useCallback } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';

import { TaskSection } from './TaskSection';
import type { HomeVariantProps } from './types';
import type { Todo, TimeOfDay } from '@/types/todo';

const TIME_OF_DAY_ORDER: TimeOfDay[] = ['anytime', 'morning', 'afternoon', 'evening'];

function groupTodosByTimeOfDay(todos: Todo[]): Record<TimeOfDay, Todo[]> {
  const groups: Record<TimeOfDay, Todo[]> = {
    anytime: [],
    morning: [],
    afternoon: [],
    evening: [],
  };
  for (const todo of todos) {
    const bucket = todo.timeOfDay || 'anytime';
    groups[bucket].push(todo);
  }
  return groups;
}

export function HomeV1(props: HomeVariantProps) {
  const {
    selectedDate,
    todosForDate,
    onToggleTodo,
    onDeleteTodo,
    onAddTodo,
    onAddTodoForSection,
    onToggleSubtask,
    onDeleteSubtask,
    onEditSubtask,
    onConvertSubtaskToTask,
    onDuplicateTodo,
    onRescheduleTodo,
    onEditTodo,
  } = props;

  const [collapsedSections, setCollapsedSections] = useState<Record<TimeOfDay, boolean>>({
    anytime: false,
    morning: false,
    afternoon: false,
    evening: false,
  });

  const grouped = useMemo(() => groupTodosByTimeOfDay(todosForDate), [todosForDate]);

  const toggleSection = useCallback((tod: TimeOfDay) => {
    setCollapsedSections(prev => ({ ...prev, [tod]: !prev[tod] }));
  }, []);

  const handleToggleTodo = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleTodo(id);
  }, [onToggleTodo]);

  const handleAddTodo = useCallback((timeOfDay: TimeOfDay) => {
    if (onAddTodoForSection) {
      onAddTodoForSection(timeOfDay);
    } else {
      onAddTodo();
    }
  }, [onAddTodoForSection, onAddTodo]);


  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {TIME_OF_DAY_ORDER.map((tod) => (
        <TaskSection
          key={tod}
          timeOfDay={tod}
          tasks={grouped[tod]}
          isCollapsed={collapsedSections[tod]}
          onToggleCollapse={() => toggleSection(tod)}
          onToggleTodo={handleToggleTodo}
          onDeleteTodo={onDeleteTodo}
          onToggleSubtask={onToggleSubtask}
          onDeleteSubtask={onDeleteSubtask}
          onEditSubtask={onEditSubtask}
          onConvertSubtaskToTask={onConvertSubtaskToTask}
          onAddTodo={handleAddTodo}
          onDuplicateTodo={onDuplicateTodo}
          onRescheduleTodo={onRescheduleTodo}
          onEditTodo={onEditTodo}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 4,
    paddingBottom: 120,
  },
});
