import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { Check, Plus } from 'lucide-react-native';
import SwipeableRow from '@/components/SwipeableRow';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useWorkMode } from '@/contexts/WorkModeContext';
import type { HomeVariantProps } from './types';
import type { Habit } from '@/types/habit';
import type { Supplement } from '@/types/supplement';

function getGreeting(name?: string): string {
  const hour = new Date().getHours();
  let greeting = 'Good evening';
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 17) greeting = 'Good afternoon';
  return name ? `${greeting}, ${name}` : greeting;
}

export function HomeV1(props: HomeVariantProps) {
  const {
    selectedDate,
    isToday,
    habits,
    displayHabits,
    hasMoreHabits,
    habitsCompleted,
    isCompletedToday,
    onHabitToggle,
    onAddHabit,
    activeSupplements,
    pillsTaken,
    onToggleTaken,
    onDeleteSupplement,
    onAddSupplement,
    todosForDate,
    tasksCompleted,
    onToggleTodo,
    onDeleteTodo,
    onAddTodo,
  } = props;

  const { state: onboardingState } = useOnboarding();
  const { isWorkMode } = useWorkMode();
  const userName = onboardingState.responses.name || undefined;
  const accent = isWorkMode ? '#5856D6' : '#5AC8FA';
  const accentBg = isWorkMode ? '#F5F3FF' : '#E0F7FA';

  const totalItems = displayHabits.length + activeSupplements.length + todosForDate.length;
  const totalDone = habitsCompleted + pillsTaken + tasksCompleted;
  const progress = totalItems > 0 ? totalDone / totalItems : 0;

  const dateLabel = isToday
    ? format(selectedDate, 'EEEE, MMMM d')
    : format(selectedDate, 'EEEE, MMMM d, yyyy');

  const isSupplementTaken = useCallback(
    (supplement: Supplement) => {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      return supplement.takenDates.includes(dateStr);
    },
    [selectedDate],
  );

  const handleHabitPress = useCallback(
    (id: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onHabitToggle(id);
    },
    [onHabitToggle],
  );

  const handleSupplementPress = useCallback(
    (id: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onToggleTaken(id);
    },
    [onToggleTaken],
  );

  const handleTodoPress = useCallback(
    (id: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onToggleTodo(id);
    },
    [onToggleTodo],
  );

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Hero Greeting Card */}
      <View style={[styles.heroCard, { backgroundColor: accentBg }]}>
        <Text style={styles.greeting}>{getGreeting(userName)}</Text>
        <Text style={styles.dateLabel}>{dateLabel}</Text>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryText, { color: accent }]}>
            {totalDone} of {totalItems} things done
          </Text>
        </View>
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${Math.round(progress * 100)}%`, backgroundColor: accent },
            ]}
          />
        </View>
      </View>

      {/* Habits Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Habits</Text>
          {hasMoreHabits && (
            <TouchableOpacity onPress={onAddHabit}>
              <Text style={[styles.seeAllText, { color: accent }]}>See all</Text>
            </TouchableOpacity>
          )}
        </View>
        {displayHabits.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalRow}
          >
            {displayHabits.map((habit) => {
              const completed = isCompletedToday(habit);
              return (
                <TouchableOpacity
                  key={habit.id}
                  style={styles.circleItem}
                  onPress={() => handleHabitPress(habit.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.circle,
                      completed ? styles.circleCompleted : styles.circleDefault,
                    ]}
                  >
                    <Text style={styles.circleEmoji}>
                      {habit.emoji || '✨'}
                    </Text>
                    {completed && (
                      <View style={styles.checkBadge}>
                        <Check size={10} color="#fff" strokeWidth={3} />
                      </View>
                    )}
                  </View>
                  <Text style={styles.circleLabel} numberOfLines={1}>
                    {habit.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No habits yet</Text>
            <TouchableOpacity style={[styles.addButton, { backgroundColor: accentBg }]} onPress={onAddHabit}>
              <Plus size={16} color={accent} strokeWidth={2.5} />
              <Text style={[styles.addButtonText, { color: accent }]}>Add habit</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Supplements Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Supplements</Text>
        </View>
        {activeSupplements.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalRow}
          >
            {activeSupplements.map((supplement) => {
              const taken = isSupplementTaken(supplement);
              return (
                <TouchableOpacity
                  key={supplement.id}
                  style={styles.circleItem}
                  onPress={() => handleSupplementPress(supplement.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.circle,
                      taken
                        ? styles.circleSupplementTaken
                        : styles.circleDefault,
                    ]}
                  >
                    <Text style={styles.circleEmoji}>
                      {supplement.emoji || '💊'}
                    </Text>
                    {taken && (
                      <View style={styles.checkBadgeBlue}>
                        <Check size={10} color="#fff" strokeWidth={3} />
                      </View>
                    )}
                  </View>
                  <Text style={styles.circleLabel} numberOfLines={1}>
                    {supplement.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No supplements yet</Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: accentBg }]}
              onPress={onAddSupplement}
            >
              <Plus size={16} color={accent} strokeWidth={2.5} />
              <Text style={[styles.addButtonText, { color: accent }]}>Add supplement</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Tasks Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tasks</Text>
          <Text style={styles.taskCount}>
            {tasksCompleted}/{todosForDate.length}
          </Text>
        </View>
        {todosForDate.length > 0 ? (
          <View>
            <View style={styles.taskList}>
              {todosForDate.map((todo, index) => (
                <SwipeableRow key={todo.id} onDelete={() => onDeleteTodo(todo.id)}>
                  <TouchableOpacity
                    style={[
                      styles.taskRow,
                      index === todosForDate.length - 1 && styles.taskRowLast,
                    ]}
                    onPress={() => handleTodoPress(todo.id)}
                    activeOpacity={0.6}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        todo.completed && [styles.checkboxChecked, { backgroundColor: accent, borderColor: accent }],
                      ]}
                    >
                      {todo.completed && (
                        <Check size={12} color="#fff" strokeWidth={3} />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.taskTitle,
                        todo.completed && styles.taskTitleCompleted,
                      ]}
                      numberOfLines={1}
                    >
                      {todo.title}
                    </Text>
                  </TouchableOpacity>
                </SwipeableRow>
              ))}
            </View>
            <TouchableOpacity style={styles.addTaskRow} onPress={onAddTodo}>
              <Plus size={16} color={accent} strokeWidth={2.5} />
              <Text style={[styles.addTaskRowText, { color: accent }]}>Add task</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No tasks for today</Text>
            <TouchableOpacity style={[styles.addButton, { backgroundColor: accentBg }]} onPress={onAddTodo}>
              <Plus size={16} color={accent} strokeWidth={2.5} />
              <Text style={[styles.addButtonText, { color: accent }]}>Add task</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 140,
  },

  // Hero Card
  heroCard: {
    backgroundColor: '#F5F3FF',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 20,
    padding: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.5,
  },
  dateLabel: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 4,
    fontWeight: '500',
  },
  summaryRow: {
    marginTop: 20,
  },
  summaryText: {
    fontSize: 14,
    color: '#5856D6',
    fontWeight: '600',
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 4,
    backgroundColor: '#5856D6',
    borderRadius: 2,
  },

  // Sections
  section: {
    marginTop: 28,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontSize: 14,
    color: '#5856D6',
    fontWeight: '600',
  },
  taskCount: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '600',
  },

  // Horizontal Row
  horizontalRow: {
    paddingRight: 20,
    gap: 16,
  },

  // Circle Items (Habits & Supplements)
  circleItem: {
    alignItems: 'center',
    width: 64,
  },
  circle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleDefault: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
  },
  circleCompleted: {
    backgroundColor: '#E0F7FA',
    borderWidth: 1.5,
    borderColor: '#80DEEA',
  },
  circleSupplementTaken: {
    backgroundColor: '#E0F7FA',
    borderWidth: 1.5,
    borderColor: '#80DEEA',
  },
  circleEmoji: {
    fontSize: 24,
  },
  circleLabel: {
    fontSize: 11,
    color: '#636366',
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
  checkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#5AC8FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  checkBadgeBlue: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#5AC8FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },

  // Tasks
  taskList: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#fff',
  },
  taskRowLast: {
    borderBottomWidth: 0,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#5856D6',
    borderColor: '#5856D6',
  },
  taskTitle: {
    fontSize: 15,
    color: '#1C1C1E',
    flex: 1,
    fontWeight: '400',
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#AEAEB2',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#AEAEB2',
    marginBottom: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F5F3FF',
  },
  addButtonText: {
    fontSize: 14,
    color: '#5856D6',
    fontWeight: '600',
  },
  addTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  addTaskRowText: {
    fontSize: 15,
    color: '#5856D6',
    fontWeight: '500',
  },
});
