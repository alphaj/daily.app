import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  ListTodo,
  GripVertical,
  Target,
  Pill,
  Check,
} from 'lucide-react-native';
import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  Animated,
  PanResponder,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTodos } from '@/contexts/TodoContext';
import { useHabits } from '@/contexts/HabitContext';
import { useNotes } from '@/contexts/NoteContext';
import { useInbox } from '@/contexts/InboxContext';
import type { Todo } from '@/types/todo';
import type { Habit } from '@/types/habit';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns';
import SwipeableRow from '@/components/SwipeableRow';
import { CelebrationOverlay } from '@/components/CelebrationOverlay';
import { AddOptionsModal } from '@/components/AddOptionsModal';
import { ReflectionModal } from '@/components/ReflectionModal';
import { BottomNavBar } from '@/components/BottomNavBar';
import { CaptureBar } from '@/components/CaptureBar';
import { DailySummaryModal, useDailySummary } from '@/components/DailySummaryModal';
import { CalendarHeader } from '@/components/CalendarHeader';
import { useWorkMode } from '@/contexts/WorkModeContext';
import { useSupplements } from '@/contexts/SupplementContext';
import { TrackableCard } from '@/components/TrackableCard';
import { EditSupplementModal } from '@/components/EditSupplementModal';
import { EnergyPickerModal } from '@/components/EnergyPickerModal';
import { SectionHeader } from '@/components/SectionHeader';
import type { Supplement } from '@/types/supplement';

import { BlurView } from 'expo-blur';
import { AmbientBackground } from '@/components/AmbientBackground';



const ITEM_HEIGHT = 68;

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function DraggableTodoItem({
  todo,
  toggleTodo,
  deleteTodo,
  index,
  draggedIndex,
  onDragStart,
  onDragEnd,
  onDragMove,
  isDragging,
}: {
  todo: Todo;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  index: number;
  draggedIndex: number | null;
  onDragStart: (index: number) => void;
  onDragEnd: () => void;
  onDragMove: (index: number, gestureY: number) => void;
  isDragging: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const elevationAnim = useRef(new Animated.Value(0)).current;

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onDragStart(index);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1.02,
          useNativeDriver: true,
        }),
        Animated.timing(elevationAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    },
    onPanResponderMove: (_, gestureState) => {
      translateY.setValue(gestureState.dy);
      onDragMove(index, gestureState.dy);
    },
    onPanResponderRelease: () => {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.timing(elevationAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onDragEnd();
    },
    onPanResponderTerminate: () => {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
        Animated.timing(elevationAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start();
      onDragEnd();
    },
  }), [index, onDragStart, onDragEnd, onDragMove, scaleAnim, translateY, elevationAnim]);

  const handlePress = useCallback(() => {
    if (!isDragging) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      toggleTodo(todo.id);
    }
  }, [todo.id, toggleTodo, isDragging]);

  const handleDelete = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    deleteTodo(todo.id);
  }, [todo.id, deleteTodo]);

  const isBeingDragged = draggedIndex === index;
  const shouldOffset = draggedIndex !== null && !isBeingDragged;

  return (
    <Animated.View
      style={[
        styles.todoItemWrapper,
        {
          transform: [
            { scale: isBeingDragged ? scaleAnim : 1 },
            { translateY: isBeingDragged ? translateY : 0 },
          ],
          zIndex: isBeingDragged ? 999 : 1,
          opacity: shouldOffset ? 0.7 : 1,
        },
      ]}
    >
      <SwipeableRow onDelete={handleDelete}>
        <Pressable onPress={handlePress} disabled={isDragging}>
          <Animated.View
            style={[
              styles.todoItem,
              todo.completed && styles.todoItemCompleted,
              isBeingDragged && styles.todoItemDragging,
            ]}
          >
            <View {...panResponder.panHandlers} style={styles.dragHandle}>
              <GripVertical size={18} color="#C7C7CC" />
            </View>
            <Pressable
              onPress={handlePress}
              style={[
                styles.checkboxContainer,
                todo.isWork && styles.checkboxWork,
                todo.completed ? styles.checkboxChecked : styles.checkboxUnchecked,
                todo.isWork && todo.completed && styles.checkboxWorkChecked,
              ]}
              disabled={isDragging}
            >
              {todo.completed && <Check size={14} color="#fff" strokeWidth={4} />}
            </Pressable>

            <Text style={[styles.todoText, todo.completed && styles.todoTextChecked]} numberOfLines={1}>
              {todo.title}
            </Text>

            {todo.energyLevel && (
              <View style={styles.todoEnergyIcon}>
                <Text style={styles.todoEnergyIconText}>
                  {todo.energyLevel === 'low' ? '🔋' : todo.energyLevel === 'medium' ? '⚡️' : '🔥'}
                </Text>
              </View>
            )}
          </Animated.View>
        </Pressable>
      </SwipeableRow>
    </Animated.View >
  );
}

