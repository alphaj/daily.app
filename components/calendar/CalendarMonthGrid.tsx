import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
    useAnimatedStyle,
    interpolate,
    Extrapolation,
    SharedValue,
} from 'react-native-reanimated';
import { CalendarWeekRow } from './CalendarWeekRow';
import type { CalendarEventDisplay } from '@/hooks/useCalendarEventAggregation';

const WEEK_ROW_HEIGHT = 64;

interface CalendarMonthGridProps {
    weeks: Date[][];
    currentMonth: Date;
    selectedDate: Date | null;
    eventsMap: Record<string, CalendarEventDisplay[]>;
    onDatePress: (date: Date) => void;
    collapseProgress: SharedValue<number>;
    activeWeekIndex: SharedValue<number>;
}

function AnimatedWeekRow({
    weekIndex,
    collapseProgress,
    activeWeekIndex,
    children,
}: {
    weekIndex: number;
    collapseProgress: SharedValue<number>;
    activeWeekIndex: SharedValue<number>;
    children: React.ReactNode;
}) {
    const animatedStyle = useAnimatedStyle(() => {
        const isActive = weekIndex === activeWeekIndex.value;
        if (isActive) {
            return { height: WEEK_ROW_HEIGHT, opacity: 1 };
        }

        const distance = Math.abs(weekIndex - activeWeekIndex.value);
        // Further weeks start collapsing earlier in the progress range
        const staggerOffset = (1 - distance / 5) * 0.25;
        const rangeEnd = staggerOffset + 0.75;

        return {
            height: interpolate(
                collapseProgress.value,
                [staggerOffset, rangeEnd],
                [WEEK_ROW_HEIGHT, 0],
                Extrapolation.CLAMP
            ),
            opacity: interpolate(
                collapseProgress.value,
                [staggerOffset, staggerOffset + (rangeEnd - staggerOffset) * 0.5, rangeEnd],
                [1, 0.6, 0],
                Extrapolation.CLAMP
            ),
            overflow: 'hidden' as const,
        };
    });

    return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}

export function CalendarMonthGrid({
    weeks,
    currentMonth,
    selectedDate,
    eventsMap,
    onDatePress,
    collapseProgress,
    activeWeekIndex,
}: CalendarMonthGridProps) {
    const gridAnimatedStyle = useAnimatedStyle(() => ({
        height: interpolate(
            collapseProgress.value,
            [0, 1],
            [WEEK_ROW_HEIGHT * 6, WEEK_ROW_HEIGHT],
            Extrapolation.CLAMP
        ),
        overflow: 'hidden' as const,
    }));

    return (
        <Animated.View style={[styles.grid, gridAnimatedStyle]}>
            {weeks.map((week, index) => (
                <AnimatedWeekRow
                    key={index}
                    weekIndex={index}
                    collapseProgress={collapseProgress}
                    activeWeekIndex={activeWeekIndex}
                >
                    <CalendarWeekRow
                        week={week}
                        currentMonth={currentMonth}
                        selectedDate={selectedDate}
                        eventsMap={eventsMap}
                        onDatePress={onDatePress}
                    />
                </AnimatedWeekRow>
            ))}
        </Animated.View>
    );
}

export { WEEK_ROW_HEIGHT };

const styles = StyleSheet.create({
    grid: {
        backgroundColor: '#fff',
    },
});
