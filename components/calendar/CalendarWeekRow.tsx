import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { format, isSameMonth, isToday, isSameDay } from 'date-fns';
import { CalendarDayCell } from './CalendarDayCell';
import type { CalendarEventDisplay } from '@/hooks/useCalendarEventAggregation';

interface CalendarWeekRowProps {
    week: Date[];
    currentMonth: Date;
    selectedDate: Date | null;
    eventsMap: Record<string, CalendarEventDisplay[]>;
    onDatePress: (date: Date) => void;
}

function CalendarWeekRowInner({
    week,
    currentMonth,
    selectedDate,
    eventsMap,
    onDatePress,
}: CalendarWeekRowProps) {
    return (
        <View style={styles.row}>
            {week.map((date, i) => {
                const dateStr = format(date, 'yyyy-MM-dd');
                return (
                    <CalendarDayCell
                        key={i}
                        date={date}
                        isCurrentMonth={isSameMonth(date, currentMonth)}
                        isToday={isToday(date)}
                        isSelected={selectedDate ? isSameDay(date, selectedDate) : false}
                        events={eventsMap[dateStr] || []}
                        onPress={onDatePress}
                    />
                );
            })}
        </View>
    );
}

export const CalendarWeekRow = memo(CalendarWeekRowInner);

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
    },
});
