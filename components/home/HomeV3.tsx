import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Check, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import SwipeableRow from '@/components/SwipeableRow';
import type { HomeVariantProps } from './types';
import type { Habit } from '@/types/habit';
import type { Supplement } from '@/types/supplement';
import type { Todo } from '@/types/todo';

// ─── Circular Checkbox ────────────────────────────────────────────────────────

function Checkbox({
  checked,
  color = '#5856D6',
  rounded = false,
}: {
  checked: boolean;
  color?: string;
  rounded?: boolean;
}) {
  const borderRadius = rounded ? 6 : 12;

  if (checked) {
    return (
      <View style={[styles.checkboxFilled, { backgroundColor: color, borderRadius }]}>
        <Check size={14} color="#fff" strokeWidth={3} />
      </View>
    );
  }

  return <View style={[styles.checkboxEmpty, { borderRadius }]} />;
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );
}

// ─── Hairline Divider ─────────────────────────────────────────────────────────

function Divider() {
  return <View style={styles.divider} />;
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyRow({ label, onAdd }: { label: string; onAdd: () => void }) {
  return (
    <View style={styles.emptyRow}>
      <Text style={styles.emptyText}>{label}</Text>
      <TouchableOpacity onPress={onAdd} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <View style={styles.emptyAddRow}>
          <Plus size={13} color="#5856D6" strokeWidth={2.5} />
          <Text style={styles.emptyAddText}>Add</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function HomeV3(props: HomeVariantProps) {
  const {
    displayHabits,
    habitsCompleted,
    isCompletedToday,
    onHabitToggle,
    onDeleteHabit,
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
    isPastDate,
  } = props;

  // ── Progress calculation ────────────────────────────────────────────────────

  const totalItems = displayHabits.length + activeSupplements.length + todosForDate.length;
  const totalCompleted = habitsCompleted + pillsTaken + tasksCompleted;
  const progress = totalItems > 0 ? totalCompleted / totalItems : 0;

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleHabitToggle = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onHabitToggle(id);
  };

  const handleSupplementToggle = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleTaken(id);
  };

  const handleTodoToggle = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleTodo(id);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Progress Bar */}
      {totalItems > 0 && (
        <View style={styles.progressSection}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(progress * 100, 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {totalCompleted} of {totalItems} complete
          </Text>
        </View>
      )}

      {/* ── Habits Group ─────────────────────────────────────────────────── */}

      {(displayHabits.length > 0 || !isPastDate) && (
        <View style={styles.group}>
          <SectionHeader title="HABITS" />
          {displayHabits.length > 0 ? (
            displayHabits.map((habit: Habit, index: number) => {
              const completed = isCompletedToday(habit);
              return (
                <React.Fragment key={habit.id}>
                  {index > 0 && <Divider />}
                  <SwipeableRow onDelete={() => onDeleteHabit(habit.id)}>
                    <TouchableOpacity
                      activeOpacity={0.6}
                      onPress={() => handleHabitToggle(habit.id)}
                      style={styles.row}
                    >
                      <View style={styles.emojiCircle}>
                        <Text style={styles.emoji}>{habit.emoji || '⚡'}</Text>
                      </View>
                      <Text
                        style={[
                          styles.rowLabel,
                          completed && styles.rowLabelCompleted,
                        ]}
                        numberOfLines={1}
                      >
                        {habit.name}
                      </Text>
                      <Checkbox checked={completed} color="#5856D6" />
                    </TouchableOpacity>
                  </SwipeableRow>
                </React.Fragment>
              );
            })
          ) : (
            <EmptyRow label="No habits yet" onAdd={onAddHabit} />
          )}
        </View>
      )}

      {/* ── Supplements Group ────────────────────────────────────────────── */}

      {(activeSupplements.length > 0 || !isPastDate) && (
        <View style={styles.group}>
          <SectionHeader title="SUPPLEMENTS" />
          {activeSupplements.length > 0 ? (
            activeSupplements.map((supp: Supplement, index: number) => {
              const taken = supp.takenDates?.some(
                (d) =>
                  d.slice(0, 10) ===
                  props.selectedDate.toISOString().slice(0, 10)
              );
              return (
                <React.Fragment key={supp.id}>
                  {index > 0 && <Divider />}
                  <SwipeableRow onDelete={() => onDeleteSupplement(supp.id)}>
                    <TouchableOpacity
                      activeOpacity={0.6}
                      onPress={() => handleSupplementToggle(supp.id)}
                      style={styles.row}
                    >
                      <View style={styles.emojiCircle}>
                        <Text style={styles.emoji}>{supp.emoji || '💊'}</Text>
                      </View>
                      <Text
                        style={[
                          styles.rowLabel,
                          taken && styles.rowLabelCompleted,
                        ]}
                        numberOfLines={1}
                      >
                        {supp.name}
                      </Text>
                      <Checkbox checked={!!taken} color="#FF9500" />
                    </TouchableOpacity>
                  </SwipeableRow>
                </React.Fragment>
              );
            })
          ) : (
            <EmptyRow label="No supplements yet" onAdd={onAddSupplement} />
          )}
        </View>
      )}

      {/* ── Tasks Group ──────────────────────────────────────────────────── */}

      {(todosForDate.length > 0 || !isPastDate) && (
        <View style={styles.group}>
          <SectionHeader title={isPastDate ? 'COMPLETED' : 'TASKS'} />
          {todosForDate.length > 0 ? (
            todosForDate.map((todo: Todo, index: number) => {
              const isWork = todo.isWork === true;
              return (
                <React.Fragment key={todo.id}>
                  {index > 0 && <Divider />}
                  <SwipeableRow onDelete={() => onDeleteTodo(todo.id)}>
                    <TouchableOpacity
                      activeOpacity={0.6}
                      onPress={() => handleTodoToggle(todo.id)}
                      style={styles.row}
                    >
                      <Checkbox
                        checked={todo.completed}
                        color="#5856D6"
                        rounded={isWork}
                      />
                      <Text
                        style={[
                          styles.rowLabelTask,
                          todo.completed && styles.rowLabelTaskCompleted,
                        ]}
                        numberOfLines={1}
                      >
                        {todo.title}
                      </Text>
                    </TouchableOpacity>
                  </SwipeableRow>
                </React.Fragment>
              );
            })
          ) : (
            <EmptyRow label="No tasks yet" onAdd={onAddTodo} />
          )}
        </View>
      )}
    </ScrollView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    paddingBottom: 140,
    paddingTop: 8,
  },

  // Progress
  progressSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  progressTrack: {
    height: 3,
    backgroundColor: '#E5E5EA',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    backgroundColor: '#5856D6',
    borderRadius: 1.5,
  },
  progressText: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'right',
    marginTop: 6,
  },

  // Group
  group: {
    marginTop: 12,
  },

  // Section header
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    height: 52,
    backgroundColor: '#fff',
  },

  // Emoji circle (habits & supplements)
  emojiCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emoji: {
    fontSize: 20,
    lineHeight: 24,
  },

  // Row labels
  rowLabel: {
    flex: 1,
    fontSize: 17,
    color: '#000',
    letterSpacing: -0.3,
  },
  rowLabelCompleted: {
    opacity: 0.5,
  },
  rowLabelTask: {
    flex: 1,
    fontSize: 17,
    color: '#000',
    letterSpacing: -0.3,
    marginLeft: 12,
  },
  rowLabelTaskCompleted: {
    opacity: 0.5,
    textDecorationLine: 'line-through',
  },

  // Checkbox
  checkboxEmpty: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#C7C7CC',
  },
  checkboxFilled: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Divider
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5EA',
    marginLeft: 64,
    marginRight: 20,
  },

  // Empty state
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    height: 52,
  },
  emptyText: {
    fontSize: 15,
    color: '#C7C7CC',
    fontStyle: 'italic',
  },
  emptyAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  emptyAddText: {
    fontSize: 15,
    color: '#5856D6',
    fontWeight: '500',
    marginLeft: 2,
  },
});
