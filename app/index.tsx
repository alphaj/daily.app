import { useRouter } from 'expo-router';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Settings,
  Plus,
  Check,
  Flame,
  ListTodo,
  GripVertical,
  Target,
  Briefcase,
} from 'lucide-react-native';
import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  Modal,
  TextInput,
  Animated,
  Alert,
  Image,
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
import { format, addDays, subDays, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns';
import SwipeableRow from '@/components/SwipeableRow';
import { CelebrationOverlay } from '@/components/CelebrationOverlay';
import { AddOptionsModal } from '@/components/AddOptionsModal';
import { ReflectionModal } from '@/components/ReflectionModal';
import { BottomNavBar } from '@/components/BottomNavBar';
import { DailySummaryModal, useDailySummary } from '@/components/DailySummaryModal';
import { WorkModeIndicator } from '@/components/WorkModeIndicator';
import { useWorkMode } from '@/contexts/WorkModeContext';

import { BlurView } from 'expo-blur';
import { AmbientBackground } from '@/components/AmbientBackground';



const { width: SCREEN_WIDTH } = Dimensions.get('window');
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
}: {
  visible: boolean;
  onClose: () => void;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  hasNoteForDate: (date: Date) => boolean;
}) {
  const [currentMonth, setCurrentMonth] = React.useState(selectedDate);
  const slideAnim = useRef(new Animated.Value(0)).current;

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

  const handlePrevMonth = () => {
    Haptics.selectionAsync();
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    Haptics.selectionAsync();
    setCurrentMonth(addMonths(currentMonth, 1));
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
                  <Text style={styles.calendarMonthText}>
                    {format(currentMonth, 'MMMM yyyy')}
                  </Text>
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

                <View style={styles.calendarGrid}>
                  {calendarDays.map((date, index) => {
                    if (!date) {
                      return <View key={`empty-${index}`} style={styles.calendarDayCell} />;
                    }

                    const isSelected = isSameDay(date, selectedDate);
                    const isToday = isSameDay(date, new Date());
                    const hasNote = hasNoteForDate(date);

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
                          ]}
                        >
                          {format(date, 'd')}
                        </Text>
                        {hasNote && !isSelected && (
                          <View style={styles.calendarNoteDot} />
                        )}
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.calendarFooter}>
                  <Pressable style={styles.todayButton} onPress={handleGoToToday}>
                    <Text style={styles.todayButtonText}>Go to Today</Text>
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

function HabitCard({
  habit,
  isCompleted,
  onToggle,
  onDelete
}: {
  habit: Habit;
  isCompleted: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onToggle(habit.id);
  };

  const handleLongPress = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Delete Habit",
      `Are you sure you want to delete "${habit.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete(habit.id)
        }
      ]
    );
  };

  return (
    <Pressable onPress={handlePress} onLongPress={handleLongPress} delayLongPress={500}>
      <Animated.View
        style={[
          styles.habitCard,
          habit.type === 'breaking'
            ? (isCompleted ? styles.habitCardCompletedBreaking : styles.habitCardIncompleteBreaking)
            : (isCompleted ? styles.habitCardCompleted : styles.habitCardIncomplete),
          { transform: [{ scale: scaleAnim }] }
        ]}
      >
        <View style={styles.habitCardHeader}>
          <Text style={styles.habitEmoji}>{habit.emoji || (habit.type === 'breaking' ? '🚫' : '⚡️')}</Text>
          {habit.currentStreak > 0 && (
            <View style={[styles.habitCardStreak, isCompleted && styles.habitCardStreakCompleted]}>
              <Flame size={10} color={isCompleted ? "#FFD60A" : "#FF9500"} fill={isCompleted ? "#FFD60A" : "#FF9500"} />
              <Text style={[styles.habitCardStreakText, isCompleted && styles.habitCardStreakTextCompleted]}>
                {habit.currentStreak}
              </Text>
            </View>
          )}
        </View>

        <Text
          style={[styles.habitCardName, isCompleted && styles.habitCardNameCompleted]}
          numberOfLines={2}
        >
          {habit.name}
        </Text>

        <View style={[
          styles.habitStatusIcon,
          isCompleted && (habit.type === 'breaking' ? styles.habitStatusIconCompletedBreaking : styles.habitStatusIconCompleted)
        ]}>
          {isCompleted ? <Check size={14} color="#000" strokeWidth={4} /> : null}
        </View>
      </Animated.View>
    </Pressable>
  );
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
  const { hasNoteForDate } = useNotes();
  const { items: inboxItems } = useInbox();
  const { shouldShowItem } = useWorkMode();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [addOptionsVisible, setAddOptionsVisible] = useState(false);


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
  const todosForDate = allTodosForDate.filter(todo => shouldShowItem(todo.isWork));



  // Calendar Strip Data - generate 60 days (30 before and 30 after today for continuous scrolling)
  const today = new Date();
  const calendarDays = Array.from({ length: 61 }).map((_, i) => subDays(today, 30 - i));
  const selectedDayIndex = calendarDays.findIndex(d => isSameDay(d, selectedDate));
  const calendarScrollRef = useRef<ScrollView>(null);

  const handleAddPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAddOptionsVisible(true);
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

  const handleCalendarPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCalendarModalVisible(true);
  };

  const formattedSelectedDate = format(selectedDate, 'MMM d, yyyy');
  const dayName = format(selectedDate, 'EEEE');
  const isToday = isSameDay(selectedDate, new Date());

  return (
    <View style={{ flex: 1 }}>
      <AmbientBackground />
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top']}>

        {/* Header */}
        <View style={styles.header}>
          {/* Work Mode Indicator - leftmost */}
          {/* Work Mode Indicator - leftmost */}
          <WorkModeIndicator />

          <View style={styles.headerCenter} pointerEvents="box-none">
            <View style={styles.dateNav}>
              <Pressable
                hitSlop={20}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedDate(addDays(selectedDate, -1));
                }}
                style={styles.navArrow}
              >
                <ChevronLeft size={24} color="#000" strokeWidth={2.5} />
              </Pressable>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedDate(new Date());
                }}
              >
                <Text style={styles.headerDateText}>{isToday ? 'Today' : format(selectedDate, 'MMM d')}</Text>
              </Pressable>
              <Pressable
                hitSlop={20}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedDate(addDays(selectedDate, 1));
                }}
                style={styles.navArrow}
              >
                <ChevronRight size={24} color="#000" strokeWidth={2.5} />
              </Pressable>
            </View>
          </View>

          <View style={styles.headerRight}>
            <Pressable style={styles.iconButton} onPress={handleCalendarPress}>
              <Calendar size={24} color="#000" strokeWidth={1.5} />
            </Pressable>

            <Pressable style={styles.iconButton} onPress={() => router.push('/inbox')}>
              <Inbox size={22} color="#000" strokeWidth={1.5} />
              {inboxItems.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{inboxItems.length}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        {/* Calendar Strip - Scrollable */}
        <ScrollView
          ref={calendarScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.calendarStripScroll}
          contentContainerStyle={styles.calendarStripContent}
          onLayout={() => {
            // Auto-scroll to selected date on mount
            const dayWidth = 62; // width 54 + gap 8
            const scrollToIndex = selectedDayIndex >= 0 ? selectedDayIndex : 30; // default to today (index 30)
            const scrollX = scrollToIndex * dayWidth - (SCREEN_WIDTH / 2) + (dayWidth / 2);
            calendarScrollRef.current?.scrollTo({ x: Math.max(0, scrollX), animated: false });
          }}
        >
          {calendarDays.map((date: Date, index: number) => {
            const isSelected = isSameDay(date, selectedDate);
            const isTodayDate = isSameDay(date, today);
            const hasNote = hasNoteForDate(date);

            return (
              <Pressable
                key={index}
                style={[
                  styles.dayItem,
                  isSelected && styles.dayItemSelected,
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedDate(date);
                }}
              >
                <Text
                  style={[
                    styles.dayName,
                    isSelected && styles.dayNameSelected,
                    !isSelected && isTodayDate && styles.dayNameToday
                  ]}
                >
                  {format(date, 'EEE')}
                </Text>
                <Text
                  style={[
                    styles.dayNumber,
                    isSelected && styles.dayNumberSelected,
                    !isSelected && isTodayDate && styles.dayNumberToday
                  ]}
                >
                  {format(date, 'd')}
                </Text>
                {hasNote && !isSelected && (
                  <View style={styles.noteDot} />
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Date Heading */}
          <View style={styles.pageHeader}>
            <Text style={styles.subDate}>
              {dayName.toUpperCase()} {isToday && <Text style={{ color: '#5856D6' }}>• TODAY</Text>}
            </Text>
            <Text style={styles.mainDate}>{formattedSelectedDate}</Text>
          </View>

          {/* Tasks Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <ListTodo size={20} color="#8E8E93" />
                <Text style={styles.sectionLabel}>{isPastDate ? 'Completed' : 'Tasks'}</Text>
              </View>
              {!isPastDate && (
                <Pressable onPress={() => router.push('/add-todo')} style={styles.addButton}>
                  <Plus size={18} color="#007AFF" strokeWidth={2} />
                  <Text style={styles.addLink}>Add</Text>
                </Pressable>
              )}
            </View>

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
          </View>

          {/* Habits Section */}
          <View style={styles.habitsSection}>
            <View style={styles.sectionHeaderPadding}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Target size={20} color="#8E8E93" />
                  <Text style={styles.sectionLabel}>Habits</Text>
                </View>
                <Pressable onPress={() => router.push('/add-habit')} style={styles.addButton}>
                  <Plus size={18} color="#007AFF" strokeWidth={2} />
                  <Text style={styles.addLink}>Add</Text>
                </Pressable>
              </View>
            </View>

            {habits.length === 0 ? (
              <View style={styles.emptyHabitsContainer}>
                <View style={styles.emptyStateCard}>
                  <Text style={styles.emptyText}>No habits tracked yet</Text>
                  <Pressable onPress={() => router.push('/add-habit')} style={styles.emptyAddButton}>
                    <Text style={styles.emptyAddText}>Start a habit</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.habitsScrollContent}
                decelerationRate="fast"
                snapToInterval={142}
                snapToAlignment="start"
              >
                {habits.map(habit => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    isCompleted={isCompletedToday(habit)}
                    onToggle={handleHabitToggle}
                    onDelete={deleteHabit}
                  />
                ))}
              </ScrollView>
            )}
          </View>


        </ScrollView>



        {/* Bottom Bar */}
        <BottomNavBar onFabPress={handleAddPress} />

        {/* Calendar Modal */}
        <CalendarModal
          visible={calendarModalVisible}
          onClose={() => setCalendarModalVisible(false)}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          hasNoteForDate={hasNoteForDate}
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

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
    position: 'relative',
    height: 60,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  headerCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    gap: 2,
  },
  logoText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8E8E93',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navArrow: {
    opacity: 0.4,
    padding: 4,
  },
  headerDateText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
  },
  calendarStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  calendarStripScroll: {
    maxHeight: 100,
  },
  calendarStripContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  dayItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    width: 54,
    borderRadius: 24,
    gap: 2,
  },
  dayItemSelected: {
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    transform: [{ scale: 1.05 }], // Slight scale up for pop
  },
  dayItemToday: {
    // Removed border style
  },
  dayName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
  },
  dayNameSelected: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '700',
  },
  dayNameToday: {
    color: '#007AFF',
    fontWeight: '700',
  },
  dayNumber: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  dayNumberSelected: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '700',
  },
  dayNumberToday: {
    color: '#007AFF',
  },
  content: {
    flex: 1,
  },
  pageHeader: {
    paddingHorizontal: 24,
    marginTop: 8,
    marginBottom: 24,
  },
  subDate: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8E8E93',
    marginBottom: 4,
    letterSpacing: 0.8,
  },
  mainDate: {
    fontSize: 34,
    fontWeight: '800',
    color: '#000',
    letterSpacing: -1,
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  noteDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#5856D6',
    marginTop: 2,
  },
  calendarNoteDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#5856D6',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 0,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionLabel: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    letterSpacing: -0.4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 0,
    paddingVertical: 4,
  },
  addLink: {
    fontSize: 17,
    fontWeight: '400',
    color: '#007AFF',
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
    paddingVertical: 14,
    paddingRight: 16,
    paddingLeft: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    gap: 10,
    minHeight: ITEM_HEIGHT,
  },
  todoItemDragging: {
    shadowColor: '#5856D6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
    backgroundColor: '#FAFAFF',
  },
  dragHandle: {
    padding: 6,
    marginLeft: -4,
    opacity: 0.5,
  },
  todoItemCompleted: {
    opacity: 0.55,
  },
  checkboxContainer: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2.5,
    borderColor: '#D1D1D6',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxUnchecked: {
    borderColor: '#007AFF',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkboxWork: {
    borderRadius: 13,
    borderColor: '#D1D1D6',
  },
  checkboxWorkChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  todoText: {
    flex: 1,
    fontSize: 17,
    color: '#000',
    fontWeight: '400',
    letterSpacing: -0.2,
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
  habitsSection: {
    marginBottom: 24,
  },
  sectionHeaderPadding: {
    paddingHorizontal: 20,
  },
  habitsScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 4,
  },
  emptyHabitsContainer: {
    paddingHorizontal: 20,
  },
  // Habit Card Styles
  habitCard: {
    width: 130,
    height: 130,
    borderRadius: 24,
    padding: 16,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  habitCardIncomplete: {
    backgroundColor: '#fff',
  },
  habitCardCompleted: {
    backgroundColor: '#000',
  },
  habitCardIncompleteBreaking: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  habitCardCompletedBreaking: {
    backgroundColor: '#FF6B6B',
  },
  habitCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  habitEmoji: {
    fontSize: 28,
  },
  habitCardStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
  },
  habitCardStreakCompleted: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  habitCardStreakText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF9500',
  },
  habitCardStreakTextCompleted: {
    color: '#FFD60A',
  },
  habitCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginTop: 4,
    paddingRight: 32,
  },
  habitCardNameCompleted: {
    color: '#fff',
  },
  habitStatusIcon: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitStatusIconCompleted: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  habitStatusIconCompletedBreaking: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingTop: 16,
    backgroundColor: '#fff',
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
  },
  bottomTab: {
    padding: 8,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
  },
  // Calendar Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarModal: {
    backgroundColor: '#fff',
    borderRadius: 28,
    width: '100%',
    maxWidth: 340,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  calendarMonthText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  calendarNavButton: {
    padding: 8,
    borderRadius: 50,
    backgroundColor: 'rgba(242, 242, 247, 0.5)',
  },
  weekDayRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDayText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  calendarDayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  calendarDaySelected: {
    backgroundColor: '#000',
    borderRadius: 20,
  },
  calendarDayToday: {
    backgroundColor: 'rgba(242, 242, 247, 0.5)',
    borderRadius: 20,
  },
  calendarDayText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#000',
  },
  calendarDayTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  calendarDayTextToday: {
    color: '#007AFF',
    fontWeight: '600',
  },
  calendarFooter: {
    paddingTop: 8,
  },
  todayButton: {
    backgroundColor: 'rgba(242, 242, 247, 0.5)',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  todayButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
