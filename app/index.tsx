import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTodos } from '@/contexts/TodoContext';
import { useHabits } from '@/contexts/HabitContext';
import { useNotes } from '@/contexts/NoteContext';
import { useInbox } from '@/contexts/InboxContext';
import type { Habit } from '@/types/habit';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns';
import { CelebrationOverlay } from '@/components/CelebrationOverlay';
import { AddOptionsModal } from '@/components/AddOptionsModal';
import { ReflectionModal } from '@/components/ReflectionModal';
import { BottomNavBar } from '@/components/BottomNavBar';
import { CaptureBar } from '@/components/CaptureBar';
import { DailySummaryModal, useDailySummary } from '@/components/DailySummaryModal';
import { CalendarHeader } from '@/components/CalendarHeader';
import { useWorkMode } from '@/contexts/WorkModeContext';
import { useSupplements } from '@/contexts/SupplementContext';
import { EditSupplementModal } from '@/components/EditSupplementModal';
import type { Supplement } from '@/types/supplement';

import { BlurView } from 'expo-blur';
import { AmbientBackground } from '@/components/AmbientBackground';

import { HomeV1 } from '@/components/home/HomeV1';
import type { HomeVariantProps } from '@/components/home/types';

// Helper to generate week dots for trackable items
function getWeekDotsForDates(completedDates: string[]): boolean[] {
  const today = new Date();
  const dots: boolean[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    dots.push(completedDates.includes(dateStr));
  }
  return dots;
}

// Calculate weekly completion rate from dates
function getWeeklyCompletionRate(completedDates: string[]): number {
  const weekDots = getWeekDotsForDates(completedDates);
  const completed = weekDots.filter(Boolean).length;
  return (completed / 7) * 100;
}

