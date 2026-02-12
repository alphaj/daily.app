import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { format, subDays } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { Check, Plus } from 'lucide-react-native';
import SwipeableRow from '@/components/SwipeableRow';
import type { HomeVariantProps } from './types';
import type { Habit } from '@/types/habit';
import type { Supplement } from '@/types/supplement';

type TabKey = 'habits' | 'pills' | 'tasks';

export function HomeV5(props: HomeVariantProps) {
  const {
    selectedDate,
    isToday,
    displayHabits,
    habitsCompleted,
    isCompletedToday,
    onHabitToggle,
    onAddHabit,
    getWeekDots,
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

  const [activeTab, setActiveTab] = useState<TabKey>('habits');

  const isSupplementTaken = useCallback(
    (supplement: Supplement) => {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      return supplement.takenDates.includes(dateStr);
    },
    [selectedDate],
  );

  const handleTabPress = useCallback((tab: TabKey) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  }, []);

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

  // Generate last 7 days date strings for week dots
  const weekDates = useMemo(() => {
    const dates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      dates.push(format(subDays(selectedDate, i), 'yyyy-MM-dd'));
    }
    return dates;
  }, [selectedDate]);

  const habitsCount = `${habitsCompleted}/${displayHabits.length}`;
  const pillsCount = `${pillsTaken}/${activeSupplements.length}`;
  const tasksCount = `${tasksCompleted}/${todosForDate.length}`;

  const tabs: { key: TabKey; label: string; count: string }[] = [
    { key: 'habits', label: 'Habits', count: habitsCount },
    { key: 'pills', label: 'Pills', count: pillsCount },
    { key: 'tasks', label: 'Tasks', count: tasksCount },
  ];

  const statusPills: { key: TabKey; emoji: string; count: string }[] = [
    { key: 'habits', emoji: '\uD83C\uDFAF', count: habitsCount },
    { key: 'pills', emoji: '\uD83D\uDC8A', count: pillsCount },
    { key: 'tasks', emoji: '\u2705', count: tasksCount },
  ];

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Segment Control */}
      <View style={styles.segmentContainer}>
        <View style={styles.segmentControl}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.segmentTab,
                  isActive && styles.segmentTabActive,
                ]}
                onPress={() => handleTabPress(tab.key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.segmentLabel,
                    isActive && styles.segmentLabelActive,
                  ]}
                >
                  {tab.label}
                </Text>
                <Text
                  style={[
                    styles.segmentCount,
                    isActive && styles.segmentCountActive,
                  ]}
                >
                  {tab.count}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Status Summary Bar */}
      <View style={styles.statusBar}>
        {statusPills.map((pill) => {
          const isActive = activeTab === pill.key;
          return (
            <View
              key={pill.key}
              style={[
                styles.statusPill,
                isActive && styles.statusPillActive,
              ]}
            >
              <Text style={styles.statusEmoji}>{pill.emoji}</Text>
              <Text
                style={[
                  styles.statusText,
                  isActive && styles.statusTextActive,
                ]}
              >
                {pill.count}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Content Area */}
      {activeTab === 'habits' && (
        <View style={styles.contentArea}>
          {displayHabits.length > 0 ? (
            displayHabits.map((habit) => {
              const completed = isCompletedToday(habit);
              const dots = getWeekDots(weekDates);
              return (
                <TouchableOpacity
                  key={habit.id}
                  style={styles.habitCard}
                  onPress={() => handleHabitPress(habit.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.habitEmojiCircle,
                      completed && styles.habitEmojiCircleCompleted,
                    ]}
                  >
                    <Text style={styles.habitEmoji}>
                      {habit.emoji || '\u2728'}
                    </Text>
                  </View>
                  <View style={styles.habitContent}>
                    <Text style={styles.habitName} numberOfLines={1}>
                      {habit.name}
                    </Text>
                    <View style={styles.weekDotsRow}>
                      {dots.map((filled, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.weekDot,
                            filled && styles.weekDotFilled,
                          ]}
                        />
                      ))}
                    </View>
                  </View>
                  <View
                    style={[
                      styles.habitCheckbox,
                      completed && styles.habitCheckboxChecked,
                    ]}
                  >
                    {completed && (
                      <Check size={16} color="#fff" strokeWidth={3} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No habits yet</Text>
              <Text style={styles.emptySubtitle}>
                Start building your daily routine
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.addCard}
            onPress={onAddHabit}
            activeOpacity={0.6}
          >
            <Plus size={20} color="#C7C7CC" strokeWidth={2} />
            <Text style={styles.addCardText}>Add habit</Text>
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'pills' && (
        <View style={styles.contentArea}>
          {activeSupplements.length > 0 ? (
            activeSupplements.map((supplement) => {
              const taken = isSupplementTaken(supplement);
              return (
                <TouchableOpacity
                  key={supplement.id}
                  style={styles.pillCard}
                  onPress={() => handleSupplementPress(supplement.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.pillEmojiCircle,
                      taken && styles.pillEmojiCircleTaken,
                    ]}
                  >
                    <Text style={styles.pillEmoji}>
                      {supplement.emoji || '\uD83D\uDC8A'}
                    </Text>
                  </View>
                  <View style={styles.pillContent}>
                    <Text style={styles.pillName} numberOfLines={1}>
                      {supplement.name}
                    </Text>
                    {supplement.dosage ? (
                      <Text style={styles.pillDosage} numberOfLines={1}>
                        {supplement.dosage}
                      </Text>
                    ) : null}
                  </View>
                  <View
                    style={[
                      styles.pillCheckbox,
                      taken && styles.pillCheckboxChecked,
                    ]}
                  >
                    {taken && (
                      <Check size={16} color="#fff" strokeWidth={3} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No supplements yet</Text>
              <Text style={styles.emptySubtitle}>
                Track your daily vitamins and supplements
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.addCard}
            onPress={onAddSupplement}
            activeOpacity={0.6}
          >
            <Plus size={20} color="#C7C7CC" strokeWidth={2} />
            <Text style={styles.addCardText}>Add supplement</Text>
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'tasks' && (
        <View style={styles.contentArea}>
          {todosForDate.length > 0 ? (
            todosForDate.map((todo) => (
              <SwipeableRow
                key={todo.id}
                onDelete={() => onDeleteTodo(todo.id)}
              >
                <TouchableOpacity
                  style={styles.taskCard}
                  onPress={() => handleTodoPress(todo.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.taskCheckbox,
                      todo.completed && styles.taskCheckboxChecked,
                    ]}
                  >
                    {todo.completed && (
                      <Check size={14} color="#fff" strokeWidth={3} />
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
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No tasks for today</Text>
              <Text style={styles.emptySubtitle}>
                Add tasks to stay on track
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.addCard}
            onPress={onAddTodo}
            activeOpacity={0.6}
          >
            <Plus size={20} color="#C7C7CC" strokeWidth={2} />
            <Text style={styles.addCardText}>Add task</Text>
          </TouchableOpacity>
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
    paddingBottom: 140,
  },

  // Segment Control
  segmentContainer: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  segmentControl: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    height: 44,
    padding: 4,
  },
  segmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    gap: 4,
  },
  segmentTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  segmentLabelActive: {
    fontWeight: '700',
    color: '#1C1C1E',
  },
  segmentCount: {
    fontSize: 12,
    fontWeight: '500',
    color: '#AEAEB2',
  },
  segmentCountActive: {
    fontWeight: '600',
    color: '#636366',
  },

  // Status Summary Bar
  statusBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    gap: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  statusPillActive: {
    backgroundColor: '#E8E8ED',
  },
  statusEmoji: {
    fontSize: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
  },
  statusTextActive: {
    fontWeight: '700',
    color: '#1C1C1E',
  },

  // Content Area
  contentArea: {
    paddingHorizontal: 20,
    marginTop: 16,
  },

  // Habit Cards
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
  },
  habitEmojiCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitEmojiCircleCompleted: {
    backgroundColor: '#5856D6',
  },
  habitEmoji: {
    fontSize: 20,
  },
  habitContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  habitName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.2,
  },
  weekDotsRow: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 4,
  },
  weekDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E5EA',
  },
  weekDotFilled: {
    backgroundColor: '#5856D6',
  },
  habitCheckbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#D1D1D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitCheckboxChecked: {
    backgroundColor: '#5856D6',
    borderColor: '#5856D6',
  },

  // Pill Cards
  pillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
  },
  pillEmojiCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillEmojiCircleTaken: {
    backgroundColor: '#FF9500',
  },
  pillEmoji: {
    fontSize: 20,
  },
  pillContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  pillName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.2,
  },
  pillDosage: {
    fontSize: 13,
    fontWeight: '400',
    color: '#8E8E93',
    marginTop: 2,
  },
  pillCheckbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#D1D1D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillCheckboxChecked: {
    backgroundColor: '#FF9500',
    borderColor: '#FF9500',
  },

  // Task Cards
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
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
    fontWeight: '400',
    color: '#1C1C1E',
    flex: 1,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#AEAEB2',
  },

  // Add Card (dashed border)
  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderColor: '#C7C7CC',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 4,
    gap: 8,
  },
  addCardText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#C7C7CC',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#AEAEB2',
  },
});
