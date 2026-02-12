import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Check, ChevronRight, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import SwipeableRow from '@/components/SwipeableRow';
import type { HomeVariantProps } from './types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Ring constants
const RING_SIZE = 72;
const RING_STROKE = 8;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// Colors
const COLORS = {
  habits: '#5856D6',
  supplements: '#FF9500',
  tasks: '#34C759',
  habitsBg: '#F5F3FF',
  supplementsBg: '#FFF3E0',
  tasksBg: '#F0FFF4',
  textPrimary: '#1C1C1E',
  textSecondary: '#8E8E93',
  cardBg: '#FFFFFF',
  divider: '#F2F2F7',
  background: '#F2F2F7',
};

function ProgressRing({
  completed,
  total,
  color,
  label,
}: {
  completed: number;
  total: number;
  color: string;
  label: string;
}) {
  const progress = total > 0 ? completed / total : 0;
  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - progress);

  return (
    <View style={styles.ringContainer}>
      <Svg width={RING_SIZE} height={RING_SIZE}>
        <G rotation="-90" origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}>
          {/* Background track */}
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={color + '20'}
            strokeWidth={RING_STROKE}
            fill="none"
          />
          {/* Progress arc */}
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={color}
            strokeWidth={RING_STROKE}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
          />
        </G>
      </Svg>
      <Text style={[styles.ringLabel, { color: COLORS.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.ringCount, { color }]}>
        {completed}/{total}
      </Text>
    </View>
  );
}

function HabitChip({
  emoji,
  name,
  completed,
  onPress,
}: {
  emoji?: string;
  name: string;
  completed: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={[
        styles.habitChip,
        { backgroundColor: completed ? COLORS.habitsBg : COLORS.cardBg },
        !completed && styles.chipBorder,
      ]}
    >
      <Text style={styles.chipEmoji}>{emoji || '⚡'}</Text>
      <Text
        style={[styles.chipName, completed && styles.chipNameCompleted]}
        numberOfLines={1}
      >
        {name}
      </Text>
      {completed && (
        <View style={styles.chipCheck}>
          <Check size={14} color={COLORS.habits} strokeWidth={3} />
        </View>
      )}
    </TouchableOpacity>
  );
}

function SupplementChip({
  emoji,
  name,
  completed,
  onPress,
}: {
  emoji?: string;
  name: string;
  completed: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={[
        styles.habitChip,
        {
          backgroundColor: completed
            ? COLORS.supplementsBg
            : COLORS.cardBg,
        },
        !completed && styles.chipBorder,
      ]}
    >
      <Text style={styles.chipEmoji}>{emoji || '💊'}</Text>
      <Text
        style={[
          styles.chipName,
          completed && { color: COLORS.supplements },
        ]}
        numberOfLines={1}
      >
        {name}
      </Text>
      {completed && (
        <View style={[styles.chipCheck, { backgroundColor: COLORS.supplements + '20' }]}>
          <Check size={14} color={COLORS.supplements} strokeWidth={3} />
        </View>
      )}
    </TouchableOpacity>
  );
}

function TaskRow({
  title,
  completed,
  onToggle,
  onDelete,
  isLast,
}: {
  title: string;
  completed: boolean;
  onToggle: () => void;
  onDelete: () => void;
  isLast: boolean;
}) {
  return (
    <SwipeableRow onDelete={onDelete}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onToggle();
        }}
        style={[styles.taskRow, !isLast && styles.taskRowBorder]}
      >
        <View
          style={[
            styles.taskCheckbox,
            completed && styles.taskCheckboxCompleted,
          ]}
        >
          {completed && <Check size={14} color="#fff" strokeWidth={3} />}
        </View>
        <Text
          style={[styles.taskTitle, completed && styles.taskTitleCompleted]}
          numberOfLines={1}
        >
          {title}
        </Text>
      </TouchableOpacity>
    </SwipeableRow>
  );
}

