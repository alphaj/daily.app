import { useRouter } from 'expo-router';
import {
    ChevronLeft,
    MoreHorizontal,
    Plus,
    Zap,
    Menu,
    Flame,
    Check,
    Brain,
    Home,
} from 'lucide-react-native';
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useHabits } from '@/contexts/HabitContext';
import SwipeableRow from '@/components/SwipeableRow';

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
    const insets = useSafeAreaInsets();
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
                <Pressable style={styles.iconButton} onPress={() => router.back()}>
                    <ChevronLeft size={24} color="#000" strokeWidth={1.5} />
                </Pressable>

                <View style={styles.headerCenter}>
                    <Text style={styles.logoText}>daily.app</Text>
                    <Text style={styles.headerTitle}>Habits</Text>
                </View>

                <Pressable style={styles.iconButton}>
                    <MoreHorizontal size={24} color="#000" />
                </Pressable>
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
            <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                <Pressable style={styles.bottomTab} onPress={() => router.replace('/')}>
                    <Home size={24} color="#000" strokeWidth={1.5} />
                </Pressable>
                <Pressable style={styles.bottomTab} onPress={() => router.push('/brain-dump')}>
                    <Brain size={24} color="#000" strokeWidth={1.5} />
                </Pressable>

                <Pressable style={styles.fab} onPress={handleAddPress}>
                    <Plus size={28} color="#000" strokeWidth={1.5} />
                </Pressable>

                <Pressable style={[styles.bottomTab, styles.bottomTabActive]}>
                    <Zap size={24} color="#5856D6" strokeWidth={1.5} />
                </Pressable>
                <Pressable style={styles.bottomTab} onPress={() => router.push('/menu')}>
                    <Menu size={24} color="#000" strokeWidth={1.5} />
                </Pressable>
            </View>
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
        gap: 4,
    },
    logoText: {
        fontSize: 20,
        fontWeight: '800',
        color: '#000',
        letterSpacing: -1.0,
    },
    headerTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#8E8E93',
    },
    content: {
        flex: 1,
    },
    statsCard: {
        marginHorizontal: 24,
        marginTop: 16,
        marginBottom: 24,
        padding: 20,
        backgroundColor: '#F2F2F7',
        borderRadius: 16,
    },
    statsMessage: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        textAlign: 'center',
        marginBottom: 20,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#000',
        letterSpacing: -0.5,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#8E8E93',
        marginTop: 4,
    },
    statDivider: {
        width: 1,
        backgroundColor: '#C7C7CC',
    },
    habitsList: {
        paddingHorizontal: 24,
    },
    habitCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F2F2F7',
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
        borderRadius: 12,
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
    },
    dayColumn: {
        alignItems: 'center',
        gap: 8,
    },
    dayLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#C7C7CC',
        textTransform: 'uppercase',
    },
    dayLabelToday: {
        color: '#5856D6',
    },
    dayDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#E5E5EA',
    },
    dayDotCompleted: {
        backgroundColor: '#34C759',
    },
    dayDotToday: {
        borderWidth: 2,
        borderColor: '#5856D6',
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
        fontSize: 14,
        color: '#8E8E93',
        marginTop: 8,
        textAlign: 'center',
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