function DraggableTaskList({
  todos,
  toggleTodo,
  deleteTodo,
  onReorder,
}: {
  todos: Todo[];
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  onReorder: (todos: Todo[]) => void;
}) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [localTodos, setLocalTodos] = useState(todos);
  const isDragging = draggedIndex !== null;

  useEffect(() => {
    // Sort: incomplete tasks first, then completed at bottom
    const sorted = [...todos].sort((a, b) => {
      if (a.completed === b.completed) return 0;
      return a.completed ? 1 : -1;
    });
    setLocalTodos(sorted);
  }, [todos]);

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragMove = useCallback((fromIndex: number, gestureY: number) => {
    const moveThreshold = ITEM_HEIGHT * 0.5;
    const indexDelta = Math.round(gestureY / ITEM_HEIGHT);
    const newIndex = Math.max(0, Math.min(localTodos.length - 1, fromIndex + indexDelta));

    if (newIndex !== fromIndex && Math.abs(gestureY) > moveThreshold) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      const newTodos = [...localTodos];
      const [movedItem] = newTodos.splice(fromIndex, 1);
      newTodos.splice(newIndex, 0, movedItem);
      setLocalTodos(newTodos);
      setDraggedIndex(newIndex);
      Haptics.selectionAsync();
    }
  }, [localTodos]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    onReorder(localTodos);
  }, [localTodos, onReorder]);

  return (
    <View style={styles.todoList}>
      {localTodos.map((todo, index) => (
        <DraggableTodoItem
          key={todo.id}
          todo={todo}
          toggleTodo={toggleTodo}
          deleteTodo={deleteTodo}
          index={index}
          draggedIndex={draggedIndex}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragMove={handleDragMove}
          isDragging={isDragging}
        />
      ))}
    </View>
  );
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

  // Get activity data for selected date
  const selectedTasks = getTaskCountForDate(selectedDate);
  const selectedHabits = getHabitCompletionForDate(selectedDate);
  const hasActivity = selectedTasks.total > 0 || selectedHabits.completed > 0;

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

                    // Get activity indicators for the date
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

                {/* Selected date summary - always show */}
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
                      <Text style={[styles.dateSummaryStat, { color: '#34C759' }]}>
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

