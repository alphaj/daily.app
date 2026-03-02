import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, withSpring } from 'react-native-reanimated';
import { BuddyTaskRow } from './BuddyTaskRow';
import type { BuddyTodo } from '@/lib/sync';

const SPRING_CONFIG = { damping: 28, stiffness: 420, mass: 0.9 };

interface BuddyTaskListProps {
  todos: BuddyTodo[];
  currentUserId?: string;
  onReact?: (todoId: string, pageY: number) => void;
  onAssignedTaskAction?: (todo: BuddyTodo) => void;
  sentReactions?: Map<string, string>;
}

export function BuddyTaskList({
  todos,
  currentUserId,
  onReact,
  onAssignedTaskAction,
  sentReactions,
}: BuddyTaskListProps) {
  const entranceProgress = useSharedValue(0);

  useEffect(() => {
    entranceProgress.value = 0;
    entranceProgress.value = withSpring(1, SPRING_CONFIG);
  }, []);

  if (todos.length === 0) return null;

  const theirTasks = todos.filter((t) => !t.assignedById);
  const fromYou = todos.filter((t) => t.assignedById === currentUserId);
  const completedAll = todos.filter((t) => t.completed).length;

  return (
    <View style={styles.container}>
      {/* Their tasks section */}
      {theirTasks.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tasks</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>
                {completedAll}/{todos.length}
              </Text>
            </View>
          </View>
          {theirTasks.map((todo, i) => (
            <BuddyTaskRow
              key={todo.id}
              todo={todo}
              index={i}
              entranceProgress={entranceProgress}
              onReact={onReact}
              sentReaction={sentReactions?.get(todo.id)}
            />
          ))}
        </View>
      )}

      {/* From-you section */}
      {fromYou.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, styles.assignedTitle]}>From you</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>
                {fromYou.filter((t) => t.completed).length}/{fromYou.length}
              </Text>
            </View>
          </View>
          {fromYou.map((todo, i) => (
            <BuddyTaskRow
              key={todo.id}
              todo={todo}
              index={theirTasks.length + i}
              entranceProgress={entranceProgress}
              onReact={onReact}
              onLongPress={onAssignedTaskAction}
              sentReaction={sentReactions?.get(todo.id)}
              isAssigned
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  assignedTitle: {
    color: '#007AFF',
  },
  countBadge: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  countText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
  },
});
