import { useRouter } from 'expo-router';
import {
    Zap,
    Flame,
    Check,
} from 'lucide-react-native';
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useHabits } from '@/contexts/HabitContext';
import SwipeableRow from '@/components/SwipeableRow';
import { BottomNavBar } from '@/components/BottomNavBar';

function HabitItem({
    habit,
    isCompletedToday,
    getWeeklyProgress,
    onToggle,
    onDelete,
    onPress,
}: {
    habit: any;
    isCompletedToday: (h: any) => boolean;
    getWeeklyProgress: (h: any) => any[];
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onPress: (id: string) => void;
}) {
    const completed = isCompletedToday(habit);
    const weekProgress = getWeeklyProgress(habit);

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onToggle(habit.id);
    };

    const handleDelete = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onDelete(habit.id);
    };

    const handleCardPress = () => {
        Haptics.selectionAsync();
        onPress(habit.id);
    };

    return (
        <SwipeableRow onDelete={handleDelete}>
            <Pressable style={styles.habitCard} onPress={handleCardPress}>
                <View style={styles.habitHeader}>
                    {habit.emoji ? (
                        <Pressable
                            style={[styles.habitEmojiContainer, completed && styles.habitEmojiContainerCompleted]}
                            onPress={handlePress}
                        >
                            <Text style={styles.habitEmoji}>{habit.emoji}</Text>
                            {completed && (
                                <View style={styles.emojiCheckmark}>
                                    <Check size={12} color="#fff" strokeWidth={3} />
                                </View>
                            )}
                        </Pressable>
                    ) : (
                        <Pressable
                            style={[styles.habitCheckbox, completed && styles.habitCheckboxCompleted]}
                            onPress={handlePress}
                        >
                            {completed && <Check size={18} color="#fff" strokeWidth={3} />}
                        </Pressable>
                    )}
                    <Text style={[styles.habitName, completed && styles.habitNameCompleted]}>
                        {habit.name}
                    </Text>
                    {habit.currentStreak > 0 && (
                        <View style={styles.streakBadge}>
                            <Flame size={14} color="#FF9500" />
                            <Text style={styles.streakText}>{habit.currentStreak}</Text>
                        </View>
                    )}
                </View>

                {/* Weekly Progress */}
                <View style={styles.weekProgress}>
                    {weekProgress.map((day, index) => (
                        <View key={index} style={styles.dayColumn}>
                            <Text style={[styles.dayLabel, day.isToday && styles.dayLabelToday]}>
                                {day.dayName}
                            </Text>
                            <View
                                style={[
                                    styles.dayDot,
                                    day.completed && styles.dayDotCompleted,
                                    day.isToday && styles.dayDotToday,
                                ]}
                            />
                        </View>
                    ))}
                </View>
            </Pressable>
        </SwipeableRow>
    );
}

export default function HabitsScreen() {
    const router = useRouter();
    const {
        habits,
        toggleHabitCompletion,
        isCompletedToday,
        getWeeklyProgress,
        getMotivationalMessage,
        getOverallStats,
        deleteHabit,
    } = useHabits();

    const stats = getOverallStats;
    const message = getMotivationalMessage();

    const handleAddPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/add-habit');
    };

    const handleHabitPress = (id: string) => {
        router.push({ pathname: '/habit-detail', params: { id } });
    };

    const completedToday = habits.filter((h) => isCompletedToday(h)).length;
    const totalHabits = habits.length;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerCenter}>
                    <Text style={styles.logoText}>daily.app</Text>
                    <Text style={styles.headerTitle}>Habits</Text>
                </View>


            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Stats Card */}
                <View style={styles.statsCard}>
                    <Text style={styles.statsMessage}>{message}</Text>
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>
                                {completedToday}/{totalHabits}
                            </Text>
                            <Text style={styles.statLabel}>Today</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{stats.longestStreak}</Text>
                            <Text style={styles.statLabel}>Best Streak</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>
                                {Math.round(stats.weeklyCompletionRate * 100)}%
                            </Text>
                            <Text style={styles.statLabel}>This Week</Text>
                        </View>
                    </View>
                </View>

                {/* Habits List */}
                <View style={styles.habitsList}>
                    {habits.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Zap size={48} color="#C7C7CC" strokeWidth={1} />
                            <Text style={styles.emptyTitle}>No habits yet</Text>
                            <Text style={styles.emptySubtitle}>
                                Tap the + button to add your first habit
                            </Text>
                        </View>
                    ) : (
                        habits.map((habit) => (
                            <HabitItem
                                key={habit.id}
                                habit={habit}
                                isCompletedToday={isCompletedToday}
                                getWeeklyProgress={getWeeklyProgress}
                                onToggle={toggleHabitCompletion}
                                onDelete={deleteHabit}
                                onPress={handleHabitPress}
                            />
                        ))
                    )}
                </View>
            </ScrollView>

            {/* Bottom Bar */}
            <BottomNavBar onFabPress={handleAddPress} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7', // System Gray 6
    },
    header: {
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    headerCenter: {
        alignItems: 'center',
        gap: 2,
    },
    logoText: {
        fontSize: 16, // Slightly smaller
        fontWeight: '800',
        color: '#000',
        letterSpacing: -0.5,
    },
    headerTitle: {
        fontSize: 13,
        fontWeight: '500',
        color: '#8E8E93',
    },
    content: {
        flex: 1,
    },
    statsCard: {
        marginHorizontal: 20,
        marginTop: 12,
        marginBottom: 24,
        padding: 24,
        backgroundColor: '#fff', // White card
        borderRadius: 24,
        // iOS Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 4,
    },
    statsMessage: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        textAlign: 'center',
        marginBottom: 24,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 26,
        fontWeight: '800',
        color: '#000',
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#8E8E93',
        textTransform: 'uppercase', // Styled like iOS captions
        letterSpacing: 0.5,
    },
    statDivider: {
        width: 1,
        backgroundColor: '#E5E5EA', // Lighter divider
    },
    habitsList: {
        paddingHorizontal: 20,
    },
    habitCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        // Removed border, added shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    habitHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    habitCheckbox: {
        width: 28,
        height: 28,
        borderRadius: 14,
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
    habitEmojiContainer: {
        width: 44,
        height: 44,
        borderRadius: 14, // Matches general rounding
        backgroundColor: '#F5F5FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        position: 'relative',
    },
    habitEmojiContainerCompleted: {
        backgroundColor: '#E8FFE8',
    },
    habitEmoji: {
        fontSize: 24,
    },
    emojiCheckmark: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#34C759',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    habitName: {
        flex: 1,
        fontSize: 17,
        fontWeight: '600',
        color: '#000',
    },
    habitNameCompleted: {
        color: '#8E8E93',
    },
    streakBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF5E6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    streakText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FF9500',
    },
    weekProgress: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 8, // Added padding for better distribution
    },
    dayColumn: {
        alignItems: 'center',
        gap: 8,
    },
    dayLabel: {
        fontSize: 10, // Smaller labels
        fontWeight: '700',
        color: '#C7C7CC',
        textTransform: 'uppercase',
    },
    dayLabelToday: {
        color: '#5856D6',
    },
    dayDot: {
        width: 8, // Slightly smaller dots
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E5E5EA',
    },
    dayDotCompleted: {
        backgroundColor: '#34C759',
    },
    dayDotToday: {
        borderWidth: 2,
        borderColor: '#5856D6',
        width: 10, // Active day slightly larger
        height: 10,
        borderRadius: 5,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 15,
        color: '#8E8E93',
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 22,
        maxWidth: 240,
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
        marginTop: -16,
    },
});
