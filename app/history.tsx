import React, { useState, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Dimensions,
    Modal,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ChevronLeft,
    ChevronRight,
    Check,
    X,
    Zap,
    Pill,
    CheckSquare,
    Plus,
    Calendar,
    Trash2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
    addMonths,
    subMonths,
    isSameMonth,
    isToday,
    getDay,
    isSameDay,
} from 'date-fns';
import { BottomNavBar } from '@/components/BottomNavBar';
import { useHabits } from '@/contexts/HabitContext';
import { useSupplements } from '@/contexts/SupplementContext';
import { useTodos } from '@/contexts/TodoContext';
import { useCalendarEvents } from '@/contexts/CalendarEventContext';
import type { CalendarEvent as CustomEvent } from '@/types/event';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CALENDAR_PADDING = 20;
const CELL_WIDTH = (SCREEN_WIDTH - CALENDAR_PADDING * 2) / 7;
const HOUR_HEIGHT = 60;

interface CalendarEventDisplay {
    id: string;
    type: 'habit' | 'task' | 'supplement' | 'event';
    title: string;
    emoji?: string;
    completed: boolean;
    color: string;
    originalId: string;
    dateStr: string;
    isCustomEvent?: boolean;
    startTime?: string;
    endTime?: string;
    isAllDay?: boolean;
}

// Parse time string (HH:mm) to hour decimal
const parseTimeToHour = (timeStr?: string): number => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours + minutes / 60;
};

