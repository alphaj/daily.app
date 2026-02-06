import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Dimensions,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import {
    format,
    addMonths,
    subMonths,
    isSameMonth,
    startOfMonth,
    startOfWeek,
} from 'date-fns';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    interpolate,
    Extrapolation,
    runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { BottomNavBar } from '@/components/BottomNavBar';
import { useHabits } from '@/contexts/HabitContext';
import { useSupplements } from '@/contexts/SupplementContext';
import { useTodos } from '@/contexts/TodoContext';
import { useCalendarEvents } from '@/contexts/CalendarEventContext';
import { useGroceries } from '@/contexts/GroceryContext';
import { useCalendarEventAggregation } from '@/hooks/useCalendarEventAggregation';
import { CalendarMonthGrid, WEEK_ROW_HEIGHT } from '@/components/calendar/CalendarMonthGrid';
import { InlineDayView } from '@/components/calendar/InlineDayView';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FULL_GRID_HEIGHT = WEEK_ROW_HEIGHT * 6;

const COLLAPSE_SPRING = { damping: 15, stiffness: 220, mass: 0.8 };
const SWIPE_SPRING = { damping: 18, stiffness: 260, mass: 0.7 };

function clamp(val: number, min: number, max: number) {
    'worklet';
    return Math.min(Math.max(val, min), max);
}

