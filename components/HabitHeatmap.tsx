import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Animated,
    Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Flame, Trophy, Star } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CELL_SIZE = Math.floor((SCREEN_WIDTH - 80) / 7);
const CELL_GAP = 4;

interface HabitHeatmapProps {
    completedDates: string[];
    currentStreak: number;
    bestStreak: number;
    createdAt: string;
    onDayPress?: (date: string, completed: boolean) => void;
}

function getMonthData(monthOffset: number = 0): { dates: Date[]; monthLabel: string; year: number } {
    const today = new Date();
    const targetDate = new Date(today.getFullYear(), today.getMonth() - monthOffset, 1);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const dates: Date[] = [];

    // Pad start with empty days to align with weekday
    const startPadding = firstDay.getDay();
    for (let i = 0; i < startPadding; i++) {
        dates.push(null as any);
    }

    // Add all days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
        dates.push(new Date(year, month, day));
    }

    const monthLabel = targetDate.toLocaleDateString('en-US', { month: 'long' });

    return { dates, monthLabel, year };
}

function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

function getCompletionLevel(date: Date, completedDates: string[], createdAt: string): number {
    const dateStr = formatDate(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const createdDate = new Date(createdAt.split('T')[0] + 'T00:00:00');
    createdDate.setHours(0, 0, 0, 0);

    if (date > today) return -1; // Future date
    if (date < createdDate) return -2; // Before habit was created
    if (completedDates.includes(dateStr)) return 1;
    return 0;
}

function isStreakMilestone(date: Date, completedDates: string[]): number | null {
    const dateStr = formatDate(date);
    if (!completedDates.includes(dateStr)) return null;

    // Calculate streak ending on this date
    const sortedDates = [...completedDates].sort();
    const dateIndex = sortedDates.indexOf(dateStr);
    if (dateIndex === -1) return null;

    let streak = 1;
    for (let i = dateIndex - 1; i >= 0; i--) {
        const prevDate = new Date(sortedDates[i] + 'T00:00:00');
        const currentDate = new Date(sortedDates[i + 1] + 'T00:00:00');
        const diffDays = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

        if (diffDays === 1) {
            streak++;
        } else {
            break;
        }
    }

    // Check for milestones
    if (streak === 100) return 100;
    if (streak === 30) return 30;
    if (streak === 7) return 7;

    return null;
}

function MonthGrid({
    monthOffset,
    completedDates,
    createdAt,
    onDayPress
}: {
    monthOffset: number;
    completedDates: string[];
    createdAt: string;
    onDayPress?: (date: string, completed: boolean) => void;
}) {
    const { dates, monthLabel, year } = getMonthData(monthOffset);
    const todayStr = formatDate(new Date());

    return (
        <View style={styles.monthContainer}>
            <View style={styles.monthHeader}>
                <Text style={styles.monthLabel}>{monthLabel}</Text>
                <Text style={styles.yearLabel}>{year}</Text>
            </View>

            {/* Weekday headers */}
            <View style={styles.weekdayRow}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <Text key={i} style={styles.weekdayLabel}>{day}</Text>
                ))}
            </View>

            {/* Date grid */}
            <View style={styles.datesGrid}>
                {dates.map((date, index) => {
                    if (!date) {
                        return <View key={`empty-${index}`} style={styles.emptyCell} />;
                    }

                    const dateStr = formatDate(date);
                    const level = getCompletionLevel(date, completedDates, createdAt);
                    const isToday = dateStr === todayStr;
                    const milestone = isStreakMilestone(date, completedDates);

                    const handlePress = () => {
                        if (level >= 0) {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            onDayPress?.(dateStr, level === 1);
                        }
                    };

                    return (
                        <Pressable
                            key={dateStr}
                            style={[
                                styles.dateCell,
                                level === 1 && styles.dateCellCompleted,
                                level === 0 && styles.dateCellMissed,
                                level === -1 && styles.dateCellFuture,
                                level === -2 && styles.dateCellBeforeCreation,
                                isToday && styles.dateCellToday,
                            ]}
                            onPress={handlePress}
                            disabled={level === -1 || level === -2}
                        >
                            <Text style={[
                                styles.dateText,
                                level === 1 && styles.dateTextCompleted,
                                level === -1 && styles.dateTextFuture,
                                level === -2 && styles.dateTextBeforeCreation,
                                isToday && styles.dateTextToday,
                            ]}>
                                {date.getDate()}
                            </Text>
                            {milestone && (
                                <View style={styles.milestoneBadge}>
                                    {milestone >= 30 ? (
                                        <Trophy size={10} color="#FFD700" />
                                    ) : (
                                        <Flame size={10} color="#FF9500" />
                                    )}
                                </View>
                            )}
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

function StreakDisplay({ currentStreak, bestStreak }: { currentStreak: number; bestStreak: number }) {
    const glowAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (currentStreak > 0) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(glowAnim, {
                        toValue: 1,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(glowAnim, {
                        toValue: 0,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }
    }, [currentStreak, glowAnim]);

    const glowOpacity = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.8],
    });

    return (
        <View style={styles.streakContainer}>
            <View style={styles.streakCard}>
                {currentStreak > 0 && (
                    <Animated.View style={[styles.streakGlow, { opacity: glowOpacity }]} />
                )}
                <View style={styles.streakIcon}>
                    <Flame size={28} color="#FF9500" />
                </View>
                <Text style={styles.streakValue}>{currentStreak}</Text>
                <Text style={styles.streakLabel}>Current Streak</Text>
            </View>

            <View style={styles.streakCard}>
                <View style={[styles.streakIcon, styles.bestStreakIcon]}>
                    <Trophy size={24} color="#FFD700" />
                </View>
                <Text style={styles.streakValue}>{bestStreak}</Text>
                <Text style={styles.streakLabel}>Best Streak</Text>
            </View>
        </View>
    );
}

export default function HabitHeatmap({
    completedDates,
    currentStreak,
    bestStreak,
    createdAt,
    onDayPress
}: HabitHeatmapProps) {
    // Calculate completion stats
    const totalDays = completedDates.length;

    // Find best month
    const monthCounts: Record<string, number> = {};
    completedDates.forEach(date => {
        const monthKey = date.substring(0, 7);
        monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
    });

    const bestMonth = Object.entries(monthCounts).sort((a, b) => b[1] - a[1])[0];
    const bestMonthLabel = bestMonth
        ? new Date(bestMonth[0] + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : 'N/A';

    // Find most consistent day
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    completedDates.forEach(date => {
        const dayOfWeek = new Date(date + 'T00:00:00').getDay();
        dayCounts[dayOfWeek]++;
    });
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const bestDayIndex = dayCounts.indexOf(Math.max(...dayCounts));
    const bestDay = dayCounts[bestDayIndex] > 0 ? dayNames[bestDayIndex] : 'N/A';

    return (
        <View style={styles.container}>
            {/* Streak Display */}
            <StreakDisplay currentStreak={currentStreak} bestStreak={bestStreak} />

            {/* Heatmap Calendar */}
            <View style={styles.heatmapContainer}>
                <Text style={styles.sectionTitle}>Activity</Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.monthsScroll}
                    snapToInterval={SCREEN_WIDTH - 48}
                    decelerationRate="fast"
                >
                    {[0, 1, 2].map(offset => (
                        <MonthGrid
                            key={offset}
                            monthOffset={offset}
                            completedDates={completedDates}
                            createdAt={createdAt}
                            onDayPress={onDayPress}
                        />
                    ))}
                </ScrollView>
            </View>

            {/* Insights */}
            <View style={styles.insightsContainer}>
                <Text style={styles.sectionTitle}>Insights</Text>
                <View style={styles.insightsRow}>
                    <View style={styles.insightCard}>
                        <Star size={20} color="#5856D6" />
                        <Text style={styles.insightValue}>{totalDays}</Text>
                        <Text style={styles.insightLabel}>Days Completed</Text>
                    </View>
                    <View style={styles.insightCard}>
                        <Text style={styles.insightEmoji}>📅</Text>
                        <Text style={styles.insightValue}>{bestDay}</Text>
                        <Text style={styles.insightLabel}>Best Day</Text>
                    </View>
                    <View style={styles.insightCard}>
                        <Text style={styles.insightEmoji}>🏆</Text>
                        <Text style={styles.insightValue}>{bestMonthLabel}</Text>
                        <Text style={styles.insightLabel}>Best Month</Text>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    streakContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    streakCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    streakGlow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#FF9500',
        borderRadius: 16,
    },
    streakIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FFF5E6',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    bestStreakIcon: {
        backgroundColor: '#FFFBE6',
    },
    streakValue: {
        fontSize: 32,
        fontWeight: '800',
        color: '#000',
        letterSpacing: -1,
    },
    streakLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#8E8E93',
        marginTop: 4,
    },
    heatmapContainer: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6D6D72',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: -0.2,
        marginLeft: 16, // Align with inset grouped content
    },
    monthsScroll: {
        paddingRight: 16,
        paddingLeft: 4, // Add some left padding for the first item shadow if needed
    },
    monthContainer: {
        width: SCREEN_WIDTH - 48,
        marginRight: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    monthHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    monthLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
    yearLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#8E8E93',
    },
    weekdayRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 8,
    },
    weekdayLabel: {
        width: CELL_SIZE,
        textAlign: 'center',
        fontSize: 11,
        fontWeight: '600',
        color: '#8E8E93',
    },
    datesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    emptyCell: {
        width: CELL_SIZE,
        height: CELL_SIZE,
        margin: CELL_GAP / 2,
    },
    dateCell: {
        width: CELL_SIZE,
        height: CELL_SIZE,
        margin: CELL_GAP / 2,
        borderRadius: CELL_SIZE / 2, // Circular for iOS calendar look
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    dateCellCompleted: {
        backgroundColor: '#5856D6',
    },
    dateCellMissed: {
        // backgroundColor: '#F2F2F7', // Optional: show missed spots?
    },
    dateCellFuture: {
        // opacity: 0.5,
    },
    dateCellBeforeCreation: {
        // opacity: 0.3,
    },
    dateCellToday: {
        backgroundColor: '#F2F2F7',
    },
    dateText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#000',
    },
    dateTextCompleted: {
        color: '#fff',
        fontWeight: '600',
    },
    dateTextFuture: {
        color: '#D1D1D6',
    },
    dateTextBeforeCreation: {
        color: '#E5E5EA',
    },
    dateTextToday: {
        color: '#5856D6', // Today text color when not completed
        fontWeight: '700',
    },
    milestoneBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
        elevation: 2,
        zIndex: 1,
    },
    insightsContainer: {
        marginBottom: 20,
    },
    insightsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    insightCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    insightEmoji: {
        fontSize: 20,
        marginBottom: 4,
    },
    insightValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000',
        marginTop: 8,
        textAlign: 'center',
    },
    insightLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#8E8E93',
        marginTop: 4,
        textAlign: 'center',
    },
});
