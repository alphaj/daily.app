import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import {
    ChevronLeft,
    Repeat,
    Trash2,
    Pencil,
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
    const { habits, deleteHabit, toggleHabitCompletion, isCompletedToday, logSlip } = useHabits();
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

    const handleToggleToday = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const wasCompleted = await toggleHabitCompletion(habit.id);

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

    const handleSlip = () => {
        Alert.alert(
            'Log a Slip',
            'This will reset your streak. Are you sure?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Log Slip',
                    style: 'destructive',
                    onPress: () => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                        logSlip(habit.id);
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
            <Stack.Screen options={{ headerShown: false }} />
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

                <View style={styles.headerActions}>
                    <Pressable style={styles.iconButton} onPress={() => router.push({ pathname: '/edit-habit', params: { id } })}>
                        <Pencil size={20} color="#5856D6" strokeWidth={1.5} />
                    </Pressable>
                    <Pressable style={styles.iconButton} onPress={handleDelete}>
                        <Trash2 size={20} color="#FF3B30" strokeWidth={1.5} />
                    </Pressable>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                {/* Habit Hero Section */}
                <View style={[styles.card, habit.type === 'breaking' && styles.cardBreaking]}>
                    <View style={styles.heroContent}>
                        {habit.emoji ? (
                            <View style={[styles.heroEmoji, habit.type === 'breaking' && styles.heroEmojiBreaking]}>
                                <Text style={styles.heroEmojiText}>{habit.emoji}</Text>
                            </View>
                        ) : (
                            <View style={[styles.heroIcon, habit.type === 'breaking' && styles.heroIconBreaking]}>
                                <Repeat size={40} color={habit.type === 'breaking' ? "#FF6B6B" : "#5856D6"} />
                            </View>
                        )}
                        <Text style={styles.heroName}>{habit.name}</Text>

                        {/* Type Badge */}
                        <View style={[styles.typeBadge, habit.type === 'breaking' && styles.typeBadgeBreaking]}>
                            <Text style={[styles.typeBadgeText, habit.type === 'breaking' && styles.typeBadgeTextBreaking]}>
                                {habit.type === 'building' ? '🌱 Building' : '🚫 Breaking'}
                            </Text>
                        </View>

                        {/* Today's Toggle */}
                        <Pressable
                            style={[
                                styles.todayButton,
                                completed && (habit.type === 'breaking' ? styles.todayButtonCompletedBreaking : styles.todayButtonCompleted)
                            ]}
                            onPress={handleToggleToday}
                        >
                            <Text style={[
                                styles.todayButtonText,
                                completed && styles.todayButtonTextCompleted
                            ]}>
                                {habit.type === 'building'
                                    ? (completed ? '✓ Completed Today' : 'Mark as Complete')
                                    : (completed ? '💪 Still Strong!' : "I'm Still Strong")
                                }
                            </Text>
                        </Pressable>

                        {/* Slip Button for Breaking Habits */}
                        {habit.type === 'breaking' && (
                            <Pressable
                                style={styles.slipButton}
                                onPress={handleSlip}
                            >
                                <Text style={styles.slipButtonText}>I Slipped</Text>
                            </Pressable>
                        )}
                    </View>
                </View>

                {/* Next Milestone Card */}
                {habit.currentStreak > 0 && (
                    <View style={styles.card}>
                        <View style={styles.milestoneContainer}>
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
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>My Intention</Text>
                        <View style={styles.intentionContainer}>
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
        backgroundColor: '#F2F2F7', // System Gray Background
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
        backgroundColor: '#F2F2F7',
    },
    iconButton: {
        padding: 8,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000',
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000',
        marginBottom: 16,
    },
    heroContent: {
        alignItems: 'center',
        paddingVertical: 8,
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
        width: '100%',
        alignItems: 'center',
    },
    todayButtonCompleted: {
        backgroundColor: '#34C759',
    },
    todayButtonCompletedBreaking: {
        backgroundColor: '#FF6B6B',
    },
    todayButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    todayButtonTextCompleted: {
        color: '#fff',
    },
    // Breaking Habit Styles
    cardBreaking: {
        borderWidth: 1,
        borderColor: '#FFE5E5',
    },
    heroEmojiBreaking: {
        backgroundColor: '#FFE5E5',
    },
    heroIconBreaking: {
        backgroundColor: '#FFE5E5',
    },
    typeBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#E8F5E8',
        marginBottom: 16,
    },
    typeBadgeBreaking: {
        backgroundColor: '#FFE5E5',
    },
    typeBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#34C759',
    },
    typeBadgeTextBreaking: {
        color: '#FF6B6B',
    },
    slipButton: {
        marginTop: 12,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FF6B6B',
        backgroundColor: 'transparent',
    },
    slipButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FF6B6B',
    },
    milestoneContainer: {
        flexDirection: 'row',
        alignItems: 'center',
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
        marginBottom: 20,
    },
    intentionContainer: {
        gap: 12,
    },
    intentionRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    intentionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8E8E93',
        width: 60,
        marginTop: 1,
    },
    intentionValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#000',
        flex: 1,
        lineHeight: 20,
    },
    createdText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#8E8E93', // Slightly darker than previous C7C7CC for better readability on gray
        textAlign: 'center',
        marginBottom: 20,
        marginTop: 10,
    },
});