export default function CalendarScreen() {
    const router = useRouter();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [dayModalVisible, setDayModalVisible] = useState(false);

    const { habits, toggleHabitCompletion } = useHabits();
    const { activeSupplements, toggleTaken } = useSupplements();
    const { todos, toggleTodo } = useTodos();
    const { events: customEvents, deleteEvent } = useCalendarEvents();

    const goToPreviousMonth = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setCurrentMonth(prev => subMonths(prev, 1));
    }, []);

    const goToNextMonth = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setCurrentMonth(prev => addMonths(prev, 1));
    }, []);

    const goToToday = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setCurrentMonth(new Date());
    }, []);

    const handleDatePress = useCallback((date: Date) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedDate(date);
        setDayModalVisible(true);
    }, []);

    const closeDayModal = useCallback(() => {
        setDayModalVisible(false);
    }, []);

    const handleAddEvent = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (selectedDate) {
            router.push({
                pathname: '/add-event',
                params: { date: format(selectedDate, 'yyyy-MM-dd') }
            });
            closeDayModal();
        } else {
            router.push('/add-event');
        }
    }, [router, selectedDate, closeDayModal]);

    const handleDeleteEvent = useCallback((eventId: string) => {
        Alert.alert(
            'Delete Event',
            'Are you sure you want to delete this event?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        deleteEvent(eventId);
                    }
                }
            ]
        );
    }, [deleteEvent]);

    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const days: Date[] = [];
        let currentDate = startDate;

        while (currentDate <= endDate) {
            days.push(currentDate);
            currentDate = addDays(currentDate, 1);
        }

        return days;
    }, [currentMonth]);

    const eventsMap = useMemo(() => {
        const map: Record<string, CalendarEventDisplay[]> = {};

        calendarDays.forEach(date => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const dayOfWeek = getDay(date);
            const events: CalendarEventDisplay[] = [];

            // Custom events first
            customEvents.forEach(event => {
                if (event.date === dateStr) {
                    events.push({
                        id: `event-${event.id}`,
                        type: 'event',
                        title: event.title,
                        completed: false,
                        color: event.color,
                        originalId: event.id,
                        dateStr,
                        isCustomEvent: true,
                        startTime: event.startTime,
                        endTime: event.endTime,
                        isAllDay: event.isAllDay,
                    });
                }
            });

            // Habits
            habits.forEach(habit => {
                const isScheduledToday = !habit.scheduledDays || habit.scheduledDays.length === 0 ||
                    habit.scheduledDays.includes(dayOfWeek as any);

                if (isScheduledToday) {
                    events.push({
                        id: `habit-${habit.id}-${dateStr}`,
                        type: 'habit',
                        title: habit.name,
                        emoji: habit.emoji,
                        completed: habit.completedDates.includes(dateStr),
                        color: habit.completedDates.includes(dateStr) ? '#34C759' : '#34C75980',
                        originalId: habit.id,
                        dateStr,
                        isAllDay: true,
                    });
                }
            });

            // Supplements
            activeSupplements.forEach(supplement => {
                const shouldShow = supplement.frequency === 'daily' ||
                    (supplement.frequency === 'twice_daily') ||
                    (supplement.frequency === 'weekly' && dayOfWeek === 0);

                if (shouldShow) {
                    events.push({
                        id: `supplement-${supplement.id}-${dateStr}`,
                        type: 'supplement',
                        title: supplement.name,
                        emoji: supplement.emoji,
                        completed: supplement.takenDates.includes(dateStr),
                        color: supplement.takenDates.includes(dateStr) ? '#AF52DE' : '#AF52DE80',
                        originalId: supplement.id,
                        dateStr,
                        isAllDay: true,
                    });
                }
            });

            // Tasks
            todos.forEach(task => {
                if (task.dueDate === dateStr) {
                    events.push({
                        id: `task-${task.id}`,
                        type: 'task',
                        title: task.title,
                        completed: task.completed,
                        color: task.completed ? '#FF9500' : '#FF950080',
                        originalId: task.id,
                        dateStr,
                        isAllDay: true,
                    });
                }
            });

            map[dateStr] = events;
        });

        return map;
    }, [calendarDays, habits, activeSupplements, todos, customEvents]);

    const handleEventToggle = useCallback((event: CalendarEventDisplay) => {
        if (event.isCustomEvent) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        if (event.type === 'habit') {
            toggleHabitCompletion(event.originalId);
        } else if (event.type === 'supplement') {
            toggleTaken(event.originalId);
        } else if (event.type === 'task') {
            toggleTodo(event.originalId);
        }
    }, [toggleHabitCompletion, toggleTaken, toggleTodo]);

    const weeks = useMemo(() => {
        const weeksArray: Date[][] = [];
        for (let i = 0; i < calendarDays.length; i += 7) {
            weeksArray.push(calendarDays.slice(i, i + 7));
        }
        return weeksArray;
    }, [calendarDays]);

    const selectedDateEvents = useMemo(() => {
        if (!selectedDate) return [];
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        return eventsMap[dateStr] || [];
    }, [selectedDate, eventsMap]);

    // Separate all-day events from timed events
    const { allDayEvents, timedEvents } = useMemo(() => {
        const allDay = selectedDateEvents.filter(e => e.isAllDay !== false && !e.startTime);
        const timed = selectedDateEvents.filter(e => e.startTime);
        return { allDayEvents: allDay, timedEvents: timed };
    }, [selectedDateEvents]);

    // Generate week days for the week strip
    const weekDays = useMemo(() => {
        if (!selectedDate) return [];
        const start = startOfWeek(selectedDate);
        const days: Date[] = [];
        for (let i = 0; i < 7; i++) {
            days.push(addDays(start, i));
        }
        return days;
    }, [selectedDate]);

    // Hours for the timeline (6 AM to 11 PM)
    const hours = useMemo(() => {
        const result: number[] = [];
        for (let i = 6; i <= 23; i++) {
            result.push(i);
        }
        return result;
    }, []);

    const formatHour = (hour: number): string => {
        if (hour === 0 || hour === 24) return '12 AM';
        if (hour === 12) return '12 PM';
        if (hour < 12) return `${hour} AM`;
        return `${hour - 12} PM`;
    };

    const renderWeek = (week: Date[], weekIndex: number) => {
        return (
            <View key={weekIndex} style={styles.weekRow}>
                <View style={styles.dateNumberRow}>
                    {week.map((date, dayIndex) => {
                        const isCurrentMonth = isSameMonth(date, currentMonth);
                        const isTodayDate = isToday(date);

                        return (
                            <Pressable
                                key={dayIndex}
                                style={styles.dateCell}
                                onPress={() => handleDatePress(date)}
                            >
                                <View style={[
                                    styles.dateCircle,
                                    isTodayDate && styles.dateCircleToday,
                                ]}>
                                    <Text style={[
                                        styles.dateText,
                                        !isCurrentMonth && styles.dateTextOtherMonth,
                                        isTodayDate && styles.dateTextToday,
                                    ]}>
                                        {format(date, 'd')}
                                    </Text>
                                </View>
                            </Pressable>
                        );
                    })}
                </View>

                <View style={styles.eventsContainer}>
                    <View style={styles.eventRowContainer}>
                        {week.map((date, dayIndex) => {
                            const dateStr = format(date, 'yyyy-MM-dd');
                            const events = eventsMap[dateStr] || [];

                            const pills = events.filter(e => e.type === 'event' || e.type === 'task');
                            const dots = events.filter(e => e.type === 'habit' || e.type === 'supplement');

                            const visiblePills = pills.slice(0, 2);
                            const morePillsCount = pills.length - 2;

                            return (
                                <Pressable
                                    key={dayIndex}
                                    style={styles.cellContent}
                                    onPress={() => handleDatePress(date)}
                                >
                                    <View style={styles.pillsContainer}>
                                        {visiblePills.map((pill, i) => (
                                            <View key={pill.id} style={[styles.eventPill, { backgroundColor: pill.color }]}>
                                                <Text style={styles.eventText} numberOfLines={1}>
                                                    {pill.title}
                                                </Text>
                                            </View>
                                        ))}
                                        {morePillsCount > 0 && <Text style={styles.moreText}>+{morePillsCount}</Text>}
                                    </View>

                                    {dots.length > 0 && (
                                        <View style={styles.dotsRow}>
                                            {dots.slice(0, 5).map((dot, i) => (
                                                <View
                                                    key={dot.id}
                                                    style={[
                                                        styles.dot,
                                                        { backgroundColor: dot.completed ? dot.color : dot.color + '40' }
                                                    ]}
                                                />
                                            ))}
                                            {dots.length > 5 && (
                                                <View style={[styles.dot, { backgroundColor: '#8E8E93' }]} />
                                            )}
                                        </View>
                                    )}
                                </Pressable>
                            );
                        })}
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.header}>
                    <Text style={styles.monthTitle}>{format(currentMonth, 'MMMM yyyy')}</Text>
                    <View style={styles.headerButtons}>
                        <Pressable onPress={goToToday} hitSlop={15}>
                            <Text style={styles.todayTextButton}>Today</Text>
                        </Pressable>
                        <View style={styles.navButtonGroup}>
                            <Pressable onPress={goToPreviousMonth} style={styles.iconButton} hitSlop={15}>
                                <ChevronLeft size={24} color="#007AFF" />
                            </Pressable>
                            <Pressable onPress={goToNextMonth} style={styles.iconButton} hitSlop={15}>
                                <ChevronRight size={24} color="#007AFF" />
                            </Pressable>
                        </View>
                        <Pressable onPress={handleAddEvent} style={styles.iconButton} hitSlop={15}>
                            <Plus size={24} color="#007AFF" />
                        </Pressable>
                    </View>
                </View>

                <View style={styles.weekdayRow}>
                    {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day, idx) => (
                        <View key={idx} style={styles.weekdayCell}>
                            <Text style={styles.weekdayText}>{day}</Text>
                        </View>
                    ))}
                </View>

                <ScrollView
                    style={styles.calendarScroll}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.calendarContent}
                >
                    {weeks.map((week, index) => renderWeek(week, index))}
                </ScrollView>
            </SafeAreaView>

            {/* Day Schedule Modal - Timeline View */}
            <Modal
                visible={dayModalVisible}
                transparent
                animationType="slide"
                onRequestClose={closeDayModal}
            >
                <View style={styles.scheduleModalContainer}>
                    <SafeAreaView style={styles.scheduleModalSafe} edges={['top']}>
                        {/* Schedule Header */}
                        <View style={styles.scheduleHeader}>
                            <Pressable onPress={closeDayModal} style={styles.scheduleCloseButton}>
                                <ChevronLeft size={24} color="#000" />
                            </Pressable>
                            <Text style={styles.scheduleTitle}>Details</Text>
                            <Pressable onPress={handleAddEvent} style={styles.scheduleAddButton}>
                                <Plus size={24} color="#007AFF" />
                            </Pressable>
                        </View>

                        {/* Week Strip */}
                        <View style={styles.weekStrip}>
                            {weekDays.map((date, idx) => {
                                const isSelected = selectedDate && isSameDay(date, selectedDate);
                                const isTodayDate = isToday(date);
                                return (
                                    <Pressable
                                        key={idx}
                                        style={styles.weekStripDay}
                                        onPress={() => setSelectedDate(date)}
                                    >
                                        <Text style={[
                                            styles.weekStripDayName,
                                            isSelected && styles.weekStripDayNameSelected
                                        ]}>
                                            {format(date, 'EEE')}
                                        </Text>
                                        <View style={[
                                            styles.weekStripDateCircle,
                                            isSelected && styles.weekStripDateCircleSelected,
                                            isTodayDate && !isSelected && styles.weekStripDateCircleToday,
                                        ]}>
                                            <Text style={[
                                                styles.weekStripDate,
                                                isSelected && styles.weekStripDateSelected,
                                                isTodayDate && !isSelected && styles.weekStripDateToday,
                                            ]}>
                                                {format(date, 'd')}
                                            </Text>
                                        </View>
                                    </Pressable>
                                );
                            })}
                        </View>

                        {/* All Day Events Section */}
                        {allDayEvents.length > 0 && (
                            <View style={styles.allDaySection}>
                                <Text style={styles.allDaySectionTitle}>ALL DAY</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.allDayScroll} contentContainerStyle={{ paddingHorizontal: 16 }}>
                                    {allDayEvents.map(event => (
                                        <Pressable
                                            key={event.id}
                                            style={[
                                                styles.allDayChip,
                                                {
                                                    backgroundColor: event.completed ? event.color : event.color + '15', // light background
                                                }
                                            ]}
                                            onPress={() => handleEventToggle(event)}
                                        >
                                            <Text style={[
                                                styles.allDayChipText,
                                                {
                                                    color: event.completed ? '#fff' : event.color,
                                                    fontWeight: event.completed ? '600' : '500'
                                                }
                                            ]} numberOfLines={1}>
                                                {event.emoji || ''} {event.title}
                                            </Text>
                                            {event.completed && (
                                                <Check size={14} color="#fff" strokeWidth={3} style={{ marginLeft: 6 }} />
                                            )}
                                        </Pressable>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {/* Timeline */}
                        <ScrollView
                            style={styles.timelineScroll}
                            contentContainerStyle={styles.timelineContent}
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={styles.timeline}>
                                {hours.map(hour => (
                                    <View key={hour} style={styles.timelineRow}>
                                        <Text style={styles.timelineHour}>{formatHour(hour)}</Text>
                                        <View style={styles.timelineLine} />
                                    </View>
                                ))}

                                {/* Render timed events as positioned blocks */}
                                {timedEvents.map(event => {
                                    const startHour = parseTimeToHour(event.startTime);
                                    const endHour = event.endTime ? parseTimeToHour(event.endTime) : startHour + 1;
                                    const top = (startHour - 6) * HOUR_HEIGHT;
                                    const height = Math.max((endHour - startHour) * HOUR_HEIGHT, 30);

                                    return (
                                        <Pressable
                                            key={event.id}
                                            style={[
                                                styles.timedEventBlock,
                                                {
                                                    top,
                                                    height: height - 2,
                                                    backgroundColor: event.color + '20',
                                                    borderLeftColor: event.color,
                                                }
                                            ]}
                                            onLongPress={() => event.isCustomEvent && handleDeleteEvent(event.originalId)}
                                        >
                                            <Text style={[styles.timedEventTitle, { color: event.color }]} numberOfLines={1}>
                                                {event.title}
                                            </Text>
                                            <Text style={[styles.timedEventTime, { color: event.color + 'CC' }]}>
                                                {event.startTime}{event.endTime ? ` - ${event.endTime}` : ''}
                                            </Text>
                                        </Pressable>
                                    );
                                })}

                                {/* Current Time Indicator */}
                                {isToday(selectedDate || new Date()) && (
                                    <View style={[
                                        styles.currentTimeIndicator,
                                        { top: (parseTimeToHour(format(new Date(), 'HH:mm')) - 6) * HOUR_HEIGHT }
                                    ]}>
                                        <View style={styles.currentTimeDot} />
                                        <View style={styles.currentTimeLine} />
                                    </View>
                                )}
                            </View>
                        </ScrollView>

                        {/* Empty State */}
                        {selectedDateEvents.length === 0 && (
                            <View style={styles.emptyTimeline}>
                                <Text style={styles.emptyTimelineText}>No events scheduled</Text>
                                <Pressable style={styles.emptyAddButton} onPress={handleAddEvent}>
                                    <Plus size={16} color="#fff" />
                                    <Text style={styles.emptyAddButtonText}>Add Event</Text>
                                </Pressable>
                            </View>
                        )}
                    </SafeAreaView>
                </View>
            </Modal>

            <BottomNavBar />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    monthTitle: {
        fontSize: 28, // Large Title
        fontWeight: '700',
        color: '#000',
        letterSpacing: -0.5,
    },
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    todayTextButton: {
        fontSize: 16,
        fontWeight: '600',
        color: '#007AFF', // iOS Blue
    },
    navButtonGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    iconButton: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    weekdayRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F7', // Subtle separator
    },
    weekdayCell: {
        width: CELL_WIDTH,
        alignItems: 'center',
    },
    weekdayText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#8E8E93',
        textTransform: 'uppercase',
    },
    calendarScroll: {
        flex: 1,
    },
    calendarContent: {
        paddingBottom: 100,
    },
    weekRow: {
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F7', // Very subtle separator
        minHeight: 110, // Slightly taller for breathing room
    },
    dateNumberRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 8,
    },
    dateCell: {
        width: CELL_WIDTH,
        alignItems: 'center',
    },
    dateCircle: {
        width: 26,
        height: 26,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 13,
    },
    dateCircleToday: {
        backgroundColor: '#007AFF', // iOS Blue
    },
    dateText: {
        fontSize: 15,
        fontWeight: '500', // Medium
        color: '#000',
    },
    dateTextOtherMonth: {
        color: '#D1D1D6',
    },
    dateTextToday: {
        color: '#fff',
        fontWeight: '600',
    },
    eventsContainer: {
        paddingHorizontal: 20,
        paddingTop: 4,
        paddingBottom: 8,
        flex: 1,
    },
    eventRowContainer: {
        flexDirection: 'row',
    },
    cellContent: {
        width: CELL_WIDTH,
        paddingHorizontal: 2,
        alignItems: 'center', // Center content in cell
        gap: 4,
    },
    pillsContainer: {
        width: '100%',
        alignItems: 'center',
        gap: 2,
    },
    eventPill: {
        width: '100%',
        paddingHorizontal: 3,
        paddingVertical: 1,
        borderRadius: 2,
        minHeight: 14,
        justifyContent: 'center',
    },
    eventText: {
        fontSize: 9,
        fontWeight: '600',
        color: '#fff',
        textAlign: 'center',
    },
    dotsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        flexWrap: 'wrap',
        maxWidth: '100%',
    },
    dot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
    },
    moreText: {
        fontSize: 8,
        fontWeight: '600',
        color: '#8E8E93',
    },
    // Schedule Modal Styles
    scheduleModalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scheduleModalSafe: {
        flex: 1,
    },
    scheduleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: '#E5E5EA',
    },
    scheduleCloseButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButtonText: {
        fontSize: 17,
        color: '#007AFF',
        marginLeft: -4,
    },
    scheduleTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000',
    },
    scheduleAddButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Week Strip
    weekStrip: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 0.5,
        borderBottomColor: '#E5E5EA',
    },
    weekStripDay: {
        flex: 1,
        alignItems: 'center',
        gap: 6,
    },
    weekStripDayName: {
        fontSize: 11,
        fontWeight: '600',
        color: '#8E8E93',
        textTransform: 'uppercase',
    },
    weekStripDayNameSelected: {
        color: '#000',
    },
    weekStripDateCircle: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
    },
    weekStripDateCircleSelected: {
        backgroundColor: '#000',
    },
    weekStripDateCircleToday: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    weekStripDate: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000',
    },
    weekStripDateSelected: {
        color: '#fff',
        fontWeight: '600',
    },
    weekStripDateToday: {
        color: '#007AFF',
        fontWeight: '600',
    },
    // All Day Section
    allDaySection: {
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: '#E5E5EA',
    },
    allDaySectionTitle: {
        fontSize: 11,
        fontWeight: '600',
        color: '#8E8E93',
        marginBottom: 8,
        paddingHorizontal: 16,
    },
    allDayScroll: {
        maxHeight: 40,
    },
    allDayChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
        marginRight: 8,
    },
    allDayChipText: {
        fontSize: 13,
        fontWeight: '500',
    },
    // Timeline
    timelineScroll: {
        flex: 1,
    },
    timelineContent: {
        paddingTop: 16,
        paddingBottom: 40,
    },
    timeline: {
        position: 'relative',
        paddingHorizontal: 16,
    },
    timelineRow: {
        flexDirection: 'row',
        height: HOUR_HEIGHT,
        alignItems: 'flex-start',
    },
    timelineHour: {
        width: 45,
        fontSize: 11,
        color: '#8E8E93',
        fontWeight: '500',
        transform: [{ translateY: -6 }],
    },
    timelineLine: {
        flex: 1,
        height: 0.5,
        backgroundColor: '#E5E5EA',
    },
    timedEventBlock: {
        position: 'absolute',
        left: 60,
        right: 0,
        borderRadius: 6,
        borderLeftWidth: 3,
        padding: 6,
        justifyContent: 'center',
    },
    timedEventTitle: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 2,
    },
    timedEventTime: {
        fontSize: 11,
        fontWeight: '500',
    },
    currentTimeIndicator: {
        position: 'absolute',
        left: 60,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 10,
    },
    currentTimeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF3B30', // Red for current time
        marginRight: -4,
    },
    currentTimeLine: {
        flex: 1,
        height: 1.5,
        backgroundColor: '#FF3B30',
    },
    emptyTimeline: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyTimelineText: {
        fontSize: 15,
        color: '#8E8E93',
        marginBottom: 16,
    },
    emptyAddButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007AFF',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        gap: 6,
    },
    emptyAddButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
});
