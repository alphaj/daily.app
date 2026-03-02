import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronDown, ChevronRight, Check, Plus } from 'lucide-react-native';
import * as Haptics from '@/lib/haptics';

import { TaskSection } from './TaskSection';
import { TaskCard } from './TaskCard';
import { BuddyDiscoveryCard } from './BuddyDiscoveryCard';

import { useBuddyInteractions } from '@/hooks/useBuddyInteractions';
import { useTodos } from '@/contexts/TodoContext';
import type { HomeVariantProps } from './types';
import type { Todo, TimeOfDay } from '@/types/todo';

const TIME_OF_DAY_ORDER: TimeOfDay[] = ['anytime', 'morning', 'afternoon', 'evening'];

function IncompleteTasksBanner() {
  const router = useRouter();
  const { incompleteDateMap } = useTodos();

  const totalIncomplete = useMemo(
    () => Object.values(incompleteDateMap).reduce((sum, d) => sum + d.incomplete, 0),
    [incompleteDateMap],
  );

  const dayCount = Object.keys(incompleteDateMap).length;

  if (totalIncomplete === 0) return null;

  return (
    <View style={styles.bannerWrapper}>
      <Pressable
        style={({ pressed }) => [styles.bannerCard, pressed && { opacity: 0.7 }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/incomplete');
        }}
      >
        <View style={styles.bannerBadge}>
          <Text style={styles.bannerBadgeText}>{totalIncomplete}</Text>
        </View>
        <View style={styles.bannerTextCol}>
          <Text style={styles.bannerTitle}>
            Overdue task{totalIncomplete !== 1 ? 's' : ''}
          </Text>
          <Text style={styles.bannerSubtitle}>
            From {dayCount} past day{dayCount !== 1 ? 's' : ''}
          </Text>
        </View>
        <ChevronRight size={16} color="#C7C7CC" strokeWidth={2} />
      </Pressable>
    </View>
  );
}

function groupTodosByTimeOfDay(todos: Todo[]): { active: Record<TimeOfDay, Todo[]>; completed: Todo[] } {
  const active: Record<TimeOfDay, Todo[]> = {
    anytime: [],
    morning: [],
    afternoon: [],
    evening: [],
  };
  const completed: Todo[] = [];
  for (const todo of todos) {
    if (todo.completed) {
      completed.push(todo);
    } else {
      const bucket = todo.timeOfDay || 'anytime';
      active[bucket].push(todo);
    }
  }
  return { active, completed };
}

export function HomeV1(props: HomeVariantProps) {
  const {
    selectedDate,
    isToday,
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

  const { reactionsOnMyTasks } = useBuddyInteractions();

  const [collapsedSections, setCollapsedSections] = useState<Record<TimeOfDay, boolean>>({
    anytime: false,
    morning: false,
    afternoon: false,
    evening: false,
  });
  const [doneExpanded, setDoneExpanded] = useState(false);

  const { active: grouped, completed: completedTodos } = useMemo(
    () => groupTodosByTimeOfDay(todosForDate),
    [todosForDate],
  );

  // Only show sections that have active tasks
  const visibleSections = useMemo(
    () => TIME_OF_DAY_ORDER.filter((tod) => grouped[tod].length > 0),
    [grouped],
  );

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
      <BuddyDiscoveryCard />
      {isToday && <IncompleteTasksBanner />}

      {/* Empty state when no tasks at all */}
      {visibleSections.length === 0 && completedTodos.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📝</Text>
          <Text style={styles.emptyTitle}>No tasks yet</Text>
          <Text style={styles.emptySubtitle}>
            {isToday ? 'Add your first task to get started' : 'Nothing planned for this day'}
          </Text>
          <Pressable
            style={({ pressed }) => [styles.emptyAddButton, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onAddTodo();
            }}
          >
            <Plus size={18} color="#fff" strokeWidth={2.5} />
            <Text style={styles.emptyAddText}>Add a task</Text>
          </Pressable>
        </View>
      )}

      {visibleSections.map((tod) => (
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
          buddyReactions={reactionsOnMyTasks}
        />
      ))}

      {/* All done celebration */}
      {visibleSections.length === 0 && completedTodos.length > 0 && (
        <View style={styles.allDoneState}>
          <Text style={styles.allDoneEmoji}>🎉</Text>
          <Text style={styles.allDoneTitle}>All done!</Text>
          <Text style={styles.allDoneSubtitle}>
            You completed {completedTodos.length} task{completedTodos.length !== 1 ? 's' : ''} today. Nice work.
          </Text>
        </View>
      )}

      {/* Completed / Done section */}
      {completedTodos.length > 0 && (
        <View style={styles.doneSection}>
          <Pressable
            style={styles.doneHeader}
            onPress={() => {
              Haptics.selectionAsync();
              setDoneExpanded(prev => !prev);
            }}
          >
            <View style={styles.donePill}>
              <Check size={12} color="#8E8E93" strokeWidth={2.5} />
              <Text style={styles.doneLabel}>Done ({completedTodos.length})</Text>
              {doneExpanded ? (
                <ChevronDown size={14} color="#8E8E93" strokeWidth={2.5} />
              ) : (
                <ChevronRight size={14} color="#8E8E93" strokeWidth={2.5} />
              )}
            </View>
          </Pressable>

          {doneExpanded && (
            <View style={styles.doneBody}>
              {completedTodos.map((todo) => (
                <TaskCard
                  key={todo.id}
                  todo={todo}
                  onToggle={handleToggleTodo}
                  onDelete={onDeleteTodo}
                  onToggleSubtask={onToggleSubtask}
                  onDeleteSubtask={onDeleteSubtask}
                  onEditSubtask={onEditSubtask}
                  onConvertSubtaskToTask={onConvertSubtaskToTask}
                  onDuplicate={onDuplicateTodo}
                  onReschedule={onRescheduleTodo}
                  onEdit={onEditTodo}
                  buddyReaction={reactionsOnMyTasks?.get(todo.id)}
                />
              ))}
            </View>
          )}
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
    paddingTop: 8,
    paddingBottom: 120,
  },
  bannerWrapper: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(60,60,67,0.06)',
  },
  bannerBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FF9F0A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  bannerBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bannerTextCol: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.2,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 1,
  },
  allDoneState: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 8,
    paddingHorizontal: 40,
  },
  allDoneEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  allDoneTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  allDoneSubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 21,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
  },
  emptyAddText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  doneSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  doneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  donePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(142,142,147,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  doneLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#999',
    letterSpacing: 0.3,
  },
  doneBody: {
    marginTop: 12,
  },
});
