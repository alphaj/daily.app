import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react-native';
import * as Haptics from '@/lib/haptics';
import { TaskCard } from './TaskCard';
import type { Todo, TimeOfDay } from '@/types/todo';

const SECTION_LABELS: Record<TimeOfDay, string> = {
  anytime: 'Anytime',
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
};

const SECTION_EMOJIS: Record<TimeOfDay, string> = {
  anytime: '📌',
  morning: '🌅',
  afternoon: '☀️',
  evening: '🌙',
};

const SECTION_COLORS: Record<TimeOfDay, { text: string }> = {
  anytime: { text: '#6C6C70' },
  morning: { text: '#8B7000' },
  afternoon: { text: '#8B5200' },
  evening: { text: '#4240A0' },
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
  buddyReactions?: Map<string, string>;
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
  buddyReactions,
}: TaskSectionProps) {
  const label = SECTION_LABELS[timeOfDay];
  const emoji = SECTION_EMOJIS[timeOfDay];
  const colors = SECTION_COLORS[timeOfDay];
  const todayKey = new Date().toISOString().split('T')[0];

  const handleCollapse = () => {
    Haptics.selectionAsync();
    onToggleCollapse();
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <Pressable onPress={handleCollapse} hitSlop={8} style={styles.headerLeft}>
          <Text style={styles.sectionEmoji}>{emoji}</Text>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>
            {label}
          </Text>
          <Text style={styles.sectionCount}>{tasks.length}</Text>
          {isCollapsed ? (
            <ChevronRight size={16} color={colors.text} strokeWidth={2.5} />
          ) : (
            <ChevronDown size={16} color={colors.text} strokeWidth={2.5} />
          )}
        </Pressable>
        <Pressable
          style={styles.addButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onAddTodo(timeOfDay);
          }}
          hitSlop={8}
        >
          <Plus size={18} color="#C7C7CC" strokeWidth={2} />
        </Pressable>
      </View>

      {/* Task Cards */}
      {!isCollapsed && (
        <View style={styles.body}>
          {tasks.length === 0 ? (
            <Pressable
              style={styles.emptyPlaceholder}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onAddTodo(timeOfDay);
              }}
            >
              <Plus size={14} color="#C7C7CC" strokeWidth={2.5} />
              <Text style={styles.emptyText}>Add a task</Text>
            </Pressable>
          ) : (
            tasks.map((todo) => (
              <TaskCard
                key={todo.id}
                todo={todo}
                timeOfDay={timeOfDay}
                isOverdue={!todo.completed && todo.dueDate < todayKey}
                onToggle={onToggleTodo}
                onDelete={onDeleteTodo}
                onToggleSubtask={onToggleSubtask}
                onDeleteSubtask={onDeleteSubtask}
                onEditSubtask={onEditSubtask}
                onConvertSubtaskToTask={onConvertSubtaskToTask}
                onDuplicate={onDuplicateTodo}
                onReschedule={onRescheduleTodo}
                onEdit={onEditTodo}
                buddyReaction={buddyReactions?.get(todo.id)}
              />
            ))
          )}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sectionEmoji: {
    fontSize: 18,
    marginRight: 4,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    marginLeft: 2,
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
  emptyPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 14,
    color: '#C7C7CC',
    fontWeight: '500',
  },
});
