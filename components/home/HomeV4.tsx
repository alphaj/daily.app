import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { Check, Plus, ChevronRight } from 'lucide-react-native';
import SwipeableRow from '@/components/SwipeableRow';
import type { HomeVariantProps } from './types';
import type { Habit } from '@/types/habit';
import type { Supplement } from '@/types/supplement';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_GAP = 12;
const HORIZONTAL_PADDING = 16;
const HALF_CARD_WIDTH =
  (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - CARD_GAP) / 2;

const MAX_HABITS_GRID = 4;
const MAX_SUPPLEMENTS_LIST = 3;
const MAX_TASKS_LIST = 5;

export function HomeV4(props: HomeVariantProps) {
  const {
    selectedDate,
    isToday,
    displayHabits,
    hasMoreHabits,
    habitsCompleted,
    habits,
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

  // Determine which habits to show in the 2x2 grid
  const gridHabits = useMemo(
    () => displayHabits.slice(0, MAX_HABITS_GRID),
    [displayHabits],
  );

  const extraHabitsCount = useMemo(() => {
    if (hasMoreHabits) return habits.length - MAX_HABITS_GRID;
    return displayHabits.length > MAX_HABITS_GRID
      ? displayHabits.length - MAX_HABITS_GRID
      : 0;
  }, [displayHabits, hasMoreHabits, habits]);

  const supplementsToShow = useMemo(
    () => activeSupplements.slice(0, MAX_SUPPLEMENTS_LIST),
    [activeSupplements],
  );

  const tasksToShow = useMemo(
    () => todosForDate.slice(0, MAX_TASKS_LIST),
    [todosForDate],
  );

  const hasAnyContent =
    displayHabits.length > 0 ||
    activeSupplements.length > 0 ||
    todosForDate.length > 0;

  // Overall progress for the small progress card
  const totalItems =
    displayHabits.length + activeSupplements.length + todosForDate.length;
  const totalDone = habitsCompleted + pillsTaken + tasksCompleted;
  const progressPercent =
    totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0;

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Row 1: Habits + Supplements side by side */}
      <View style={styles.row}>
        {/* Habits Card */}
        <View style={[styles.card, styles.halfCard]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Habits</Text>
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>
                {habitsCompleted}/{displayHabits.length}
              </Text>
            </View>
          </View>

          {displayHabits.length > 0 ? (
            <>
              <View style={styles.habitGrid}>
                {gridHabits.map((habit) => {
                  const completed = isCompletedToday(habit);
                  return (
                    <TouchableOpacity
                      key={habit.id}
                      style={[
                        styles.habitCircle,
                        completed && styles.habitCircleCompleted,
                      ]}
                      onPress={() => handleHabitPress(habit.id)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.habitEmoji,
                          completed && styles.habitEmojiCompleted,
                        ]}
                      >
                        {habit.emoji || '✨'}
                      </Text>
                      {completed && (
                        <View style={styles.habitCheckBadge}>
                          <Check size={8} color="#fff" strokeWidth={3} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
              {extraHabitsCount > 0 && (
                <TouchableOpacity onPress={onAddHabit} activeOpacity={0.6}>
                  <Text style={styles.moreText}>+{extraHabitsCount} more</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.emptyCardContent}>
              <TouchableOpacity
                style={styles.emptyAddCircle}
                onPress={onAddHabit}
                activeOpacity={0.7}
              >
                <Plus size={20} color="#8E8E93" strokeWidth={2} />
              </TouchableOpacity>
              <Text style={styles.emptyCardText}>Add habits</Text>
            </View>
          )}
        </View>

        {/* Supplements Card */}
        <View style={[styles.card, styles.halfCard]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Pills</Text>
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>
                {pillsTaken}/{activeSupplements.length}
              </Text>
            </View>
          </View>

          {activeSupplements.length > 0 ? (
            <View style={styles.supplementList}>
              {supplementsToShow.map((supplement) => {
                const taken = isSupplementTaken(supplement);
                return (
                  <TouchableOpacity
                    key={supplement.id}
                    style={styles.supplementRow}
                    onPress={() => handleSupplementPress(supplement.id)}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.supplementEmoji}>
                      {supplement.emoji || '💊'}
                    </Text>
                    <Text
                      style={[
                        styles.supplementName,
                        taken && styles.supplementNameTaken,
                      ]}
                      numberOfLines={1}
                    >
                      {supplement.name}
                    </Text>
                    <View
                      style={[
                        styles.supplementCheck,
                        taken && styles.supplementCheckTaken,
                      ]}
                    >
                      {taken && (
                        <Check size={10} color="#fff" strokeWidth={3} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
              {activeSupplements.length > MAX_SUPPLEMENTS_LIST && (
                <TouchableOpacity
                  onPress={onAddSupplement}
                  activeOpacity={0.6}
                >
                  <Text style={styles.moreText}>
                    +{activeSupplements.length - MAX_SUPPLEMENTS_LIST} more
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.emptyCardContent}>
              <TouchableOpacity
                style={styles.emptyAddCircle}
                onPress={onAddSupplement}
                activeOpacity={0.7}
              >
                <Plus size={20} color="#8E8E93" strokeWidth={2} />
              </TouchableOpacity>
              <Text style={styles.emptyCardText}>Add pills</Text>
            </View>
          )}
        </View>
      </View>

      {/* Row 2: Tasks full-width card */}
      <View style={[styles.card, styles.fullCard]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Tasks</Text>
          <View style={styles.countPill}>
            <Text style={styles.countPillText}>
              {tasksCompleted}/{todosForDate.length}
            </Text>
          </View>
        </View>

        {todosForDate.length > 0 ? (
          <>
            <View style={styles.taskList}>
              {tasksToShow.map((todo, index) => (
                <SwipeableRow
                  key={todo.id}
                  onDelete={() => onDeleteTodo(todo.id)}
                >
                  <TouchableOpacity
                    style={[
                      styles.taskRow,
                      index < tasksToShow.length - 1 && styles.taskRowBorder,
                    ]}
                    onPress={() => handleTodoPress(todo.id)}
                    activeOpacity={0.6}
                  >
                    <View
                      style={[
                        styles.taskCheckbox,
                        todo.completed && styles.taskCheckboxChecked,
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
            {todosForDate.length > MAX_TASKS_LIST && (
              <TouchableOpacity
                style={styles.seeAllRow}
                onPress={onAddTodo}
                activeOpacity={0.6}
              >
                <Text style={styles.seeAllText}>See all tasks</Text>
                <ChevronRight size={16} color="#5856D6" strokeWidth={2} />
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View style={styles.emptyTaskContent}>
            <Text style={styles.emptyTaskTitle}>No tasks</Text>
            <TouchableOpacity
              style={styles.emptyTaskButton}
              onPress={onAddTodo}
              activeOpacity={0.7}
            >
              <Plus size={18} color="#5856D6" strokeWidth={2.5} />
              <Text style={styles.emptyTaskButtonText}>Add task</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Row 3: Quick Add + Progress — only show if there is existing content */}
      {hasAnyContent && (
        <View style={styles.row}>
          {/* Quick Add Card */}
          <TouchableOpacity
            style={[styles.card, styles.halfCard, styles.quickAddCard]}
            onPress={onAddTodo}
            activeOpacity={0.7}
          >
            <View style={styles.quickAddCircle}>
              <Plus size={24} color="#5856D6" strokeWidth={2.5} />
            </View>
            <Text style={styles.quickAddText}>Add something</Text>
          </TouchableOpacity>

          {/* Progress Card */}
          <View style={[styles.card, styles.halfCard, styles.progressCard]}>
            <Text style={styles.progressLabel}>Today</Text>
            <Text style={styles.progressPercent}>{progressPercent}%</Text>
            <Text style={styles.progressSubtext}>
              {totalDone}/{totalItems} done
            </Text>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${progressPercent}%` },
                ]}
              />
            </View>
          </View>
        </View>
      )}

      {/* Get Started card if no content at all */}
      {!hasAnyContent && (
        <View style={[styles.card, styles.fullCard, styles.getStartedCard]}>
          <Text style={styles.getStartedTitle}>Get started</Text>
          <Text style={styles.getStartedSubtext}>
            Add habits, supplements, or tasks to start tracking your day.
          </Text>
          <View style={styles.getStartedActions}>
            <TouchableOpacity
              style={styles.getStartedButton}
              onPress={onAddHabit}
              activeOpacity={0.7}
            >
              <Plus size={14} color="#5856D6" strokeWidth={2.5} />
              <Text style={styles.getStartedButtonText}>Habit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.getStartedButton}
              onPress={onAddSupplement}
              activeOpacity={0.7}
            >
              <Plus size={14} color="#5856D6" strokeWidth={2.5} />
              <Text style={styles.getStartedButtonText}>Pill</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.getStartedButton}
              onPress={onAddTodo}
              activeOpacity={0.7}
            >
              <Plus size={14} color="#5856D6" strokeWidth={2.5} />
              <Text style={styles.getStartedButtonText}>Task</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: 140,
    paddingTop: 8,
  },

  // Layout
  row: {
    flexDirection: 'row',
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },

  // Cards
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  halfCard: {
    flex: 1,
  },
  fullCard: {
    marginBottom: CARD_GAP,
  },

  // Card Header
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.2,
  },
  countPill: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  countPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },

  // Habits Card
  habitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-start',
  },
  habitCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitCircleCompleted: {
    backgroundColor: '#5856D6',
  },
  habitEmoji: {
    fontSize: 18,
  },
  habitEmojiCompleted: {
    opacity: 0.75,
  },
  habitCheckBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#5856D6',
  },
  moreText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
    marginTop: 10,
  },

  // Supplements Card
  supplementList: {
    gap: 8,
  },
  supplementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  supplementEmoji: {
    fontSize: 16,
  },
  supplementName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1C1C1E',
    flex: 1,
  },
  supplementNameTaken: {
    color: '#AEAEB2',
  },
  supplementCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#D1D1D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supplementCheckTaken: {
    backgroundColor: '#FF9500',
    borderColor: '#FF9500',
  },

  // Tasks Card
  taskList: {
    overflow: 'hidden',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  taskRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F2F2F7',
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D1D6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  taskCheckboxChecked: {
    backgroundColor: '#5856D6',
    borderColor: '#5856D6',
  },
  taskTitle: {
    fontSize: 16,
    color: '#1C1C1E',
    flex: 1,
    fontWeight: '400',
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#AEAEB2',
  },
  seeAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    color: '#5856D6',
    fontWeight: '600',
  },

  // Empty States
  emptyCardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  emptyAddCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyCardText: {
    fontSize: 13,
    color: '#AEAEB2',
    fontWeight: '500',
  },
  emptyTaskContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyTaskTitle: {
    fontSize: 16,
    color: '#AEAEB2',
    fontWeight: '500',
    marginBottom: 12,
  },
  emptyTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F5F3FF',
  },
  emptyTaskButtonText: {
    fontSize: 14,
    color: '#5856D6',
    fontWeight: '600',
  },

  // Quick Add Card
  quickAddCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  quickAddCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickAddText: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '600',
  },

  // Progress Card
  progressCard: {
    justifyContent: 'center',
    paddingVertical: 20,
  },
  progressLabel: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 4,
  },
  progressPercent: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -1,
  },
  progressSubtext: {
    fontSize: 12,
    color: '#AEAEB2',
    fontWeight: '500',
    marginTop: 2,
    marginBottom: 12,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: '#F2F2F7',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 4,
    backgroundColor: '#5856D6',
    borderRadius: 2,
  },

  // Get Started Card
  getStartedCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  getStartedTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  getStartedSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  getStartedActions: {
    flexDirection: 'row',
    gap: 10,
  },
  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F5F3FF',
  },
  getStartedButtonText: {
    fontSize: 13,
    color: '#5856D6',
    fontWeight: '600',
  },
});