export default function HomeScreen() {
  const router = useRouter();
  // ... existing code ... all hooks ...

  // Keep existing hooks up to the return
  const { getTodosForDate, getCompletedTodosForDate, toggleTodo, deleteTodo, todos: allTodos, reorderTodos } = useTodos();
  const {
    habits,
    toggleHabitCompletion,
    isCompletedToday,
    deleteHabit,
    getCelebrationPhrase,
  } = useHabits();
  const { hasNoteForDate, getNoteForDate, updateNoteForDate, isSaving: isNoteSaving } = useNotes();
  const { items: inboxItems } = useInbox();
  const { shouldShowItem } = useWorkMode();
  const { activeSupplements, toggleTaken, isComplete, deleteSupplement } = useSupplements();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [addOptionsVisible, setAddOptionsVisible] = useState(false);
  const [editSupplementModalVisible, setEditSupplementModalVisible] = useState(false);
  const [selectedSupplement, setSelectedSupplement] = useState<Supplement | null>(null);
  const [energyTriage, setEnergyTriage] = useState<'survival' | 'normal' | 'peak'>('normal');
  const [energyPickerVisible, setEnergyPickerVisible] = useState(false);


  // Reflection & Celebration state
  const [showCelebration, setShowCelebration] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  const [reflectionHabit, setReflectionHabit] = useState<Habit | null>(null);

  // Daily summary hook
  const { shouldShow: showDailySummary, markShown: dismissDailySummary } = useDailySummary();

  // Check if viewing a past date
  const isPastDate = !isSameDay(selectedDate, new Date()) && selectedDate < new Date();

  // Get tasks for the selected date
  // For past dates, show tasks completed on that day
  // For today and future, show tasks due on that day
  // Filter by current work mode
  const allTodosForDate = isPastDate
    ? getCompletedTodosForDate(selectedDate)
    : getTodosForDate(selectedDate);

  const filteredByEnergy = allTodosForDate.filter(t => {
    if (energyTriage === 'survival') return t.energyLevel === 'low';
    if (energyTriage === 'normal') return t.energyLevel === 'low' || t.energyLevel === 'medium' || !t.energyLevel;
    return true;
  });

  const todosForDate = filteredByEnergy.filter(todo => shouldShowItem(todo.isWork));

  const filteredHabits = habits.filter(h => {
    if (energyTriage === 'survival') return h.energyLevel === 'low';
    if (energyTriage === 'normal') return h.energyLevel === 'low' || h.energyLevel === 'medium' || !h.energyLevel;
    return true;
  });

  // Helper functions for calendar activity indicators
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

  // Handle habit toggle with reflection/celebration logic
  const handleHabitToggle = useCallback((habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const wasCompletedBefore = isCompletedToday(habit);

    // If unchecking a habit with a streak and a why statement, show reflection
    if (wasCompletedBefore && habit.currentStreak > 0 && habit.whyStatement) {
      setReflectionHabit(habit);
      setShowReflection(true);
      // Still toggle the habit
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

  // Completion counts for section headers
  const habitsCompleted = filteredHabits.filter(h => isCompletedToday(h)).length;
  const pillsTaken = activeSupplements.filter(s =>
    s.takenDates.includes(format(selectedDate, 'yyyy-MM-dd'))
  ).length;
  const tasksCompleted = todosForDate.filter(t => t.completed).length;

  // Show habits/pills sections only if they have content (or both empty = skip)
  const hasHabitsOrPills = habits.length > 0 || activeSupplements.length > 0;

  // Limit habits to 8 for grid, with "See all" link
  const displayHabits = filteredHabits.slice(0, 8);
  const hasMoreHabits = filteredHabits.length > 8;

  return (
    <View style={{ flex: 1 }}>
      <AmbientBackground />
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top']}>

        {/* Compact Header with energy capsule */}
        <CalendarHeader
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onOpenCalendar={() => setCalendarModalVisible(true)}
          onOpenInbox={() => router.push('/inbox')}
          inboxCount={inboxItems.length}
          energyLevel={energyTriage}
          onPressEnergy={() => setEnergyPickerVisible(true)}
        />

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 140 }}
          keyboardShouldPersistTaps="handled"
        >

          {/* Habits Section (grid) */}
          {habits.length > 0 && (
            <View style={styles.sectionContainer}>
              <SectionHeader
                icon={<Target size={20} color="#8E8E93" />}
                label="Habits"
                completed={habitsCompleted}
                total={filteredHabits.length}
                onAdd={() => router.push('/add-habit')}
              />

              {filteredHabits.length === 0 ? (
                <View style={styles.emptyStateCard}>
                  <Text style={styles.emptyText}>
                    {energyTriage === 'survival'
                      ? 'Focusing on recovery. Medium and high-energy habits hidden.'
                      : 'High-energy habits hidden.'}
                  </Text>
                </View>
              ) : (
                <>
                  <View style={styles.grid}>
                    {displayHabits.map(habit => (
                      <TrackableCard
                        key={habit.id}
                        id={habit.id}
                        emoji={habit.emoji || (habit.type === 'breaking' ? '🚫' : '⚡️')}
                        title={habit.name}
                        progressPercent={getWeeklyCompletionRate(habit.completedDates)}
                        isComplete={isCompletedToday(habit)}
                        variant={habit.type === 'breaking' ? 'breaking' : 'habit'}
                        weekDots={getWeekDotsForDates(habit.completedDates)}
                        onPress={() => handleHabitToggle(habit.id)}
                        onDelete={() => deleteHabit(habit.id)}
                        compact
                      />
                    ))}
                  </View>
                  {hasMoreHabits && (
                    <Pressable
                      onPress={() => router.push('/add-habit')}
                      style={styles.seeAllButton}
                    >
                      <Text style={styles.seeAllText}>See all {filteredHabits.length} habits</Text>
                    </Pressable>
                  )}
                </>
              )}
            </View>
          )}

          {/* Pills Section (grid) */}
          {activeSupplements.length > 0 && (
            <View style={styles.sectionContainer}>
              <SectionHeader
                icon={<Pill size={20} color="#8E8E93" />}
                label="Pills"
                completed={pillsTaken}
                total={activeSupplements.length}
                onAdd={() => router.push('/add-supplement')}
              />

              <View style={styles.grid}>
                {activeSupplements.map(supplement => {
                  const isTaken = supplement.takenDates.includes(format(selectedDate, 'yyyy-MM-dd'));
                  return (
                    <TrackableCard
                      key={supplement.id}
                      id={supplement.id}
                      emoji={supplement.emoji || '💊'}
                      title={supplement.name}
                      progressPercent={isTaken ? 100 : 0}
                      isComplete={isTaken}
                      variant="supplement"
                      onPress={() => toggleTaken(supplement.id)}
                      onDelete={() => deleteSupplement(supplement.id)}
                      onEdit={() => {
                        setSelectedSupplement(supplement);
                        setEditSupplementModalVisible(true);
                      }}
                      compact
                    />
                  );
                })}
              </View>
            </View>
          )}

          {/* Tasks Section */}
          <View style={styles.sectionContainer}>
            <SectionHeader
              icon={<ListTodo size={20} color="#8E8E93" />}
              label={isPastDate ? 'Completed' : 'Tasks'}
              completed={tasksCompleted}
              total={todosForDate.length}
              onAdd={!isPastDate ? () => router.push('/add-todo') : undefined}
            />

            {todosForDate.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyText}>
                  {isPastDate ? 'No tasks completed on this day' : 'No tasks for this day'}
                </Text>
                {!isPastDate && (
                  <Pressable onPress={() => router.push('/add-todo')} style={styles.emptyAddButton}>
                    <Text style={styles.emptyAddText}>Add a task</Text>
                  </Pressable>
                )}
              </View>
            ) : (
              <DraggableTaskList
                todos={todosForDate}
                toggleTodo={toggleTodo}
                deleteTodo={deleteTodo}
                onReorder={(reorderedDateTodos) => {
                  const otherTodos = allTodos.filter(t => !todosForDate.some(dt => dt.id === t.id));
                  const newAllTodos = [...otherTodos, ...reorderedDateTodos];
                  reorderTodos(newAllTodos);
                }}
              />
            )}
            {allTodosForDate.length > 0 && todosForDate.length === 0 && (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyText}>
                  {energyTriage === 'survival'
                    ? 'Medium and high-energy tasks hidden.'
                    : energyTriage === 'normal'
                      ? 'High-energy tasks hidden.'
                      : 'All tasks filtered by work mode.'}
                </Text>
              </View>
            )}
          </View>

        </ScrollView>

        {/* Unified Command Center (Capture Bar) */}
        <CaptureBar
          noteText={getNoteForDate(selectedDate)}
          onNoteChange={(text) => updateNoteForDate(selectedDate, text)}
          isSaving={isNoteSaving}
          selectedDate={selectedDate}
          isToday={isToday}
          visible={isCaptureOpen}
          onClose={() => setIsCaptureOpen(false)}
        />

        {/* Bottom Bar */}
        <BottomNavBar onFabPress={handleAddPress} />

        {/* Calendar Modal */}
        <CalendarModal
          visible={calendarModalVisible}
          onClose={() => setCalendarModalVisible(false)}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          hasNoteForDate={hasNoteForDate}
          getTaskCountForDate={getTaskCountForDate}
          getHabitCompletionForDate={getHabitCompletionForDate}
        />

        {/* Energy Picker Modal */}
        <EnergyPickerModal
          visible={energyPickerVisible}
          onClose={() => setEnergyPickerVisible(false)}
          selectedLevel={energyTriage}
          onSelect={setEnergyTriage}
        />

        {/* Add Options Modal */}
        <AddOptionsModal
          visible={addOptionsVisible}
          onClose={() => setAddOptionsVisible(false)}
          onAddTask={handleAddTask}
          onAddHabit={handleAddHabit}
        />

        {/* Celebration Overlay */}
        <CelebrationOverlay
          visible={showCelebration}
          onComplete={() => setShowCelebration(false)}
          celebrationPhrase={getCelebrationPhrase()}
        />
        {/* Reflection Modal */}
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

        {/* Daily Summary Modal */}
        <DailySummaryModal
          visible={showDailySummary}
          onDismiss={dismissDailySummary}
          habitsCompletedYesterday={habits.filter(h => isCompletedToday(h)).length}
          totalHabits={habits.length}
          tasksCompletedYesterday={todosForDate.filter(t => t.completed).length}
          pendingTasks={todosForDate.filter(t => !t.completed).length}
        />

        {/* Edit Supplement Modal */}
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
  content: {
    flex: 1,
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  seeAllButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  seeAllText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#007AFF',
  },
  todoEnergyIcon: {
    marginLeft: 8,
    backgroundColor: '#F2F2F7',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todoEnergyIconText: {
    fontSize: 12,
  },
  todoList: {
  },
  todoItemWrapper: {
    marginBottom: 10,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingRight: 16,
    paddingLeft: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    gap: 12,
    minHeight: ITEM_HEIGHT,
  },
  todoItemDragging: {
    shadowColor: '#5856D6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    backgroundColor: '#FAFAFF',
    transform: [{ scale: 1.02 }],
  },
  dragHandle: {
    padding: 6,
    marginLeft: -4,
    opacity: 0.3,
  },
  todoItemCompleted: {
    opacity: 0.6,
  },
  checkboxContainer: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2.5,
    borderColor: '#C7C7CC',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxUnchecked: {
    borderColor: '#C7C7CC',
  },
  checkboxChecked: {
    backgroundColor: '#5856D6',
    borderColor: '#5856D6',
  },
  checkboxWork: {
    borderRadius: 8,
    borderColor: '#C7C7CC',
  },
  checkboxWorkChecked: {
    backgroundColor: '#5856D6',
    borderColor: '#5856D6',
  },
  todoText: {
    flex: 1,
    fontSize: 17,
    color: '#000',
    fontWeight: '500',
    letterSpacing: -0.3,
  },
  todoTextChecked: {
    color: '#8E8E93',
    textDecorationLine: 'line-through',
  },
  emptyStateCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  emptyText: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '400',
  },
  emptyAddButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 20,
  },
  emptyAddText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
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
    backgroundColor: '#34C759',
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
