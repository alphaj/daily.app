import React, { useMemo, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
} from 'react-native';
import { format, isToday } from 'date-fns';
import { Plus, Trash2 } from 'lucide-react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import type { CalendarEventDisplay } from '@/hooks/useCalendarEventAggregation';
import { parseTimeToHour } from '@/hooks/useCalendarEventAggregation';

const HOUR_HEIGHT = 60;

interface InlineDayViewProps {
    selectedDate: Date | null;
    allDayEvents: CalendarEventDisplay[];
    timedEvents: CalendarEventDisplay[];
    selectedDateEvents: CalendarEventDisplay[];
    onEventToggle: (event: CalendarEventDisplay) => void;
    onDeleteEvent: (eventId: string) => void;
    onAddEvent: (hour?: number) => void;
}

const formatHour = (hour: number): string => {
    if (hour === 0 || hour === 24) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
};

export function InlineDayView({
    selectedDate,
    allDayEvents,
    timedEvents,
    selectedDateEvents,
    onEventToggle,
    onDeleteEvent,
    onAddEvent,
}: InlineDayViewProps) {
    const hours = useMemo(() => {
        const result: number[] = [];
        for (let i = 6; i <= 23; i++) {
            result.push(i);
        }
        return result;
    }, []);

    // Entry animation shared values
    const entryTranslateY = useSharedValue(0);
    const entryOpacity = useSharedValue(1);

    // Auto-scroll ref
    const scrollViewRef = useRef<ScrollView>(null);

    // Animate on date change
    useEffect(() => {
        if (!selectedDate) return;
        entryTranslateY.value = 20;
        entryOpacity.value = 0;
        entryTranslateY.value = withSpring(0, { damping: 18, stiffness: 200 });
        entryOpacity.value = withTiming(1, { duration: 200 });
    }, [selectedDate?.getTime()]);

    // Auto-scroll to current time when today is selected
    useEffect(() => {
        if (!selectedDate || !isToday(selectedDate)) return;
        const currentHour = new Date().getHours();
        const offset = Math.max(0, (currentHour - 6) * HOUR_HEIGHT - 40);
        const timer = setTimeout(() => {
            scrollViewRef.current?.scrollTo({ y: offset, animated: true });
        }, 300);
        return () => clearTimeout(timer);
    }, [selectedDate?.getTime()]);

    const entryStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: entryTranslateY.value }],
        opacity: entryOpacity.value,
    }));

    if (!selectedDate) return null;

    const isTodayDate = isToday(selectedDate);

    return (
        <Animated.View style={[styles.container, entryStyle]}>
            {/* Date title row */}
            <View style={styles.dateTitleRow}>
                <Text style={styles.dateTitle}>
                    {format(selectedDate, 'EEEE, MMMM d')}
                </Text>
                <Pressable onPress={() => onAddEvent()} hitSlop={15} style={styles.addButton}>
                    <Plus size={22} color="#007AFF" />
                </Pressable>
            </View>

            {/* All Day Events */}
            {allDayEvents.length > 0 && (
                <View style={styles.allDaySection}>
                    <Text style={styles.allDaySectionTitle}>ALL DAY</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.allDayScrollContent}
                    >
                        {allDayEvents.map(event => (
                            <Pressable
                                key={event.id}
                                style={[
                                    styles.allDayChip,
                                    {
                                        backgroundColor: event.color,
                                        opacity: event.completed ? 1 : 0.5,
                                    }
                                ]}
                                onPress={() => onEventToggle(event)}
                            >
                                <Text style={styles.allDayChipText} numberOfLines={1}>
                                    {event.emoji ? `${event.emoji} ` : ''}{event.title}
                                </Text>
                            </Pressable>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Timeline */}
            <ScrollView
                ref={scrollViewRef}
                style={styles.timelineScroll}
                contentContainerStyle={styles.timelineContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.timeline}>
                    {hours.map(hour => (
                        <Pressable
                            key={hour}
                            style={styles.timelineRow}
                            onPress={() => onAddEvent(hour)}
                        >
                            <Text style={styles.timelineHour}>{formatHour(hour)}</Text>
                            <View style={styles.timelineLine} />
                        </Pressable>
                    ))}

                    {/* Timed event blocks */}
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
                                onLongPress={() => event.isCustomEvent && onDeleteEvent(event.originalId)}
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
                    {isTodayDate && (
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
                    <Pressable style={styles.emptyAddButton} onPress={() => onAddEvent()}>
                        <Plus size={16} color="#fff" />
                        <Text style={styles.emptyAddButtonText}>Add Event</Text>
                    </Pressable>
                </View>
            )}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    dateTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    dateTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
    },
    addButton: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    allDaySection: {
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E5E5EA',
    },
    allDaySectionTitle: {
        fontSize: 10,
        fontWeight: '600',
        color: '#8E8E93',
        letterSpacing: 0.5,
        marginBottom: 6,
        paddingHorizontal: 16,
        textTransform: 'uppercase',
    },
    allDayScrollContent: {
        paddingHorizontal: 16,
    },
    allDayChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 8,
        marginRight: 6,
    },
    allDayChipText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#fff',
        letterSpacing: -0.2,
    },
    timelineScroll: {
        flex: 1,
    },
    timelineContent: {
        paddingTop: 8,
        paddingBottom: 100,
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
        width: 50,
        fontSize: 10,
        color: '#8E8E93',
        fontWeight: '400',
        letterSpacing: 0.2,
        opacity: 0.85,
        transform: [{ translateY: -5 }],
    },
    timelineLine: {
        flex: 1,
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#E5E5EA',
        opacity: 0.6,
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
        backgroundColor: '#FF3B30',
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
