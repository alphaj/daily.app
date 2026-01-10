import { useRouter } from 'expo-router';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Settings,
  Plus,
  Clock,
  Check,
  Flame,
  Home,
  Brain,
  FolderKanban,
  PenLine,
  ListTodo,
} from 'lucide-react-native';
import React, { useCallback, useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTodos } from '@/contexts/TodoContext';
import { useHabits } from '@/contexts/HabitContext';
import { useNotes } from '@/contexts/NoteContext';
import type { Todo } from '@/types/todo';
import type { Habit } from '@/types/habit';
import { format, addDays, subDays, startOfWeek, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns';
import SwipeableRow from '@/components/SwipeableRow';
import { CelebrationOverlay } from '@/components/CelebrationOverlay';
import { AddOptionsModal } from '@/components/AddOptionsModal';
import { ReflectionModal } from '@/components/ReflectionModal';
import { BottomNavBar } from '@/components/BottomNavBar';
import { DailySummaryModal, useDailySummary } from '@/components/DailySummaryModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function TodoItem({
  todo,
  toggleTodo,
  deleteTodo
}: {
  todo: Todo;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleTodo(todo.id);
  }, [todo.id, toggleTodo]);

  const handleDelete = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    deleteTodo(todo.id);
  }, [todo.id, deleteTodo]);

  return (
    <View style={styles.todoItemWrapper}>
      <SwipeableRow onDelete={handleDelete}>
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Animated.View style={[
            styles.todoItem,
            todo.completed && styles.todoItemCompleted,
            { transform: [{ scale: scaleAnim }] }
          ]}>
            <View style={[styles.checkboxContainer, todo.completed ? styles.checkboxChecked : styles.checkboxUnchecked]}>
              {todo.completed && <Check size={14} color="#fff" strokeWidth={4} />}
            </View>
            <Text style={[styles.todoText, todo.completed && styles.todoTextChecked]}>
              {todo.title}
            </Text>
          </Animated.View>
        </Pressable>
      </SwipeableRow>
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

  const weekDayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.calendarModal} onPress={(e) => e.stopPropagation()}>
          <View style={styles.calendarHeader}>
            <Pressable onPress={handlePrevMonth} hitSlop={10} style={styles.calendarNavButton}>
              <ChevronLeft size={24} color="#000" />
            </Pressable>
            <Text style={styles.calendarMonthText}>
              {format(currentMonth, 'MMMM yyyy')}
            </Text>
            <Pressable onPress={handleNextMonth} hitSlop={10} style={styles.calendarNavButton}>
              <ChevronRight size={24} color="#000" />
            </Pressable>
          </View>

          <View style={styles.weekDayRow}>
            {weekDayHeaders.map((day) => (
              <View key={day} style={styles.weekDayCell}>
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

          <Pressable style={styles.todayButton} onPress={handleGoToToday}>
            <Text style={styles.todayButtonText}>Go to Today</Text>
          </Pressable>
        </Pressable>
      </Pressable>
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
          isCompleted ? styles.habitCardCompleted : styles.habitCardIncomplete,
          { transform: [{ scale: scaleAnim }] }
        ]}
      >
        <View style={styles.habitCardHeader}>
          <Text style={styles.habitEmoji}>{habit.emoji || '⚡️'}</Text>
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

        <View style={[styles.habitStatusIcon, isCompleted && styles.habitStatusIconCompleted]}>
          {isCompleted ? <Check size={14} color="#000" strokeWidth={4} /> : null}
        </View>
      </Animated.View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getTodosForDate, toggleTodo, deleteTodo } = useTodos();
  const {
    habits,
    toggleHabitCompletion,
    isCompletedToday,
    deleteHabit,
    getCelebrationPhrase,
  } = useHabits();
  const { getNoteForDate, updateNoteForDate, hasNoteForDate, isSaving } = useNotes();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [addOptionsVisible, setAddOptionsVisible] = useState(false);
  const [noteText, setNoteText] = useState('');

  // Reflection & Celebration state
  const [showCelebration, setShowCelebration] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  const [reflectionHabit, setReflectionHabit] = useState<Habit | null>(null);

  // Daily summary hook
  const { shouldShow: showDailySummary, markShown: dismissDailySummary } = useDailySummary();

  // Get tasks for the selected date
  const todosForDate = getTodosForDate(selectedDate);

  // Load note for selected date
  useEffect(() => {
    const note = getNoteForDate(selectedDate);
    setNoteText(note);
  }, [selectedDate, getNoteForDate]);

  // Save note when text changes
  const handleNoteChange = useCallback((text: string) => {
    setNoteText(text);
    updateNoteForDate(selectedDate, text);
  }, [selectedDate, updateNoteForDate]);

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

    // Toggle the habit
    const nowCompleted = toggleHabitCompletion(habitId);

    // If we just completed a habit, check if all are now complete
    if (nowCompleted) {
      // Small delay to allow state to update
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
  }, [habits, isCompletedToday, toggleHabitCompletion]);

  const handleCalendarPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCalendarModalVisible(true);
  };

  const formattedSelectedDate = format(selectedDate, 'MMM d, yyyy');
  const dayName = format(selectedDate, 'EEEE');
  const isToday = isSameDay(selectedDate, new Date());

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerCenter} pointerEvents="box-none">
          <Text style={styles.logoText}>DAILY.APP</Text>
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

        <Pressable style={styles.iconButton} onPress={handleCalendarPress}>
          <Calendar size={24} color="#000" strokeWidth={1.5} />
        </Pressable>

        <Pressable style={styles.iconButton} onPress={() => router.push('/menu')}>
          <Settings size={22} color="#000" strokeWidth={1.5} />
        </Pressable>
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
          const dayWidth = 56; // width of day item + margins
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
              <ListTodo size={20} color="#000" />
              <Text style={styles.sectionLabel}>Tasks</Text>
            </View>
            <Pressable onPress={() => router.push('/add-todo')} style={styles.addButton}>
              <Plus size={16} color="#5856D6" strokeWidth={2.5} />
              <Text style={styles.addLink}>Add</Text>
            </Pressable>
          </View>

          <View style={styles.todoList}>
            {todosForDate.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyText}>No tasks for this day</Text>
                <Pressable onPress={() => router.push('/add-todo')} style={styles.emptyAddButton}>
                  <Text style={styles.emptyAddText}>Add a task</Text>
                </Pressable>
              </View>
            ) : (
              todosForDate.map(todo => (
                <TodoItem key={todo.id} todo={todo} toggleTodo={toggleTodo} deleteTodo={deleteTodo} />
              ))
            )}
          </View>
        </View>

        {/* Habits Section */}
        <View style={styles.habitsSection}>
          <View style={styles.sectionHeaderPadding}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Image
                  source={require('../assets/images/custom-habit-icon.png')}
                  style={{ width: 24, height: 24 }}
                  resizeMode="contain"
                />
                <Text style={styles.sectionLabel}>Habits</Text>
              </View>
              <Pressable onPress={() => router.push('/add-habit')} style={styles.addButton}>
                <Plus size={16} color="#5856D6" strokeWidth={2.5} />
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

        {/* Notes Input */}
        <View style={styles.sectionContainer}>
          <View style={styles.notesCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <PenLine size={18} color="#5856D6" />
                <Text style={styles.cardTitle}>Daily Note</Text>
              </View>
              <View style={styles.saveIndicator}>
                {isSaving ? (
                  <Text style={styles.savingText}>Saving...</Text>
                ) : noteText.length > 0 ? (
                  <Text style={styles.savedText}>Saved</Text>
                ) : null}
              </View>
            </View>
            <TextInput
              style={styles.notesInput}
              placeholder={isToday ? "How was your day? What are you grateful for?" : "What happened on this day?"}
              placeholderTextColor="#C7C7CC"
              multiline
              value={noteText}
              onChangeText={handleNoteChange}
              textAlignVertical="top"
            />
            {noteText.length > 0 && (
              <Text style={styles.characterCount}>{noteText.length} characters</Text>
            )}
          </View>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
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
    paddingVertical: 10,
    width: 48,
    borderRadius: 16,
    gap: 2,
  },
  dayItemSelected: {
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
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
  notesCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    minHeight: 180,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  saveIndicator: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  savingText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FF9500',
  },
  savedText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#34C759',
  },
  notesInput: {
    fontSize: 16,
    color: '#000',
    lineHeight: 24,
    minHeight: 80,
    maxHeight: 200,
  },
  characterCount: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'right',
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
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionLabel: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
    letterSpacing: -0.5,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  addLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5856D6',
  },
  todoList: {
    gap: 12,
  },
  todoItemWrapper: {
    // Wrapper for swipeable
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    gap: 16,
  },
  todoItemCompleted: {
    opacity: 0.6,
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxUnchecked: {
    borderColor: '#5856D6',
  },
  checkboxChecked: {
    backgroundColor: '#5856D6',
    borderColor: '#5856D6',
  },
  todoText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  todoTextChecked: {
    color: '#8E8E93',
    textDecorationLine: 'line-through',
  },
  emptyStateCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32, // Increased padding
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    // Replaced dashed border with Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  emptyAddButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#F2F2F7',
    borderRadius: 100,
  },
  emptyAddText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarModal: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    width: SCREEN_WIDTH - 40,
    maxWidth: 380,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  calendarNavButton: {
    padding: 8,
  },
  calendarMonthText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  weekDayRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDaySelected: {
    backgroundColor: '#000',
    borderRadius: 20,
  },
  calendarDayToday: {
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 20,
  },
  calendarDayText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  calendarDayTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  calendarDayTextToday: {
    color: '#000',
    fontWeight: '700',
  },
  todayButton: {
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    alignItems: 'center',
  },
  todayButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
});
