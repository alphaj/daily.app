import { useRouter } from 'expo-router';
import { useGoBack } from '@/lib/useGoBack';
import { ArrowLeft, Check, CircleAlert } from 'lucide-react-native';
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

function TaskRow({ todo, onToggle }: { todo: Todo; onToggle: (id: string) => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.taskRow, pressed && styles.taskRowPressed]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onToggle(todo.id);
      }}
    >
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
      <View style={styles.checkbox}>
        <View style={styles.checkboxInner} />
      </View>
    </Pressable>
  );
}

export default function IncompleteScreen() {
  const goBack = useGoBack();
  const { incompleteDateMap, getIncompleteTodosForDate, toggleTodo } = useTodos();

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
            <ArrowLeft size={20} color="#000" strokeWidth={2.5} />
          </Pressable>
          <Text style={styles.headerTitle}>Incomplete Tasks</Text>
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

                return (
                  <View key={dateKey} style={styles.dateSection}>
                    <View style={styles.dateHeader}>
                      <View style={[styles.dateIndicator, { backgroundColor: color }]} />
                      <View style={styles.dateInfo}>
                        <Text style={styles.dateLabel}>
                          {format(dateObj, 'EEEE, MMMM d')}
                        </Text>
                        <Text style={styles.dateCount}>
                          {counts.incomplete} incomplete task{counts.incomplete !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.taskList}>
                      {tasks.map((todo) => (
                        <TaskRow key={todo.id} todo={todo} onToggle={toggleTodo} />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
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
    paddingTop: 16,
    paddingBottom: 100,
    paddingHorizontal: 16,
    gap: 16,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,149,0,0.08)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  summaryText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1C1C1E',
    letterSpacing: -0.2,
  },
  dateSection: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  dateIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dateInfo: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.3,
  },
  dateCount: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 1,
  },
  taskList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(60,60,67,0.1)',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  taskRowPressed: {
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  taskEmoji: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskEmojiText: {
    fontSize: 18,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
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
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxInner: {
    width: 0,
    height: 0,
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
    fontWeight: '600',
    color: '#1C1C1E',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#8E8E93',
  },
});
