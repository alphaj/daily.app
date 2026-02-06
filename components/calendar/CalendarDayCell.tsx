import React, { memo, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { format } from 'date-fns';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import type { CalendarEventDisplay } from '@/hooks/useCalendarEventAggregation';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CELL_WIDTH = SCREEN_WIDTH / 7;

interface CalendarDayCellProps {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
    events: CalendarEventDisplay[];
    onPress: (date: Date) => void;
}

function CalendarDayCellInner({
    date,
    isCurrentMonth,
    isToday,
    isSelected,
    events,
    onPress,
}: CalendarDayCellProps) {
    const pills = events.filter(e => e.type === 'event' || e.type === 'task');
    const dots = events.filter(e => e.type === 'habit' || e.type === 'supplement' || e.type === 'grocery');
    const visiblePills = pills.slice(0, 2);
    const morePillsCount = pills.length - 2;

    // Tap animation shared values
    const tapScale = useSharedValue(1);
    const selectionScale = useSharedValue(isSelected ? 1 : 0);

    // Animate selection circle when isSelected changes
    useEffect(() => {
        if (isSelected) {
            selectionScale.value = withSpring(1, { damping: 14, stiffness: 220 });
        } else {
            selectionScale.value = withTiming(0, { duration: 150 });
        }
    }, [isSelected]);

    const tapGesture = Gesture.Tap()
        .onBegin(() => {
            tapScale.value = withTiming(0.88, { duration: 80 });
            Haptics.selectionAsync();
        })
        .onFinalize((_event, success) => {
            tapScale.value = withSpring(1, { damping: 12, stiffness: 200 });
            if (success) {
                onPress(date);
            }
        });

    const cellAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: tapScale.value }],
    }));

    const selectionCircleStyle = useAnimatedStyle(() => ({
        transform: [{ scale: selectionScale.value }],
        opacity: selectionScale.value,
    }));

    const getCircleBgColor = () => {
        if (isToday && isSelected) return '#FF3B30';
        if (isSelected && !isToday) return '#E5E5EA';
        return 'transparent';
    };

    const getTextStyle = () => {
        if (isToday && isSelected) return styles.dateTextTodaySelected;
        if (isToday && !isSelected) return styles.dateTextToday;
        if (isSelected) return styles.dateTextSelected;
        if (!isCurrentMonth) return styles.dateTextOtherMonth;
        return null;
    };

    return (
        <GestureDetector gesture={tapGesture}>
            <Animated.View style={[styles.cell, cellAnimatedStyle]}>
                <View style={styles.dateCircleContainer}>
                    <Animated.View
                        style={[
                            styles.dateCircleBg,
                            { backgroundColor: getCircleBgColor() },
                            selectionCircleStyle,
                        ]}
                    />
                    <Text style={[styles.dateText, getTextStyle()]}>
                        {format(date, 'd')}
                    </Text>
                </View>

                <View style={styles.pillsContainer}>
                    {visiblePills.map(pill => (
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
                        {dots.slice(0, 5).map(dot => (
                            <View
                                key={dot.id}
                                style={[styles.dot, { backgroundColor: dot.completed ? dot.color : dot.color + '40' }]}
                            />
                        ))}
                        {dots.length > 5 && <View style={[styles.dot, { backgroundColor: '#8E8E93' }]} />}
                    </View>
                )}
            </Animated.View>
        </GestureDetector>
    );
}

export const CalendarDayCell = memo(CalendarDayCellInner, (prev, next) => {
    return (
        prev.date.getTime() === next.date.getTime() &&
        prev.isCurrentMonth === next.isCurrentMonth &&
        prev.isToday === next.isToday &&
        prev.isSelected === next.isSelected &&
        prev.events === next.events
    );
});

const styles = StyleSheet.create({
    cell: {
        width: CELL_WIDTH,
        alignItems: 'center',
        paddingTop: 6,
        gap: 3,
    },
    dateCircleContainer: {
        width: 34,
        height: 34,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateCircleBg: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 17,
    },
    dateText: {
        fontSize: 17,
        fontWeight: '400',
        color: '#000',
    },
    dateTextOtherMonth: {
        color: '#D1D1D6',
    },
    dateTextTodaySelected: {
        color: '#fff',
        fontWeight: '600',
    },
    dateTextToday: {
        color: '#FF3B30',
        fontWeight: '600',
    },
    dateTextSelected: {
        color: '#000',
        fontWeight: '600',
    },
    pillsContainer: {
        width: '100%',
        paddingHorizontal: 3,
        alignItems: 'center',
        gap: 2,
    },
    eventPill: {
        width: '100%',
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
        minHeight: 16,
        justifyContent: 'center',
    },
    eventText: {
        fontSize: 9,
        fontWeight: '600',
        color: '#fff',
        textAlign: 'center',
        letterSpacing: -0.2,
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
});
