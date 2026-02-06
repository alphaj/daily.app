import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import {
    ChevronLeft,
    Repeat,
    Trash2,
    Pencil,
    TrendingUp,
    TrendingDown,
    Minus,
    Lightbulb,
    BarChart3,
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
import { useHabits, getHabitRhythm, getHabitInsights } from '@/contexts/HabitContext';
import HabitHeatmap from '@/components/HabitHeatmap';
import { CelebrationOverlay } from '@/components/CelebrationOverlay';
import { SlipFlowModal } from '@/components/SlipFlowModal';

export default function HabitDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { habits, deleteHabit, toggleHabitCompletion, isCompletedToday, logSlip } = useHabits();
    const [showCelebration, setShowCelebration] = useState(false);
    const [showSlipFlow, setShowSlipFlow] = useState(false);

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

    const rhythm = getHabitRhythm(habit);
    const insights = getHabitInsights(habit);

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
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setShowSlipFlow(true);
    };

    const handleSlipSubmit = (trigger?: any, strategy?: string) => {
        logSlip(habit.id, trigger, strategy);
        setShowSlipFlow(false);
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

                {/* Rhythm Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Your Rhythm</Text>
                    <View style={styles.rhythmGrid}>
                        <View style={styles.rhythmStat}>
                            <Text style={styles.rhythmValue}>{rhythm.thisWeek.completed}/{rhythm.thisWeek.scheduled}</Text>
                            <Text style={styles.rhythmLabel}>This Week</Text>
                        </View>
                        <View style={styles.rhythmStat}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Text style={styles.rhythmValue}>{Math.round(rhythm.thisMonth.rate * 100)}%</Text>
                                {rhythm.trend === 'rising' && <TrendingUp size={16} color="#34C759" />}
                                {rhythm.trend === 'declining' && <TrendingDown size={16} color="#FF9500" />}
                                {rhythm.trend === 'steady' && <Minus size={14} color="#8E8E93" />}
                            </View>
                            <Text style={styles.rhythmLabel}>
                                {rhythm.lastMonth.rate > 0
                                    ? (rhythm.trend === 'rising' ? `Up from ${Math.round(rhythm.lastMonth.rate * 100)}%` :
                                       rhythm.trend === 'declining' ? `Down from ${Math.round(rhythm.lastMonth.rate * 100)}%` :
                                       'This Month')
                                    : 'This Month'}
                            </Text>
                        </View>
                        <View style={styles.rhythmStat}>
                            <Text style={[styles.rhythmValue, { fontSize: 18 }]}>{habit.bestStreak}</Text>
                            <Text style={styles.rhythmLabel}>Best Streak</Text>
                        </View>
                    </View>
                    {/* 4-week mini bars */}
                    <View style={styles.miniBarContainer}>
                        {rhythm.monthlyRates.map((rate, i) => (
                            <View key={i} style={styles.miniBarWrapper}>
                                <View style={[styles.miniBar, { height: Math.max(4, rate * 40) }]} />
                                <Text style={styles.miniBarLabel}>W{i + 1}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Heatmap */}
                <View style={styles.heatmapSection}>
                    <HabitHeatmap
                        completedDates={habit.completedDates}
                        currentStreak={habit.currentStreak}
                        bestStreak={habit.bestStreak}
                        createdAt={habit.createdAt}
                    />
                </View>

                {/* Intention Card */}
                {habit.intention && (habit.intention.when || habit.intention.where || habit.intention.cue || habit.intention.insteadAction) ? (
                    <View style={styles.card}>
                        <View style={styles.intentionHeader}>
                            <Lightbulb size={18} color="#FF9500" />
                            <Text style={styles.cardTitle}>My Plan</Text>
                        </View>
                        {habit.type === 'building' ? (
                            <Text style={styles.intentionNatural}>
                                {habit.intention.when && <>After I <Text style={styles.intentionBold}>{habit.intention.when}</Text>, </>}
                                I will <Text style={styles.intentionBold}>{habit.name.toLowerCase()}</Text>
                                {habit.intention.where && <> at <Text style={styles.intentionBold}>{habit.intention.where}</Text></>}
                            </Text>
                        ) : (
                            <View style={styles.intentionContainer}>
                                {habit.intention.cue && (
                                    <Text style={styles.intentionNatural}>
                                        When I feel the urge, my trigger is usually <Text style={styles.intentionBold}>{habit.intention.cue}</Text>
                                    </Text>
                                )}
                                {habit.intention.insteadAction && (
                                    <Text style={[styles.intentionNatural, { marginTop: 8 }]}>
                                        Instead, I will <Text style={styles.intentionBold}>{habit.intention.insteadAction}</Text>
                                    </Text>
                                )}
                            </View>
                        )}
                    </View>
                ) : (
                    <Pressable style={styles.card} onPress={() => router.push({ pathname: '/edit-habit', params: { id } })}>
                        <View style={styles.intentionHeader}>
                            <Lightbulb size={18} color="#C7C7CC" />
                            <Text style={[styles.cardTitle, { color: '#8E8E93' }]}>Add a plan to increase your success rate</Text>
                        </View>
                    </Pressable>
                )}

                {/* Insights */}
                {insights.totalCompletions > 7 && (
                    <View style={styles.card}>
                        <View style={styles.intentionHeader}>
                            <BarChart3 size={18} color="#5856D6" />
                            <Text style={styles.cardTitle}>Insights</Text>
                        </View>
                        <View style={styles.insightsList}>
                            <View style={styles.insightRow}>
                                <View style={[styles.insightDot, { backgroundColor: '#34C759' }]} />
                                <Text style={styles.insightText}>
                                    <Text style={styles.insightBold}>{insights.bestDay.name}s</Text> — {Math.round(insights.bestDay.rate * 100)}% completion
                                </Text>
                            </View>
                            <View style={styles.insightRow}>
                                <View style={[styles.insightDot, { backgroundColor: '#FF9500' }]} />
                                <Text style={styles.insightText}>
                                    <Text style={styles.insightBold}>{insights.hardestDay.name}s</Text> — {Math.round(insights.hardestDay.rate * 100)}% completion
                                </Text>
                            </View>
                            <View style={styles.insightRow}>
                                <View style={[styles.insightDot, { backgroundColor: '#5856D6' }]} />
                                <Text style={styles.insightText}>
                                    {insights.totalCompletions} days completed since {new Date(habit.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Trigger Patterns (breaking habits only) */}
                {habit.type === 'breaking' && (habit.slipLog || []).filter(s => s.trigger).length >= 2 && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Trigger Patterns</Text>
                        <View style={styles.triggerList}>
                            {Object.entries(
                                (habit.slipLog || [])
                                    .filter(s => s.trigger)
                                    .reduce((acc, s) => {
                                        acc[s.trigger!] = (acc[s.trigger!] || 0) + 1;
                                        return acc;
                                    }, {} as Record<string, number>)
                            )
                                .sort((a, b) => b[1] - a[1])
                                .map(([trigger, count]) => (
                                    <View key={trigger} style={styles.triggerRow}>
                                        <Text style={styles.triggerName}>{trigger.charAt(0).toUpperCase() + trigger.slice(1)}</Text>
                                        <View style={styles.triggerBarBg}>
                                            <View style={[styles.triggerBarFill, { flex: count as number }]} />
                                        </View>
                                        <Text style={styles.triggerCount}>{count}</Text>
                                    </View>
                                ))}
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

            {/* Slip Flow Modal */}
            <SlipFlowModal
                visible={showSlipFlow}
                habitName={habit.name}
                previousStrategies={(habit.slipLog || []).map(s => s.strategy).filter(Boolean) as string[]}
                onSubmit={handleSlipSubmit}
                onClose={() => setShowSlipFlow(false)}
            />
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
    rhythmGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
    },
    rhythmStat: {
        alignItems: 'center',
    },
    rhythmValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#000',
        letterSpacing: -0.5,
    },
    rhythmLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#8E8E93',
        marginTop: 4,
    },
    miniBarContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        gap: 12,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F2F2F7',
    },
    miniBarWrapper: {
        alignItems: 'center',
        gap: 4,
    },
    miniBar: {
        width: 24,
        backgroundColor: '#5856D6',
        borderRadius: 4,
        minHeight: 4,
    },
    miniBarLabel: {
        fontSize: 10,
        color: '#8E8E93',
        fontWeight: '600',
    },
    intentionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    intentionNatural: {
        fontSize: 16,
        color: '#000',
        lineHeight: 24,
    },
    intentionBold: {
        fontWeight: '700',
    },
    insightsList: {
        gap: 12,
    },
    insightRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    insightDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    insightText: {
        fontSize: 14,
        color: '#000',
        flex: 1,
    },
    insightBold: {
        fontWeight: '700',
    },
    triggerList: {
        gap: 10,
    },
    triggerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    triggerName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
        width: 80,
    },
    triggerBarBg: {
        flex: 1,
        height: 8,
        backgroundColor: '#F2F2F7',
        borderRadius: 4,
        flexDirection: 'row',
        overflow: 'hidden',
    },
    triggerBarFill: {
        height: '100%',
        backgroundColor: '#FF6B6B',
        borderRadius: 4,
    },
    triggerCount: {
        fontSize: 14,
        fontWeight: '700',
        color: '#8E8E93',
        width: 24,
        textAlign: 'right',
    },
    createdText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#8E8E93',
        textAlign: 'center',
        marginBottom: 20,
        marginTop: 10,
    },
});
