import { useGoBack } from '@/lib/useGoBack';
import { ArrowLeft, Check, CircleAlert, CalendarArrowUp } from 'lucide-react-native';
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from '@/lib/haptics';
import { useTodos } from '@/contexts/TodoContext';
import { AmbientBackground } from '@/components/AmbientBackground';
import { BottomNavBar } from '@/components/BottomNavBar';
import { format } from 'date-fns';
import type { Todo } from '@/types/todo';

function getSeverityColor(incompleteCount: number): string {
  return incompleteCount >= 3 ? '#FF3B30' : '#FFCC00';
}

function TaskRow({ todo, onToggle, onRescheduleToday }: { todo: Todo; onToggle: (id: string) => void; onRescheduleToday: (id: string) => void }) {
  return (
    <View style={styles.taskRow}>
      <View style={[styles.taskEmoji, todo.emojiColor ? { backgroundColor: todo.emojiColor } : undefined]}>
        <Text style={styles.taskEmojiText}>{todo.emoji || '📋'}</Text>
      </View>
      <View style={styles.taskContent}>
        <Text style={styles.taskTitle} numberOfLines={1}>{todo.title}</Text>
        {todo.priority && (
          <Text style={[
            styles.taskPriority,
            todo.priority === 'high' && { color: '#FF3B30' },
            todo.priority === 'medium' && { color: '#FF9500' },
          ]}>
            {todo.priority}
          </Text>
        )}
      </View>
      <View style={styles.taskActions}>
        <Pressable
          style={({ pressed }) => [styles.rescheduleBtn, pressed && styles.rescheduleBtnPressed]}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onRescheduleToday(todo.id);
          }}
          hitSlop={4}
        >
          <CalendarArrowUp size={13} color="#007AFF" strokeWidth={2.5} />
          <Text style={styles.rescheduleBtnText}>Today</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.checkbox, pressed && { opacity: 0.6 }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onToggle(todo.id);
          }}
          hitSlop={4}
        />
      </View>
    </View>
  );
}

export default function IncompleteScreen() {
  const goBack = useGoBack();
  const { incompleteDateMap, getIncompleteTodosForDate, toggleTodo, rescheduleTodo } = useTodos();

  const handleRescheduleToday = (id: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    rescheduleTodo(id, todayStr);
  };

  const sortedDates = useMemo(() => {
    return Object.keys(incompleteDateMap).sort((a, b) => b.localeCompare(a));
  }, [incompleteDateMap]);

  const totalIncomplete = useMemo(() => {
    return Object.values(incompleteDateMap).reduce((sum, d) => sum + d.incomplete, 0);
  }, [incompleteDateMap]);

  return (
    <View style={styles.container}>
      <AmbientBackground />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={goBack}
            hitSlop={20}
          >
            <ArrowLeft size={20} color="#1C1C1E" strokeWidth={2.5} />
          </Pressable>
          <Text style={styles.headerTitle}>Incomplete</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {sortedDates.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Check size={32} color="#34C759" strokeWidth={2.5} />
              </View>
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptySubtitle}>No incomplete tasks from past days.</Text>
            </View>
          ) : (
            <>
              <View style={styles.summaryCard}>
                <CircleAlert size={18} color="#FF9500" strokeWidth={2} />
                <Text style={styles.summaryText}>
                  {totalIncomplete} task{totalIncomplete !== 1 ? 's' : ''} across {sortedDates.length} day{sortedDates.length !== 1 ? 's' : ''}
                </Text>
              </View>

              {sortedDates.map((dateKey) => {
                const counts = incompleteDateMap[dateKey];
                const tasks = getIncompleteTodosForDate(dateKey);
                const color = getSeverityColor(counts.incomplete);
                const dateObj = new Date(dateKey + 'T12:00:00');

                const handleMoveAllToday = () => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  const todayStr = new Date().toISOString().split('T')[0];
                  tasks.forEach((todo) => rescheduleTodo(todo.id, todayStr));
                };

                return (
                  <View key={dateKey} style={styles.dateSection}>
                    <View style={styles.dateHeader}>
                      <View style={styles.dateHeaderLeft}>
                        <View style={[styles.datePill, { backgroundColor: counts.incomplete >= 3 ? 'rgba(255,59,48,0.08)' : 'rgba(255,204,0,0.10)' }]}>
                          <View style={[styles.dateIndicator, { backgroundColor: color }]} />
                          <Text style={[styles.datePillLabel, { color: counts.incomplete >= 3 ? '#D70015' : '#8B7000' }]}>
                            {format(dateObj, 'EEE, MMM d').toUpperCase()} ({counts.incomplete})
                          </Text>
                        </View>
                      </View>
                      <Pressable
                        style={({ pressed }) => [styles.moveAllBtn, pressed && styles.moveAllBtnPressed]}
                        onPress={handleMoveAllToday}
                        hitSlop={8}
                      >
                        <CalendarArrowUp size={12} color="#007AFF" strokeWidth={2.5} />
                        <Text style={styles.moveAllBtnText}>All to today</Text>
                      </Pressable>
                    </View>
                    <View style={styles.taskList}>
                      {tasks.map((todo) => (
                        <TaskRow key={todo.id} todo={todo} onToggle={toggleTodo} onRescheduleToday={handleRescheduleToday} />
                      ))}
                    </View>
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>

        <BottomNavBar />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: -1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 120,
    paddingHorizontal: 20,
    gap: 16,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,149,0,0.08)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  summaryText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1C1C1E',
    letterSpacing: -0.2,
  },
  dateSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dateHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  datePillLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  dateIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  moveAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
  },
  moveAllBtnPressed: {
    backgroundColor: 'rgba(0, 122, 255, 0.16)',
  },
  moveAllBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  taskList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(60,60,67,0.08)',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  taskEmoji: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(120,120,128,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskEmojiText: {
    fontSize: 20,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.2,
  },
  taskPriority: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rescheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
  },
  rescheduleBtnPressed: {
    backgroundColor: 'rgba(0, 122, 255, 0.16)',
  },
  rescheduleBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#D1D1D6',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(52,199,89,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#8E8E93',
  },
});
