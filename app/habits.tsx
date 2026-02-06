import { useRouter } from 'expo-router';
import {
    Zap,
    Check,
    Plus,
    TrendingUp,
    TrendingDown,
    Minus,
    Trophy,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Alert,
} from 'react-native';
import Animated, { FadeInDown, FadeOutRight, LinearTransition } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useHabits, getHabitRhythm } from '@/contexts/HabitContext';
import SwipeableRow from '@/components/SwipeableRow';
import { AmbientBackground } from '@/components/AmbientBackground';
import { BottomNavBar } from '@/components/BottomNavBar';
import type { Habit, DayCompletion, HabitType } from '@/types/habit';

function HabitItem({
    habit,
    isCompletedToday,
    getWeeklyProgress,
    onToggle,
    onDelete,
    onPress,
}: {
    habit: Habit;
    isCompletedToday: (h: Habit) => boolean;
    getWeeklyProgress: (h: Habit) => DayCompletion[];
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onPress: (id: string) => void;
}) {
    const completed = isCompletedToday(habit);
    const weekProgress = getWeeklyProgress(habit);
    const rhythm = getHabitRhythm(habit);

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onToggle(habit.id);
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Habit',
            `Are you sure you want to delete "${habit.name}"? This will remove all your progress.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        onDelete(habit.id);
                    },
                },
            ]
        );
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
                    {rhythm.thisMonth.rate > 0 && (
                        <View style={[
                            styles.rhythmPill,
                            rhythm.thisMonth.rate >= 0.8 ? styles.rhythmPillGreen :
                            rhythm.thisMonth.rate >= 0.5 ? styles.rhythmPillOrange :
                            styles.rhythmPillGray
                        ]}>
                            {rhythm.trend === 'rising' ? <TrendingUp size={12} color={rhythm.thisMonth.rate >= 0.8 ? '#34C759' : '#FF9500'} /> :
                             rhythm.trend === 'declining' ? <TrendingDown size={12} color="#8E8E93" /> :
                             <Minus size={12} color="#8E8E93" />}
                            <Text style={[
                                styles.rhythmPillText,
                                rhythm.thisMonth.rate >= 0.8 ? { color: '#34C759' } :
                                rhythm.thisMonth.rate >= 0.5 ? { color: '#FF9500' } :
                                { color: '#8E8E93' }
                            ]}>
                                {Math.round(rhythm.thisMonth.rate * 100)}%
                            </Text>
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
        buildingHabits,
        breakingHabits,
        toggleHabitCompletion,
        isCompletedToday,
        getWeeklyProgress,
        getMotivationalMessage,
        getOverallStats,
        deleteHabit,
        logSlip,
    } = useHabits();

    const [activeTab, setActiveTab] = useState<HabitType>('building');

    // Filter habits based on active tab
    const filteredHabits = activeTab === 'building' ? buildingHabits : breakingHabits;

    const stats = getOverallStats;
    const message = getMotivationalMessage();

    const handleAddPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/add-habit');
    };

    const handleHabitPress = (id: string) => {
        router.push({ pathname: '/habit-detail', params: { id } });
    };

    const completedToday = filteredHabits.filter((h) => isCompletedToday(h)).length;
    const totalHabits = filteredHabits.length;

    return (
        <View style={{ flex: 1 }}>
            <AmbientBackground />
            <SafeAreaView style={styles.container} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Zap size={24} color="#000" strokeWidth={2} />
                        <Text style={styles.headerTitle}>Habits</Text>
                    </View>
                    <View style={styles.headerButtons}>
                        <Pressable
                            style={styles.headerButton}
                            onPress={handleAddPress}
                            hitSlop={10}
                        >
                            <Plus size={26} color="#000" />
                        </Pressable>
                    </View>
                </View>

                <ScrollView
                    style={[styles.content, { backgroundColor: 'transparent' }]}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100, backgroundColor: 'transparent' }}
                >
                    {/* Segmented Control */}
                    <View style={styles.segmentedControl}>
                        <Pressable
                            style={[
                                styles.segmentButton,
                                activeTab === 'building' && styles.segmentButtonActive,
                            ]}
                            onPress={() => {
                                Haptics.selectionAsync();
                                setActiveTab('building');
                            }}
                        >
                            <Text style={[
                                styles.segmentText,
                                activeTab === 'building' && styles.segmentTextActive
                            ]}>
                                🌱 Build
                            </Text>
                        </Pressable>
                        <Pressable
                            style={[
                                styles.segmentButton,
                                activeTab === 'breaking' && styles.segmentButtonActiveBreaking,
                            ]}
                            onPress={() => {
                                Haptics.selectionAsync();
                                setActiveTab('breaking');
                            }}
                        >
                            <Text style={[
                                styles.segmentText,
                                activeTab === 'breaking' && styles.segmentTextActiveBreaking
                            ]}>
                                🚫 Break
                            </Text>
                        </Pressable>
                    </View>

                    {/* Stats Card */}
                    <View style={[styles.statsCard, activeTab === 'breaking' && styles.statsCardBreaking]}>
                        <Text style={styles.statsMessage}>
                            {filteredHabits.length === 0
                                ? (activeTab === 'building' ? 'Start building good habits' : 'No habits to break yet')
                                : message}
                        </Text>
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>
                                    {completedToday}/{totalHabits}
                                </Text>
                                <Text style={styles.statLabel}>This Week</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>
                                    {Math.round(stats.weeklyCompletionRate * 100)}%
                                </Text>
                                <Text style={styles.statLabel}>Monthly</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <Trophy size={16} color="#FFD700" />
                                    <Text style={[styles.statValue, { fontSize: 20 }]}>{stats.longestStreak}</Text>
                                </View>
                                <Text style={styles.statLabel}>Best Streak</Text>
                            </View>
                        </View>
                    </View>

                    {/* Habits List */}
                    <View style={styles.habitsList}>
                        {filteredHabits.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Zap size={48} color="#C7C7CC" strokeWidth={1} />
                                <Text style={styles.emptyTitle}>
                                    {activeTab === 'building' ? 'No habits to build' : 'No habits to break'}
                                </Text>
                                <Text style={styles.emptySubtitle}>
                                    {activeTab === 'building'
                                        ? 'Tap the + button to add a new habit to build'
                                        : 'Tap the + button to add a habit you want to stop'}
                                </Text>
                            </View>
                        ) : (
                            filteredHabits.map((habit) => (
                                <Animated.View
                                    key={habit.id}
                                    entering={FadeInDown.duration(300)}
                                    exiting={FadeOutRight.duration(250)}
                                    layout={LinearTransition.springify().damping(18).stiffness(120)}
                                >
                                    <HabitItem
                                        habit={habit}
                                        isCompletedToday={isCompletedToday}
                                        getWeeklyProgress={getWeeklyProgress}
                                        onToggle={toggleHabitCompletion}
                                        onDelete={deleteHabit}
                                        onPress={handleHabitPress}
                                    />
                                </Animated.View>
                            ))
                        )}
                    </View>
                </ScrollView>

                {/* Bottom Bar */}
                <BottomNavBar onFabPress={handleAddPress} />
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#000',
        letterSpacing: -0.5,
    },
    headerButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    headerButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    content: {
        flex: 1,
    },
    // Segmented Control Styles
    segmentedControl: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginTop: 12,
        backgroundColor: '#E5E5EA',
        borderRadius: 12,
        padding: 4,
    },
    segmentButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    segmentButtonActive: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    segmentButtonActiveBreaking: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    segmentText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8E8E93',
    },
    segmentTextActive: {
        color: '#34C759',
    },
    segmentTextActiveBreaking: {
        color: '#FF6B6B',
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
    statsCardBreaking: {
        borderWidth: 1,
        borderColor: '#FFE5E5',
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
    rhythmPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 3,
    },
    rhythmPillGreen: {
        backgroundColor: '#E8FFE8',
    },
    rhythmPillOrange: {
        backgroundColor: '#FFF5E6',
    },
    rhythmPillGray: {
        backgroundColor: '#F2F2F7',
    },
    rhythmPillText: {
        fontSize: 13,
        fontWeight: '700',
    },
});
