import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Check } from 'lucide-react-native';
import { TaskSection } from './TaskSection';
import type { HomeVariantProps } from './types';
import type { Todo, TimeOfDay } from '@/types/todo';
import type { Habit } from '@/types/habit';

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
    habitsForDate,
    onToggleHabit,
    getHabitStreak,
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

  const dateKey = useMemo(() => selectedDate.toISOString().split('T')[0], [selectedDate]);

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {habitsForDate && habitsForDate.length > 0 && (
        <View style={styles.habitsSection}>
          <Text style={styles.habitsSectionTitle}>Habits</Text>
          {habitsForDate.map((habit) => {
            const isCompleted = !!(habit.completions && habit.completions[dateKey]);
            const streak = getHabitStreak?.(habit.id) ?? 0;
            return (
              <Pressable
                key={habit.id}
                style={[styles.habitCard, isCompleted && styles.habitCardCompleted]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onToggleHabit?.(habit.id);
                }}
              >
                {habit.emoji ? (
                  <View style={[styles.habitEmoji, habit.emojiColor ? { backgroundColor: habit.emojiColor } : undefined]}>
                    <Text style={styles.habitEmojiText}>{habit.emoji}</Text>
                  </View>
                ) : null}
                <View style={styles.habitTextColumn}>
                  <Text style={[styles.habitTitle, isCompleted && styles.habitTitleCompleted]} numberOfLines={1}>
                    {habit.title}
                  </Text>
                  {streak > 0 && (
                    <Text style={styles.habitStreak}>{streak} day streak</Text>
                  )}
                </View>
                <View style={[styles.habitCheckbox, isCompleted && styles.habitCheckboxChecked]}>
                  {isCompleted && <Check size={14} color="#fff" strokeWidth={3} />}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

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
  // Habits section
  habitsSection: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  habitsSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  habitCardCompleted: {
    opacity: 0.6,
  },
  habitEmoji: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(120,120,128,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  habitEmojiText: {
    fontSize: 22,
  },
  habitTextColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.2,
  },
  habitTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#AEAEB2',
  },
  habitStreak: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
    marginTop: 2,
  },
  habitCheckbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  habitCheckboxChecked: {
    backgroundColor: '#1C1C1E',
    borderColor: '#1C1C1E',
  },
});
