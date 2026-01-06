import { useRouter } from 'expo-router';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Plus,
  Zap,
  Menu,
  Check,
  Flame,
  Home,
  Brain,
} from 'lucide-react-native';
import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTodos } from '@/contexts/TodoContext';
import { useHabits } from '@/contexts/HabitContext';
import { useNotes } from '@/contexts/NoteContext';
import type { Todo } from '@/types/todo';
import { format, addDays, startOfWeek, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns';
import SwipeableRow from '@/components/SwipeableRow';

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
  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleTodo(todo.id);
  }, [todo.id, toggleTodo]);

  const handleDelete = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    deleteTodo(todo.id);
  }, [todo.id, deleteTodo]);

  return (
    <SwipeableRow onDelete={handleDelete}>
      <Pressable style={styles.todoItem} onPress={handlePress}>
        <View style={[styles.checkboxContainer, todo.completed ? styles.checkboxChecked : styles.checkboxUnchecked]}>
          {todo.completed && <Check size={16} color="#C7C7CC" strokeWidth={3} />}
        </View>
        <Text style={[styles.todoText, todo.completed && styles.todoTextChecked]}>
          {todo.title}
        </Text>
      </Pressable>
    </SwipeableRow>
  );
}

function CalendarModal({
  visible,
  onClose,
  selectedDate,
  onSelectDate,
}: {
  visible: boolean;
  onClose: () => void;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
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

  // Create array with empty slots for days before the month starts
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
          {/* Calendar Header */}
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

          {/* Week Day Headers */}
          <View style={styles.weekDayRow}>
            {weekDayHeaders.map((day) => (
              <View key={day} style={styles.weekDayCell}>
                <Text style={styles.weekDayText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {calendarDays.map((date, index) => {
              if (!date) {
                return <View key={`empty-${index}`} style={styles.calendarDayCell} />;
              }

              const isSelected = isSameDay(date, selectedDate);
              const isToday = isSameDay(date, new Date());

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
                </Pressable>
              );
            })}
          </View>

          {/* Today Button */}
          <Pressable style={styles.todayButton} onPress={handleGoToToday}>
            <Text style={styles.todayButtonText}>Go to Today</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function HabitCheckItem({
  habit,
  isCompleted,
  onToggle,
  onDelete
}: {
  habit: any;
  isCompleted: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggle(habit.id);
  };

  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onDelete(habit.id);
  };

  return (
    <SwipeableRow onDelete={handleDelete}>
      <Pressable style={styles.habitItem} onPress={handlePress}>
        <View style={[styles.habitCheckbox, isCompleted && styles.habitCheckboxCompleted]}>
          {isCompleted && <Check size={14} color="#fff" strokeWidth={3} />}
        </View>
        <Text style={[styles.habitText, isCompleted && styles.habitTextCompleted]}>
          {habit.name}
        </Text>
        {habit.currentStreak > 0 && (
          <View style={styles.miniStreak}>
            <Flame size={12} color="#FF9500" />
            <Text style={styles.miniStreakText}>{habit.currentStreak}</Text>
          </View>
        )}
      </Pressable>
    </SwipeableRow>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { getTodosForDate, toggleTodo, addTodo, deleteTodo } = useTodos();
  const { habits, toggleHabitCompletion, isCompletedToday, deleteHabit } = useHabits();
  const { getNoteForDate, updateNoteForDate } = useNotes();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [addOptionsVisible, setAddOptionsVisible] = useState(false);
  const [noteText, setNoteText] = useState('');

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

  // Calendar Strip Data
  const startOfCurrentWeek = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startOfCurrentWeek, i));

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

  const handleCalendarPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCalendarModalVisible(true);
  };

  const formattedSelectedDate = format(selectedDate, 'MMM d, yyyy');
  const dayName = format(selectedDate, 'EEEE').toUpperCase();
  const isToday = isSameDay(selectedDate, new Date());

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={handleCalendarPress}>
          <Calendar size={24} color="#000" strokeWidth={1.5} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.logoText}>daily.app</Text>
          <View style={styles.dateNav}>
            <Pressable
              hitSlop={10}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedDate(addDays(selectedDate, -1));
              }}
            >
              <ChevronLeft size={20} color="#000" />
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
              hitSlop={10}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedDate(addDays(selectedDate, 1));
              }}
            >
              <ChevronRight size={20} color="#000" />
            </Pressable>
          </View>
        </View>

        <Pressable style={styles.iconButton}>
          <MoreHorizontal size={24} color="#000" />
        </Pressable>
      </View>

      {/* Calendar Strip */}
      <View style={styles.calendarStrip}>
        {weekDays.map((date, index) => {
          const isSelected = isSameDay(date, selectedDate);

          return (
            <Pressable
              key={index}
              style={[styles.dayItem, isSelected && styles.dayItemSelected]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedDate(date);
              }}
            >
              <Text style={styles.dayName}>
                {format(date, 'EEE').toUpperCase()}
              </Text>
              <Text style={styles.dayNumber}>
                {format(date, 'd')}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Date Heading */}
        <View style={styles.pageHeader}>
          <Text style={styles.subDate}>
            {dayName} <Text style={{ color: '#C6C6C8' }}>•</Text> {isToday && <Text style={{ color: '#5856D6' }}>TODAY</Text>}
          </Text>
          <Text style={styles.mainDate}>{formattedSelectedDate}</Text>
        </View>

        {/* Notes Input */}
        <View style={styles.notesInputSection}>
          <Text style={styles.sectionLabel}>Notes</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="What's on your mind today?"
            placeholderTextColor="#C7C7CC"
            multiline
            value={noteText}
            onChangeText={handleNoteChange}
          />
        </View>

        {/* Tasks Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Tasks</Text>
            <Pressable onPress={handleAddPress}>
              <Text style={styles.addLink}>+ Add</Text>
            </Pressable>
          </View>
          <View style={styles.todoList}>
            {todosForDate.length === 0 ? (
              <Text style={styles.emptyText}>No tasks for this day</Text>
            ) : (
              todosForDate.map(todo => (
                <TodoItem key={todo.id} todo={todo} toggleTodo={toggleTodo} deleteTodo={deleteTodo} />
              ))
            )}
          </View>
        </View>

        {/* Habits Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Habits</Text>
            <Pressable onPress={() => router.push('/add-habit')}>
              <Text style={styles.addLink}>+ Add</Text>
            </Pressable>
          </View>
          <View style={styles.habitsList}>
            {habits.length === 0 ? (
              <Text style={styles.emptyText}>No habits yet</Text>
            ) : (
              habits.map(habit => (
                <HabitCheckItem
                  key={habit.id}
                  habit={habit}
                  isCompleted={isCompletedToday(habit)}
                  onToggle={toggleHabitCompletion}
                  onDelete={deleteHabit}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <Pressable style={[styles.bottomTab, styles.bottomTabActive]}>
          <Home size={24} color="#5856D6" strokeWidth={1.5} />
        </Pressable>
        <Pressable style={styles.bottomTab} onPress={() => router.push('/brain-dump')}>
          <Brain size={24} color="#000" strokeWidth={1.5} />
        </Pressable>

        <Pressable style={styles.fab} onPress={handleAddPress}>
          <Plus size={28} color="#000" strokeWidth={1.5} />
        </Pressable>

        <Pressable style={styles.bottomTab} onPress={() => router.push('/habits')}>
          <Zap size={24} color="#000" strokeWidth={1.5} />
        </Pressable>
        <Pressable style={styles.bottomTab} onPress={() => router.push('/menu')}>
          <Menu size={24} color="#000" strokeWidth={1.5} />
        </Pressable>
      </View>

      {/* Calendar Modal */}
      <CalendarModal
        visible={calendarModalVisible}
        onClose={() => setCalendarModalVisible(false)}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      {/* Add Options Modal */}
      <Modal
        visible={addOptionsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddOptionsVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setAddOptionsVisible(false)}>
          <View style={styles.addOptionsModal}>
            <Text style={styles.addOptionsTitle}>What would you like to add?</Text>
            <Pressable style={styles.addOptionButton} onPress={handleAddTask}>
              <Text style={styles.addOptionText}>📝 Task</Text>
            </Pressable>
            <Pressable style={styles.addOptionButton} onPress={handleAddHabit}>
              <Text style={styles.addOptionText}>⚡ Habit</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  iconButton: {
    padding: 8,
  },
  headerCenter: {
    alignItems: 'center',
    gap: 30,
    marginTop: -8,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
    letterSpacing: -1.0,
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerDateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  calendarStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  dayItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    width: 40,
    borderRadius: 8,
    gap: 4,
  },
  dayItemSelected: {
    backgroundColor: '#E6E6FA', // Light purple
  },
  dayName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
  },
  dayNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  pageHeader: {
    paddingHorizontal: 24,
    marginTop: 16,
    marginBottom: 24,
  },
  subDate: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8E93',
    marginBottom: 6,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  mainDate: {
    fontSize: 32,
    fontWeight: '800',
    color: '#000',
    letterSpacing: -0.5,
  },
  notesSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  notesTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  notesBody: {
    fontSize: 16,
    lineHeight: 24,
    color: '#000',
    fontWeight: '400',
  },
  todoList: {
    paddingHorizontal: 24,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  checkboxContainer: {
    marginRight: 14,
    marginTop: 2,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxUnchecked: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#5856D6', // Purple/Blue outline
  },
  checkboxChecked: {
    // No border for checked state in the image design, just the check icon naturally usually content-bound?
    // Actually the mock shows a checkmark. Let's assume it's just the icon.
    // Or maybe a faint border? Let's go with no border to match "clean" look or kept layout.
    // Making it consistent container size.
  },
  todoText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    lineHeight: 24,
    fontWeight: '400',
  },
  todoTextChecked: {
    color: '#C7C7CC',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    paddingBottom: 20,
  },
  bottomTab: {
    padding: 4,
  },
  bottomTabActive: {
    opacity: 1,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16, // Float slightly up
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
    borderRadius: 20,
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
    backgroundColor: '#5856D6',
    borderRadius: 20,
  },
  calendarDayToday: {
    borderWidth: 2,
    borderColor: '#5856D6',
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
    color: '#5856D6',
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
    color: '#5856D6',
  },
  addOptionsModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: SCREEN_WIDTH - 80,
    maxWidth: 300,
    alignItems: 'center',
  },
  addOptionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 20,
  },
  addOptionButton: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    marginBottom: 12,
  },
  addOptionText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
  // New styles for enhanced daily notes
  notesInputSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  notesInput: {
    fontSize: 16,
    color: '#000',
    lineHeight: 24,
  },
  sectionContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5856D6',
  },
  emptyText: {
    fontSize: 14,
    color: '#C7C7CC',
    fontStyle: 'italic',
  },
  habitsList: {
    gap: 8,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
  },
  habitCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#5856D6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  habitCheckboxCompleted: {
    backgroundColor: '#5856D6',
    borderColor: '#5856D6',
  },
  habitText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
  },
  habitTextCompleted: {
    color: '#8E8E93',
  },
  miniStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  miniStreakText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF9500',
  },
});