export function HomeV2(props: HomeVariantProps) {
  const {
    habits,
    displayHabits,
    habitsCompleted,
    isCompletedToday,
    onHabitToggle,
    onAddHabit,
    activeSupplements,
    pillsTaken,
    onToggleTaken,
    onAddSupplement,
    todosForDate,
    tasksCompleted,
    onToggleTodo,
    onDeleteTodo,
    onAddTodo,
    selectedDate,
    isToday,
  } = props;

  const isTakenToday = (supplement: { takenDates: string[] }) => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    return supplement.takenDates.includes(dateStr);
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ===== Ring Dashboard Card ===== */}
      <View style={styles.ringCard}>
        <View style={styles.ringsRow}>
          <ProgressRing
            completed={habitsCompleted}
            total={habits.length}
            color={COLORS.habits}
            label="Habits"
          />
          <ProgressRing
            completed={pillsTaken}
            total={activeSupplements.length}
            color={COLORS.supplements}
            label="Supplements"
          />
          <ProgressRing
            completed={tasksCompleted}
            total={todosForDate.length}
            color={COLORS.tasks}
            label="Tasks"
          />
        </View>
      </View>

      {/* ===== Habits Section ===== */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Habits</Text>
        <TouchableOpacity
          onPress={onAddHabit}
          style={styles.addButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Plus size={20} color={COLORS.habits} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {displayHabits.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipScrollContent}
          style={styles.chipScroll}
        >
          {displayHabits.map((habit) => (
            <HabitChip
              key={habit.id}
              emoji={habit.emoji}
              name={habit.name}
              completed={isCompletedToday(habit)}
              onPress={() => onHabitToggle(habit.id)}
            />
          ))}
        </ScrollView>
      ) : (
        <TouchableOpacity
          style={styles.emptyCard}
          activeOpacity={0.7}
          onPress={onAddHabit}
        >
          <Text style={styles.emptyText}>Add your first habit</Text>
          <ChevronRight size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>
      )}

      {/* ===== Supplements Section ===== */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Supplements</Text>
        <TouchableOpacity
          onPress={onAddSupplement}
          style={styles.addButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Plus size={20} color={COLORS.supplements} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {activeSupplements.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipScrollContent}
          style={styles.chipScroll}
        >
          {activeSupplements.map((supplement) => (
            <SupplementChip
              key={supplement.id}
              emoji={supplement.emoji}
              name={supplement.name}
              completed={isTakenToday(supplement)}
              onPress={() => onToggleTaken(supplement.id)}
            />
          ))}
        </ScrollView>
      ) : (
        <TouchableOpacity
          style={styles.emptyCard}
          activeOpacity={0.7}
          onPress={onAddSupplement}
        >
          <Text style={styles.emptyText}>Add your first supplement</Text>
          <ChevronRight size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>
      )}

      {/* ===== Tasks Section ===== */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Tasks</Text>
        <TouchableOpacity
          onPress={onAddTodo}
          style={styles.addButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Plus size={20} color={COLORS.tasks} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {todosForDate.length > 0 ? (
        <View style={styles.taskCard}>
          {todosForDate.map((todo, index) => (
            <TaskRow
              key={todo.id}
              title={todo.title}
              completed={todo.completed}
              onToggle={() => onToggleTodo(todo.id)}
              onDelete={() => onDeleteTodo(todo.id)}
              isLast={index === todosForDate.length - 1}
            />
          ))}
        </View>
      ) : (
        <TouchableOpacity
          style={styles.emptyCard}
          activeOpacity={0.7}
          onPress={onAddTodo}
        >
          <Text style={styles.emptyText}>Add your first task</Text>
          <ChevronRight size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 140,
  },

  // Ring Dashboard Card
  ringCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  ringsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  ringContainer: {
    alignItems: 'center',
    gap: 8,
  },
  ringLabel: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  ringCount: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },

  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.4,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Horizontal chip scroll
  chipScroll: {
    marginBottom: 24,
    marginHorizontal: -20,
  },
  chipScrollContent: {
    paddingHorizontal: 20,
    gap: 10,
  },

  // Habit / Supplement chips
  habitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 160,
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  chipBorder: {
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  chipEmoji: {
    fontSize: 20,
  },
  chipName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  chipNameCompleted: {
    color: COLORS.habits,
  },
  chipCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.habits + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Task card & rows
  taskCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.cardBg,
    gap: 12,
  },
  taskRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.divider,
  },
  taskCheckbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: COLORS.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCheckboxCompleted: {
    backgroundColor: COLORS.habits,
    borderColor: COLORS.habits,
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.textSecondary,
  },

  // Empty state
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
});