function CalendarModal({
  visible,
  onClose,
  selectedDate,
  onSelectDate,
  hasNoteForDate,
  getTaskCountForDate,
  getHabitCompletionForDate,
}: {
  visible: boolean;
  onClose: () => void;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  hasNoteForDate: (date: Date) => boolean;
  getTaskCountForDate: (date: Date) => { total: number; completed: number };
  getHabitCompletionForDate: (date: Date) => { total: number; completed: number };
}) {
  const [currentMonth, setCurrentMonth] = React.useState(selectedDate);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const monthSlideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setCurrentMonth(selectedDate);
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 20,
        stiffness: 90,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, selectedDate]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  const animateMonthChange = (direction: 'left' | 'right', callback: () => void) => {
    const toValue = direction === 'left' ? -1 : 1;
    Animated.sequence([
      Animated.timing(monthSlideAnim, {
        toValue: toValue * 0.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(monthSlideAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    callback();
  };

  const handlePrevMonth = () => {
    Haptics.selectionAsync();
    animateMonthChange('right', () => setCurrentMonth(subMonths(currentMonth, 1)));
  };

  const handleNextMonth = () => {
    Haptics.selectionAsync();
    animateMonthChange('left', () => setCurrentMonth(addMonths(currentMonth, 1)));
  };

  const handleSelectDate = (date: Date) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectDate(date);
    onClose();
  };

  const handleGoToToday = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const today = new Date();
    setCurrentMonth(today);
    onSelectDate(today);
    onClose();
  };

  const calendarDays: (Date | null)[] = [
    ...Array(startDayOfWeek).fill(null),
    ...daysInMonth,
  ];

  const weekDayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const selectedTasks = getTaskCountForDate(selectedDate);
  const selectedHabits = getHabitCompletionForDate(selectedDate);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={StyleSheet.absoluteFill}>
        <BlurView
          intensity={20}
          tint="dark"
          style={StyleSheet.absoluteFill}
        >
          <Pressable style={styles.modalOverlay} onPress={onClose}>
            <Animated.View
              style={[
                styles.calendarModal,
                {
                  transform: [
                    {
                      scale: slideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.95, 1]
                      })
                    },
                    {
                      translateY: slideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0]
                      })
                    }
                  ],
                  opacity: slideAnim
                }
              ]}
            >
              <Pressable onPress={(e) => e.stopPropagation()}>
                <View style={styles.calendarHeader}>
                  <Pressable onPress={handlePrevMonth} hitSlop={15} style={styles.calendarNavButton}>
                    <ChevronLeft size={20} color="#000" />
                  </Pressable>
                  <Animated.Text
                    style={[
                      styles.calendarMonthText,
                      {
                        transform: [{
                          translateX: monthSlideAnim.interpolate({
                            inputRange: [-1, 0, 1],
                            outputRange: [-20, 0, 20]
                          })
                        }]
                      }
                    ]}
                  >
                    {format(currentMonth, 'MMMM yyyy')}
                  </Animated.Text>
                  <Pressable onPress={handleNextMonth} hitSlop={15} style={styles.calendarNavButton}>
                    <ChevronRight size={20} color="#000" />
                  </Pressable>
                </View>

                <View style={styles.weekDayRow}>
                  {weekDayHeaders.map((day, i) => (
                    <View key={i} style={styles.weekDayCell}>
                      <Text style={styles.weekDayText}>{day}</Text>
                    </View>
                  ))}
                </View>

                <Animated.View
                  style={[
                    styles.calendarGrid,
                    {
                      transform: [{
                        translateX: monthSlideAnim.interpolate({
                          inputRange: [-1, 0, 1],
                          outputRange: [-10, 0, 10]
                        })
                      }],
                      opacity: monthSlideAnim.interpolate({
                        inputRange: [-0.3, 0, 0.3],
                        outputRange: [0.7, 1, 0.7]
                      })
                    }
                  ]}
                >
                  {calendarDays.map((date, index) => {
                    if (!date) {
                      return <View key={`empty-${index}`} style={styles.calendarDayCell} />;
                    }

                    const isSelected = isSameDay(date, selectedDate);
                    const isToday = isSameDay(date, new Date());
                    const hasNote = hasNoteForDate(date);
                    const isFuture = date > new Date();

                    const tasks = getTaskCountForDate(date);
                    const habits = getHabitCompletionForDate(date);
                    const hasTaskActivity = tasks.completed > 0;
                    const hasHabitActivity = habits.completed > 0;
                    const showActivityDots = (hasTaskActivity || hasHabitActivity || hasNote) && !isSelected;

                    return (
                      <Pressable
                        key={date.toISOString()}
                        style={[
                          styles.calendarDayCell,
                          isSelected && styles.calendarDaySelected,
                          isToday && !isSelected && styles.calendarDayToday,
                        ]}
                        onPress={() => handleSelectDate(date)}
                      >
                        <Text
                          style={[
                            styles.calendarDayText,
                            isSelected && styles.calendarDayTextSelected,
                            isToday && !isSelected && styles.calendarDayTextToday,
                            isFuture && !isSelected && styles.calendarDayTextFuture,
                          ]}
                        >
                          {format(date, 'd')}
                        </Text>
                        {showActivityDots && (
                          <View style={styles.activityDotsContainer}>
                            {hasTaskActivity && <View style={[styles.activityDot, styles.activityDotTask]} />}
                            {hasHabitActivity && <View style={[styles.activityDot, styles.activityDotHabit]} />}
                            {hasNote && !hasTaskActivity && !hasHabitActivity && (
                              <View style={[styles.activityDot, styles.activityDotNote]} />
                            )}
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </Animated.View>

                <View style={styles.dateSummary}>
                  <Text style={styles.dateSummaryDate}>{format(selectedDate, 'EEEE, MMMM d')}</Text>
                  <View style={styles.dateSummaryStats}>
                    {selectedTasks.total > 0 ? (
                      <Text style={styles.dateSummaryStat}>
                        {selectedTasks.completed}/{selectedTasks.total} tasks
                      </Text>
                    ) : (
                      <Text style={styles.dateSummaryStat}>No tasks</Text>
                    )}
                    {selectedHabits.completed > 0 && (
                      <Text style={[styles.dateSummaryStat, { color: '#5AC8FA' }]}>
                        {selectedHabits.completed} ✓
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.calendarFooter}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.todayButton,
                      pressed && { opacity: 0.6 }
                    ]}
                    onPress={handleGoToToday}
                  >
                    <Text style={styles.todayButtonText}>Today</Text>
                  </Pressable>
                </View>
              </Pressable>
            </Animated.View>
          </Pressable>
        </BlurView>
      </View>
    </Modal>
  );
}

export default function HomeScreen() {
  const router = useRouter();

  const { getTodosForDate, getCompletedTodosForDate, toggleTodo, deleteTodo, todos: allTodos, reorderTodos } = useTodos();
  const {
    habits,
    toggleHabitCompletion,
    isCompletedToday,
    deleteHabit,
    getCelebrationPhrase,
  } = useHabits();
  const { hasNoteForDate } = useNotes();
  const { items: inboxItems } = useInbox();
  const { shouldShowItem } = useWorkMode();
  const { activeSupplements, toggleTaken, isComplete, deleteSupplement } = useSupplements();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [addOptionsVisible, setAddOptionsVisible] = useState(false);
  const [editSupplementModalVisible, setEditSupplementModalVisible] = useState(false);
  const [selectedSupplement, setSelectedSupplement] = useState<Supplement | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  const [reflectionHabit, setReflectionHabit] = useState<Habit | null>(null);

  const { shouldShow: showDailySummary, markShown: dismissDailySummary } = useDailySummary();

  const isPastDate = !isSameDay(selectedDate, new Date()) && selectedDate < new Date();

  const allTodosForDate = isPastDate
    ? getCompletedTodosForDate(selectedDate)
    : getTodosForDate(selectedDate);

  const todosForDate = allTodosForDate.filter(todo => shouldShowItem(todo.isWork));

  const filteredHabits = habits;

  const getTaskCountForDate = useCallback((date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const tasksForDate = allTodos.filter(t => {
      const taskDate = t.dueDate ? format(new Date(t.dueDate), 'yyyy-MM-dd') : null;
      const completedDate = t.completedAt ? format(new Date(t.completedAt), 'yyyy-MM-dd') : null;
      return taskDate === dateStr || completedDate === dateStr;
    });
    const completedTasks = tasksForDate.filter(t => t.completed);
    return { total: tasksForDate.length, completed: completedTasks.length };
  }, [allTodos]);

  const getHabitCompletionForDate = useCallback((date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const completedHabits = habits.filter(h => h.completedDates.includes(dateStr));
    return { total: habits.length, completed: completedHabits.length };
  }, [habits]);

  const [isCaptureOpen, setIsCaptureOpen] = useState(false);
  const { capture } = useLocalSearchParams<{ capture?: string }>();

  useEffect(() => {
    if (capture === '1') {
      setIsCaptureOpen(true);
      router.setParams({ capture: '' });
    }
  }, [capture]);

  const handleAddPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsCaptureOpen(true);
  };

  const handleAddTask = () => {
    setAddOptionsVisible(false);
    router.push('/add-todo');
  };

  const handleAddHabit = () => {
    setAddOptionsVisible(false);
    router.push('/add-habit');
  };

  const handleHabitToggle = useCallback((habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const wasCompletedBefore = isCompletedToday(habit);

    if (wasCompletedBefore && habit.currentStreak > 0 && habit.whyStatement) {
      setReflectionHabit(habit);
      setShowReflection(true);
    }

    toggleHabitCompletion(habitId).then((nowCompleted) => {
      if (nowCompleted) {
        setTimeout(() => {
          const allCompleted = habits.every(h =>
            h.id === habitId ? true : isCompletedToday(h)
          );
          if (allCompleted && habits.length > 0) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setShowCelebration(true);
          }
        }, 100);
      }
    });
  }, [habits, isCompletedToday, toggleHabitCompletion]);

  const isToday = isSameDay(selectedDate, new Date());

  const habitsCompleted = filteredHabits.filter(h => isCompletedToday(h)).length;
  const pillsTaken = activeSupplements.filter(s =>
    s.takenDates.includes(format(selectedDate, 'yyyy-MM-dd'))
  ).length;
  const tasksCompleted = todosForDate.filter(t => t.completed).length;

  const displayHabits = filteredHabits.slice(0, 8);
  const hasMoreHabits = filteredHabits.length > 8;

  // Build variant props
  const variantProps: HomeVariantProps = {
    selectedDate,
    isToday,
    isPastDate,
    habits: filteredHabits,
    displayHabits,
    hasMoreHabits,
    habitsCompleted,
    isCompletedToday,
    onHabitToggle: handleHabitToggle,
    onDeleteHabit: deleteHabit,
    onAddHabit: () => router.push('/add-habit'),
    getWeekDots: getWeekDotsForDates,
    getCompletionRate: getWeeklyCompletionRate,
    activeSupplements,
    pillsTaken,
    onToggleTaken: toggleTaken,
    onDeleteSupplement: deleteSupplement,
    onEditSupplement: (supplement) => {
      setSelectedSupplement(supplement);
      setEditSupplementModalVisible(true);
    },
    onAddSupplement: () => router.push('/add-supplement'),
    todosForDate,
    allTodos,
    tasksCompleted,
    onToggleTodo: toggleTodo,
    onDeleteTodo: deleteTodo,
    onReorderTodos: (reorderedDateTodos) => {
      const otherTodos = allTodos.filter(t => !todosForDate.some(dt => dt.id === t.id));
      const newAllTodos = [...otherTodos, ...reorderedDateTodos];
      reorderTodos(newAllTodos);
    },
    onAddTodo: () => router.push('/add-todo'),
  };

  return (
    <View style={{ flex: 1 }}>
      <AmbientBackground />
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top']}>

        <CalendarHeader
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onOpenCalendar={() => setCalendarModalVisible(true)}
          onOpenInbox={() => router.push('/inbox')}
          onOpenSettings={() => router.push('/menu')}
          inboxCount={inboxItems.length}
        />

        <HomeV1 {...variantProps} />

        <CaptureBar
          visible={isCaptureOpen}
          onClose={() => setIsCaptureOpen(false)}
        />

        <BottomNavBar onFabPress={handleAddPress} />

        <CalendarModal
          visible={calendarModalVisible}
          onClose={() => setCalendarModalVisible(false)}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          hasNoteForDate={hasNoteForDate}
          getTaskCountForDate={getTaskCountForDate}
          getHabitCompletionForDate={getHabitCompletionForDate}
        />

        <AddOptionsModal
          visible={addOptionsVisible}
          onClose={() => setAddOptionsVisible(false)}
          onAddTask={handleAddTask}
          onAddHabit={handleAddHabit}
        />

        <CelebrationOverlay
          visible={showCelebration}
          onComplete={() => setShowCelebration(false)}
          celebrationPhrase={getCelebrationPhrase()}
        />

        <ReflectionModal
          visible={showReflection}
          habit={reflectionHabit}
          onDismiss={() => {
            setShowReflection(false);
            setReflectionHabit(null);
          }}
          onKeepGoing={() => {
            if (reflectionHabit) {
              toggleHabitCompletion(reflectionHabit.id);
            }
            setShowReflection(false);
            setReflectionHabit(null);
          }}
        />

        <DailySummaryModal
          visible={showDailySummary}
          onDismiss={dismissDailySummary}
          habitsCompletedYesterday={habits.filter(h => isCompletedToday(h)).length}
          totalHabits={habits.length}
          tasksCompletedYesterday={todosForDate.filter(t => t.completed).length}
          pendingTasks={todosForDate.filter(t => !t.completed).length}
        />

        <EditSupplementModal
          visible={editSupplementModalVisible}
          supplement={selectedSupplement}
          onClose={() => {
            setEditSupplementModalVisible(false);
            setSelectedSupplement(null);
          }}
        />

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  // Calendar Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  calendarModal: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    width: '100%',
    maxWidth: 320,
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  calendarMonthText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    letterSpacing: -0.4,
  },
  calendarNavButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDayRow: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 20,
  },
  weekDayText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3C3C4399',
    textTransform: 'uppercase',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  calendarDayCell: {
    width: '14.28%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  calendarDaySelected: {
    backgroundColor: '#000',
    borderRadius: 20,
    width: 36,
    height: 36,
  },
  calendarDayToday: {
    borderRadius: 18,
    width: 36,
    height: 36,
  },
  calendarDayText: {
    fontSize: 17,
    fontWeight: '400',
    color: '#000',
    includeFontPadding: false,
  },
  calendarDayTextSelected: {
    color: '#fff',
    fontWeight: '500',
  },
  calendarDayTextToday: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  calendarDayTextFuture: {
    color: '#3C3C4399',
  },
  activityDotsContainer: {
    position: 'absolute',
    bottom: 2,
    flexDirection: 'row',
    gap: 3,
  },
  activityDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  activityDotTask: {
    backgroundColor: '#007AFF',
  },
  activityDotHabit: {
    backgroundColor: '#5AC8FA',
  },
  activityDotNote: {
    backgroundColor: '#AF52DE',
  },
  dateSummary: {
    marginHorizontal: 4,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#3C3C4333',
  },
  dateSummaryDate: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  dateSummaryStats: {
    flexDirection: 'row',
    gap: 16,
  },
  dateSummaryStat: {
    fontSize: 13,
    fontWeight: '400',
    color: '#3C3C4399',
  },
  calendarFooter: {
    marginHorizontal: 4,
  },
  todayButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  todayButtonText: {
    fontSize: 17,
    fontWeight: '400',
    color: '#007AFF',
  },
});