export default function CalendarScreen() {
    const router = useRouter();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

    const { habits, toggleHabitCompletion } = useHabits();
    const { activeSupplements, toggleTaken } = useSupplements();
    const { todos, toggleTodo } = useTodos();
    const { events: customEvents, deleteEvent } = useCalendarEvents();
    const { groceries, toggleOnList } = useGroceries();

    // Event aggregation for current month
    const {
        eventsMap,
        weeks,
        selectedDateEvents,
        allDayEvents,
        timedEvents,
        handleEventToggle,
    } = useCalendarEventAggregation({
        currentMonth,
        selectedDate,
        habits,
        activeSupplements,
        todos,
        customEvents,
        groceries,
        toggleHabitCompletion,
        toggleTaken,
        toggleTodo,
        toggleOnList,
    });

    // Pre-compute prev/next months for swipe
    const prevMonth = useMemo(() => subMonths(currentMonth, 1), [currentMonth]);
    const nextMonth = useMemo(() => addMonths(currentMonth, 1), [currentMonth]);

    const prevAggregation = useCalendarEventAggregation({
        currentMonth: prevMonth,
        selectedDate: null,
        habits,
        activeSupplements,
        todos,
        customEvents,
        groceries,
        toggleHabitCompletion,
        toggleTaken,
        toggleTodo,
        toggleOnList,
    });

    const nextAggregation = useCalendarEventAggregation({
        currentMonth: nextMonth,
        selectedDate: null,
        habits,
        activeSupplements,
        todos,
        customEvents,
        groceries,
        toggleHabitCompletion,
        toggleTaken,
        toggleTodo,
        toggleOnList,
    });

    // Shared values for animations
    const collapseProgress = useSharedValue(0);
    const activeWeekIndex = useSharedValue(0);
    const translateX = useSharedValue(0);
    const monthContentOpacity = useSharedValue(1);

    // Compute active week index from selected date
    useEffect(() => {
        if (!selectedDate) {
            activeWeekIndex.value = 0;
            return;
        }
        const monthStart = startOfMonth(currentMonth);
        const gridStart = startOfWeek(monthStart);
        const dayOffset = Math.floor(
            (selectedDate.getTime() - gridStart.getTime()) / (1000 * 60 * 60 * 24)
        );
        const weekIdx = Math.floor(dayOffset / 7);
        activeWeekIndex.value = Math.max(0, Math.min(5, weekIdx));
    }, [selectedDate, currentMonth]);

    // Navigation callbacks
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
        setSelectedDate(new Date());
    }, []);

    const handleDatePress = useCallback((date: Date) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedDate(date);
    }, []);

    const handleAddEvent = useCallback((hour?: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (selectedDate) {
            const params: { date: string; startTime?: string } = {
                date: format(selectedDate, 'yyyy-MM-dd')
            };
            if (hour !== undefined) {
                params.startTime = `${hour.toString().padStart(2, '0')}:00`;
            }
            router.push({ pathname: '/add-event', params });
        } else {
            router.push('/add-event');
        }
    }, [router, selectedDate]);

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

    // Commit month change after swipe animation completes
    const commitMonthChange = useCallback((direction: 'prev' | 'next') => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (direction === 'prev') {
            setCurrentMonth(prev => subMonths(prev, 1));
        } else {
            setCurrentMonth(prev => addMonths(prev, 1));
        }
    }, []);

    // Differentiated haptics for collapse/expand
    const hapticCollapse = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, []);

    const hapticExpand = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, []);

    // --- GESTURES ---

    // Vertical pan: collapse/expand month grid
    const startProgress = useSharedValue(0);
    const verticalPan = Gesture.Pan()
        .activeOffsetY([-10, 10])
        .failOffsetX([-20, 20])
        .onStart(() => {
            startProgress.value = collapseProgress.value;
        })
        .onUpdate((event) => {
            const dragDistance = -event.translationY;
            const normalizedDelta = dragDistance / FULL_GRID_HEIGHT;
            collapseProgress.value = clamp(startProgress.value + normalizedDelta, 0, 1);
        })
        .onEnd((event) => {
            const velocityThreshold = 500;
            if (event.velocityY < -velocityThreshold || collapseProgress.value > 0.5) {
                collapseProgress.value = withSpring(1, COLLAPSE_SPRING);
                runOnJS(hapticCollapse)();
            } else {
                collapseProgress.value = withSpring(0, COLLAPSE_SPRING);
                runOnJS(hapticExpand)();
            }
        });

    // Horizontal pan: swipe between months
    const horizontalPan = Gesture.Pan()
        .activeOffsetX([-15, 15])
        .failOffsetY([-10, 10])
        .onUpdate((event) => {
            translateX.value = event.translationX;
        })
        .onEnd((event) => {
            const threshold = SCREEN_WIDTH * 0.3;
            const velocityThreshold = 800;

            if (event.translationX > threshold || event.velocityX > velocityThreshold) {
                translateX.value = withSpring(SCREEN_WIDTH, SWIPE_SPRING, (finished) => {
                    if (finished) {
                        monthContentOpacity.value = 0;
                        runOnJS(commitMonthChange)('prev');
                        translateX.value = 0;
                        monthContentOpacity.value = withTiming(1, { duration: 120 });
                    }
                });
            } else if (event.translationX < -threshold || event.velocityX < -velocityThreshold) {
                translateX.value = withSpring(-SCREEN_WIDTH, SWIPE_SPRING, (finished) => {
                    if (finished) {
                        monthContentOpacity.value = 0;
                        runOnJS(commitMonthChange)('next');
                        translateX.value = 0;
                        monthContentOpacity.value = withTiming(1, { duration: 120 });
                    }
                });
            } else {
                translateX.value = withSpring(0, SWIPE_SPRING);
            }
        });

    const composed = Gesture.Race(verticalPan, horizontalPan);

    // Animated styles
    const monthSlideStyle = useAnimatedStyle(() => ({
        flexDirection: 'row' as const,
        width: SCREEN_WIDTH * 3,
        transform: [{ translateX: translateX.value - SCREEN_WIDTH }],
    }));

    const monthTitleOpacity = useAnimatedStyle(() => ({
        opacity: interpolate(
            Math.abs(translateX.value),
            [0, SCREEN_WIDTH * 0.5],
            [1, 0.3],
            Extrapolation.CLAMP
        ),
    }));

    const monthContentAnimStyle = useAnimatedStyle(() => ({
        opacity: monthContentOpacity.value,
        width: SCREEN_WIDTH,
    }));

    const monthClipStyle = useAnimatedStyle(() => ({
        height: interpolate(
            collapseProgress.value,
            [0, 1],
            [WEEK_ROW_HEIGHT * 6, WEEK_ROW_HEIGHT],
            Extrapolation.CLAMP
        ),
        overflow: 'hidden' as const,
        width: SCREEN_WIDTH,
    }));

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <Animated.Text style={[styles.monthTitle, monthTitleOpacity]}>
                        {format(currentMonth, 'MMMM yyyy')}
                    </Animated.Text>
                    <View style={styles.headerButtons}>
                        <Pressable
                            onPress={goToToday}
                            hitSlop={15}
                            style={[
                                styles.todayButton,
                                isSameMonth(currentMonth, new Date()) && styles.todayButtonDisabled
                            ]}
                            disabled={isSameMonth(currentMonth, new Date())}
                        >
                            <Text style={[
                                styles.todayTextButton,
                                isSameMonth(currentMonth, new Date()) && styles.todayTextButtonDisabled
                            ]}>Today</Text>
                        </Pressable>
                        <View style={styles.navButtonGroup}>
                            <Pressable onPress={goToPreviousMonth} style={styles.iconButton} hitSlop={15}>
                                <ChevronLeft size={24} color="#007AFF" />
                            </Pressable>
                            <Pressable onPress={goToNextMonth} style={styles.iconButton} hitSlop={15}>
                                <ChevronRight size={24} color="#007AFF" />
                            </Pressable>
                        </View>
                        <Pressable onPress={() => handleAddEvent()} style={styles.iconButton} hitSlop={15}>
                            <Plus size={24} color="#007AFF" />
                        </Pressable>
                    </View>
                </View>

                {/* Weekday row */}
                <View style={styles.weekdayRow}>
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                        <View key={idx} style={styles.weekdayCell}>
                            <Text style={styles.weekdayText}>{day}</Text>
                        </View>
                    ))}
                </View>

                {/* Gesture area: calendar grid + drag handle (gestures only here) */}
                <GestureDetector gesture={composed}>
                    <Animated.View>
                        <Animated.View style={monthClipStyle}>
                            <Animated.View style={monthSlideStyle}>
                                {/* Prev month */}
                                <View style={{ width: SCREEN_WIDTH }}>
                                    <CalendarMonthGrid
                                        weeks={prevAggregation.weeks}
                                        currentMonth={prevMonth}
                                        selectedDate={null}
                                        eventsMap={prevAggregation.eventsMap}
                                        onDatePress={handleDatePress}
                                        collapseProgress={collapseProgress}
                                        activeWeekIndex={activeWeekIndex}
                                    />
                                </View>
                                {/* Current month */}
                                <Animated.View style={monthContentAnimStyle}>
                                    <CalendarMonthGrid
                                        weeks={weeks}
                                        currentMonth={currentMonth}
                                        selectedDate={selectedDate}
                                        eventsMap={eventsMap}
                                        onDatePress={handleDatePress}
                                        collapseProgress={collapseProgress}
                                        activeWeekIndex={activeWeekIndex}
                                    />
                                </Animated.View>
                                {/* Next month */}
                                <View style={{ width: SCREEN_WIDTH }}>
                                    <CalendarMonthGrid
                                        weeks={nextAggregation.weeks}
                                        currentMonth={nextMonth}
                                        selectedDate={null}
                                        eventsMap={nextAggregation.eventsMap}
                                        onDatePress={handleDatePress}
                                        collapseProgress={collapseProgress}
                                        activeWeekIndex={activeWeekIndex}
                                    />
                                </View>
                            </Animated.View>
                        </Animated.View>

                        {/* Drag handle */}
                        <View style={styles.dragHandleContainer}>
                            <View style={styles.dragHandle} />
                        </View>
                    </Animated.View>
                </GestureDetector>

                {/* Inline day view (outside gesture area so ScrollView works) */}
                <View style={styles.dayViewArea}>
                    <InlineDayView
                        selectedDate={selectedDate}
                        allDayEvents={allDayEvents}
                        timedEvents={timedEvents}
                        selectedDateEvents={selectedDateEvents}
                        onEventToggle={handleEventToggle}
                        onDeleteEvent={handleDeleteEvent}
                        onAddEvent={handleAddEvent}
                    />
                </View>
            </SafeAreaView>

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
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 12,
    },
    monthTitle: {
        fontSize: 30,
        fontWeight: '700',
        color: '#000',
        letterSpacing: -0.5,
    },
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    todayButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    todayTextButton: {
        fontSize: 17,
        fontWeight: '400',
        color: '#007AFF',
    },
    todayButtonDisabled: {
        opacity: 0.5,
    },
    todayTextButtonDisabled: {
        color: '#C7C7CC',
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
        paddingVertical: 6,
        backgroundColor: '#fff',
    },
    weekdayCell: {
        width: SCREEN_WIDTH / 7,
        alignItems: 'center',
    },
    weekdayText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#3C3C4399',
        textAlign: 'center',
    },
    dragHandleContainer: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    dragHandle: {
        width: 36,
        height: 5,
        backgroundColor: '#E5E5EA',
        borderRadius: 2.5,
    },
    dayViewArea: {
        flex: 1,
    },
});
