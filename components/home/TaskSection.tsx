import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Plus, ChevronDown } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { TaskCard } from './TaskCard';
import type { Todo, TimeOfDay } from '@/types/todo';

const SECTION_CONFIG: Record<TimeOfDay, { label: string; icon: string }> = {
  anytime: { label: 'ANYTIME', icon: '🕐' },
  morning: { label: 'MORNING', icon: '🌅' },
  afternoon: { label: 'AFTERNOON', icon: '☀️' },
  evening: { label: 'EVENING', icon: '🌙' },
};

interface TaskSectionProps {
  timeOfDay: TimeOfDay;
  tasks: Todo[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onToggleTodo: (id: string) => void;
  onDeleteTodo: (id: string) => void;
  onToggleSubtask?: (todoId: string, subtaskId: string) => void;
  onDeleteSubtask?: (todoId: string, subtaskId: string) => void;
  onEditSubtask?: (todoId: string, subtaskId: string, newTitle: string) => void;
  onConvertSubtaskToTask?: (todoId: string, subtaskId: string) => void;
  onAddTodo: (timeOfDay: TimeOfDay) => void;
  onDuplicateTodo?: (id: string) => void;
  onRescheduleTodo?: (id: string, date: string) => void;
  onEditTodo?: (todo: Todo) => void;
}

export const TaskSection = memo(function TaskSection({
  timeOfDay,
  tasks,
  isCollapsed,
  onToggleCollapse,
  onToggleTodo,
  onDeleteTodo,
  onToggleSubtask,
  onDeleteSubtask,
  onEditSubtask,
  onConvertSubtaskToTask,
  onAddTodo,
  onDuplicateTodo,
  onRescheduleTodo,
  onEditTodo,
}: TaskSectionProps) {
  const config = SECTION_CONFIG[timeOfDay];
  const count = tasks.length;

  const handleCollapse = () => {
    Haptics.selectionAsync();
    onToggleCollapse();
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.sectionHeader}
          onPress={handleCollapse}
        >
          <Text style={styles.pillIcon}>{config.icon}</Text>
          <Text style={styles.pillLabel}>
            {config.label} ({count})
          </Text>
          <ChevronDown size={14} color="#8E8E93" />
        </Pressable>
        <Pressable
          style={styles.addButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onAddTodo(timeOfDay);
          }}
          hitSlop={8}
        >
          <Plus size={18} color="#8E8E93" strokeWidth={2} />
        </Pressable>
      </View>

      {/* Task Cards */}
      {!isCollapsed && (
        <View style={styles.body}>
          {tasks.map((todo) => (
            <TaskCard
              key={todo.id}
              todo={todo}
              onToggle={onToggleTodo}
              onDelete={onDeleteTodo}
              onToggleSubtask={onToggleSubtask}
              onDeleteSubtask={onDeleteSubtask}
              onEditSubtask={onEditSubtask}
              onConvertSubtaskToTask={onConvertSubtaskToTask}
              onDuplicate={onDuplicateTodo}
              onReschedule={onRescheduleTodo}
              onEdit={onEditTodo}
            />
          ))}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginTop: 44,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  pillIcon: {
    fontSize: 14,
  },
  pillLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#8E8E93',
  },
  addButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: 20,
  },
});
