import { useRouter, useLocalSearchParams } from 'expo-router';
import {
    ChevronLeft,
    Flame,
    Trash2,
} from 'lucide-react-native';
import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useHabits } from '@/contexts/HabitContext';
import HabitHeatmap from '@/components/HabitHeatmap';
import { CelebrationOverlay } from '@/components/CelebrationOverlay';

export default function HabitDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { habits, deleteHabit, toggleHabitCompletion, isCompletedToday } = useHabits();
    const [showCelebration, setShowCelebration] = useState(false);

    const habit = habits.find(h => h.id === id);

    const handleCelebrationComplete = useCallback(() => {
        setShowCelebration(false);
    }, []);

    if (!habit) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Habit not found</Text>
                    <Pressable style={styles.backButton} onPress={() => router.back()}>
                        <Text style={styles.backButtonText}>Go Back</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    const completed = isCompletedToday(habit);

    const handleToggleToday = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const wasCompleted = toggleHabitCompletion(habit.id);

        // Celebrate if completing and reaching a milestone
        if (wasCompleted && (habit.currentStreak + 1) % 7 === 0) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setShowCelebration(true);
        }
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
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                        deleteHabit(habit.id);
                        router.back();
                    },
                },
            ]
        );
    };

    // Calculate next milestone
    const milestones = [7, 30, 100, 365];
    const nextMilestone = milestones.find(m => m > habit.currentStreak) || 365;
    const daysToMilestone = nextMilestone - habit.currentStreak;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <CelebrationOverlay
                visible={showCelebration}
                onComplete={handleCelebrationComplete}
            />

            {/* Header */}
            <View style={styles.header}>
                <Pressable style={styles.iconButton} onPress={() => router.back()}>
                    <ChevronLeft size={24} color="#000" strokeWidth={1.5} />
                </Pressable>

                <Text style={styles.headerTitle}>Habit Details</Text>

                <Pressable style={styles.iconButton} onPress={handleDelete}>
                    <Trash2 size={20} color="#FF3B30" strokeWidth={1.5} />
                </Pressable>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                {/* Habit Hero Section */}
                <View style={styles.heroSection}>
                    {habit.emoji ? (
                        <View style={styles.heroEmoji}>
                            <Text style={styles.heroEmojiText}>{habit.emoji}</Text>
                        </View>
                    ) : (
                        <View style={styles.heroIcon}>
                            <Flame size={40} color="#5856D6" />
                        </View>
                    )}
                    <Text style={styles.heroName}>{habit.name}</Text>

                    {/* Today's Toggle */}
                    <Pressable
                        style={[
                            styles.todayButton,
                            completed && styles.todayButtonCompleted
                        ]}
                        onPress={handleToggleToday}
                    >
                        <Text style={[
                            styles.todayButtonText,
                            completed && styles.todayButtonTextCompleted
                        ]}>
                            {completed ? '✓ Completed Today' : 'Mark as Complete'}
                        </Text>
                    </Pressable>
                </View>

                {/* Next Milestone Card */}
                {habit.currentStreak > 0 && (
                    <View style={styles.milestoneCard}>
                        <View style={styles.milestoneIcon}>
                            <Text style={styles.milestoneEmoji}>🎯</Text>
                        </View>
                        <View style={styles.milestoneContent}>
                            <Text style={styles.milestoneTitle}>
                                {daysToMilestone} days to {nextMilestone}-day milestone!
                            </Text>
                            <View style={styles.milestoneProgress}>
                                <View
                                    style={[
                                        styles.milestoneProgressFill,
                                        { width: `${(habit.currentStreak / nextMilestone) * 100}%` }
                                    ]}
                                />
                            </View>
                        </View>
                    </View>
                )}

                {/* Heatmap */}
                <View style={styles.heatmapSection}>
                    <HabitHeatmap
                        completedDates={habit.completedDates}
                        currentStreak={habit.currentStreak}
                        bestStreak={habit.bestStreak}
                        createdAt={habit.createdAt}
                    />
                </View>

                {/* Intention Card (if set) */}
                {habit.intention && (habit.intention.when || habit.intention.where || habit.intention.cue) && (
                    <View style={styles.intentionCard}>
                        <Text style={styles.intentionTitle}>My Intention</Text>
                        {habit.intention.when && (
                            <View style={styles.intentionRow}>
                                <Text style={styles.intentionLabel}>When:</Text>
                                <Text style={styles.intentionValue}>{habit.intention.when}</Text>
                            </View>
                        )}
                        {habit.intention.where && (
                            <View style={styles.intentionRow}>
                                <Text style={styles.intentionLabel}>Where:</Text>
                                <Text style={styles.intentionValue}>{habit.intention.where}</Text>
                            </View>
                        )}
                        {habit.intention.cue && (
                            <View style={styles.intentionRow}>
                                <Text style={styles.intentionLabel}>Cue:</Text>
                                <Text style={styles.intentionValue}>{habit.intention.cue}</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Created Date */}
                <Text style={styles.createdText}>
                    Started {new Date(habit.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                    })}
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    errorText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#8E8E93',
        marginBottom: 16,
    },
    backButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#5856D6',
        borderRadius: 12,
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
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
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
    },
    heroSection: {
        alignItems: 'center',
        paddingVertical: 24,
        marginBottom: 8,
    },
    heroEmoji: {
        width: 88,
        height: 88,
        borderRadius: 24,
        backgroundColor: '#F5F5FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    heroEmojiText: {
        fontSize: 48,
    },
    heroIcon: {
        width: 88,
        height: 88,
        borderRadius: 24,
        backgroundColor: '#F5F5FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    heroName: {
        fontSize: 28,
        fontWeight: '800',
        color: '#000',
        textAlign: 'center',
        letterSpacing: -0.5,
        marginBottom: 20,
    },
    todayButton: {
        paddingHorizontal: 32,
        paddingVertical: 14,
        backgroundColor: '#5856D6',
        borderRadius: 16,
    },
    todayButtonCompleted: {
        backgroundColor: '#34C759',
    },
    todayButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    todayButtonTextCompleted: {
        color: '#fff',
    },
    milestoneCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF8E6',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        gap: 12,
    },
    milestoneIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#FFE8B2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    milestoneEmoji: {
        fontSize: 24,
    },
    milestoneContent: {
        flex: 1,
    },
    milestoneTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
        marginBottom: 8,
    },
    milestoneProgress: {
        height: 6,
        backgroundColor: '#FFE8B2',
        borderRadius: 3,
        overflow: 'hidden',
    },
    milestoneProgressFill: {
        height: '100%',
        backgroundColor: '#FF9500',
        borderRadius: 3,
    },
    heatmapSection: {
        marginBottom: 24,
    },
    intentionCard: {
        backgroundColor: '#F8F8FC',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
    },
    intentionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000',
        marginBottom: 16,
    },
    intentionRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    intentionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8E8E93',
        width: 60,
    },
    intentionValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#000',
        flex: 1,
    },
    createdText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#C7C7CC',
        textAlign: 'center',
        marginBottom: 20,
    },
});
