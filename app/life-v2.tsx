import React, { useMemo, useCallback, memo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronRight, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { AmbientBackground } from '@/components/AmbientBackground';
import { BottomNavBar } from '@/components/BottomNavBar';
import { useHabits } from '@/contexts/HabitContext';
import { useProjects } from '@/contexts/ProjectContext';
import { useSupplements } from '@/contexts/SupplementContext';
import { useGroceries } from '@/contexts/GroceryContext';
import { useTravel } from '@/contexts/TravelContext';
import type { Habit, DayCompletion } from '@/types/habit';
import type { Project } from '@/types/project';
import type { Supplement } from '@/types/supplement';
import { VariantPicker } from '@/components/VariantPicker';

// --- Section Header ---

function SwimlaneHeader({
    title,
    count,
    onSeeAll,
}: {
    title: string;
    count: number;
    onSeeAll: () => void;
}) {
    return (
        <View style={styles.swimlaneHeader}>
            <View style={styles.swimlaneHeaderLeft}>
                <Text style={styles.swimlaneTitle}>{title}</Text>
                <Text style={styles.swimlaneCount}>{count}</Text>
            </View>
            <Pressable
                onPress={() => {
                    Haptics.selectionAsync();
                    onSeeAll();
                }}
                style={({ pressed }) => [
                    styles.seeAllButton,
                    pressed && { opacity: 0.5 },
                ]}
                hitSlop={8}
            >
                <Text style={styles.seeAllText}>See all</Text>
                <ChevronRight size={14} color="#5856D6" strokeWidth={2.5} />
            </Pressable>
        </View>
    );
}

// --- Habit Card ---

const HabitCard = memo(function HabitCard({
    habit,
    weeklyProgress,
    isCompleted,
    onPress,
}: {
    habit: Habit;
    weeklyProgress: DayCompletion[];
    isCompleted: boolean;
    onPress: () => void;
}) {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.habitCard,
                pressed && styles.cardPressed,
            ]}
            onPress={() => {
                Haptics.selectionAsync();
                onPress();
            }}
        >
            {isCompleted && (
                <View style={styles.habitCheckBadge}>
                    <Check size={10} color="#fff" strokeWidth={3} />
                </View>
            )}

            <Text style={styles.habitEmoji}>{habit.emoji || '\u26A1'}</Text>
            <Text style={styles.habitName} numberOfLines={1}>
                {habit.name}
            </Text>

            <View style={styles.habitWeekDots}>
                {weeklyProgress.map((day, i) => (
                    <View
                        key={i}
                        style={[
                            styles.habitDot,
                            day.isBeforeCreation
                                ? styles.habitDotHidden
                                : day.completed
                                    ? styles.habitDotCompleted
                                    : styles.habitDotIncomplete,
                        ]}
                    />
                ))}
            </View>
        </Pressable>
    );
});

// --- Add Habit Card (empty state) ---

function AddHabitCard({ onPress }: { onPress: () => void }) {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.habitCard,
                styles.addCard,
                pressed && { opacity: 0.6 },
            ]}
            onPress={() => {
                Haptics.selectionAsync();
                onPress();
            }}
        >
            <Text style={styles.addCardPlus}>+</Text>
            <Text style={styles.addCardLabel}>Add</Text>
        </Pressable>
    );
}

// --- Project Card ---

const ProjectCard = memo(function ProjectCard({
    project,
    progress,
    onPress,
}: {
    project: Project;
    progress: number;
    onPress: () => void;
}) {
    const completedTasks = project.tasks.filter(t => t.completed).length;
    const totalTasks = project.tasks.length;

    return (
        <Pressable
            style={({ pressed }) => [
                styles.projectCard,
                pressed && styles.cardPressed,
            ]}
            onPress={() => {
                Haptics.selectionAsync();
                onPress();
            }}
        >
            <View style={[styles.projectColorStrip, { backgroundColor: project.color }]} />
            <View style={styles.projectContent}>
                <Text style={styles.projectEmoji}>{project.icon || '\uD83C\uDFAF'}</Text>
                <Text style={styles.projectName} numberOfLines={1}>
                    {project.name}
                </Text>
                <Text style={styles.projectTaskCount}>
                    {completedTasks}/{totalTasks} tasks
                </Text>
                <View style={styles.projectProgressBar}>
                    <View
                        style={[
                            styles.projectProgressFill,
                            {
                                width: `${Math.min(progress, 100)}%`,
                                backgroundColor: project.color,
                            },
                        ]}
                    />
                </View>
            </View>
        </Pressable>
    );
});

// --- Add Project Card (empty state) ---

function AddProjectCard({ onPress }: { onPress: () => void }) {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.projectCard,
                styles.addCard,
                pressed && { opacity: 0.6 },
            ]}
            onPress={() => {
                Haptics.selectionAsync();
                onPress();
            }}
        >
            <Text style={styles.addCardPlus}>+</Text>
            <Text style={styles.addCardLabel}>Add</Text>
        </Pressable>
    );
}

// --- Supplement Chip ---

const SupplementChip = memo(function SupplementChip({
    supplement,
    isTaken,
    onToggle,
}: {
    supplement: Supplement;
    isTaken: boolean;
    onToggle: () => void;
}) {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.supplementChip,
                isTaken ? styles.supplementChipTaken : styles.supplementChipUntaken,
                pressed && { opacity: 0.7 },
            ]}
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onToggle();
            }}
        >
            <Text style={[styles.supplementChipEmoji, isTaken && styles.supplementChipEmojiTaken]}>
                {supplement.emoji || '\uD83D\uDC8A'}
            </Text>
            <Text
                style={[
                    styles.supplementChipName,
                    isTaken && styles.supplementChipNameTaken,
                ]}
                numberOfLines={1}
            >
                {supplement.name}
            </Text>
        </Pressable>
    );
});

// --- Add Supplement Chip (empty state) ---

function AddSupplementChip({ onPress }: { onPress: () => void }) {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.supplementChip,
                styles.addChip,
                pressed && { opacity: 0.6 },
            ]}
            onPress={() => {
                Haptics.selectionAsync();
                onPress();
            }}
        >
            <Text style={styles.addChipText}>+ Add</Text>
        </Pressable>
    );
}

// --- Quick Link Card ---

function QuickLinkCard({
    emoji,
    title,
    badge,
    onPress,
}: {
    emoji: string;
    title: string;
    badge: string;
    onPress: () => void;
}) {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.quickLinkCard,
                pressed && styles.cardPressed,
            ]}
            onPress={() => {
                Haptics.selectionAsync();
                onPress();
            }}
        >
            <Text style={styles.quickLinkEmoji}>{emoji}</Text>
            <Text style={styles.quickLinkTitle}>{title}</Text>
            <Text style={styles.quickLinkBadge}>{badge}</Text>
        </Pressable>
    );
}

// --- Main Screen ---

export default function LifeScreen() {
    const router = useRouter();
    const { habits, isCompletedToday, getWeeklyProgress } = useHabits();
    const { activeProjects, getProjectProgress } = useProjects();
    const { activeSupplements, isTakenToday, toggleTaken } = useSupplements();
    const { stats: groceryStats } = useGroceries();
    const { activeTrips } = useTravel();

    // Today's date info
    const todayInfo = useMemo(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const today = `${year}-${month}-${day}`;
        const dayOfWeek = now.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
        return { today, dayOfWeek };
    }, []);

    // Habits scheduled for today
    const habitsToday = useMemo(() => {
        return habits.filter(h =>
            !h.scheduledDays || h.scheduledDays.length === 0 || h.scheduledDays.includes(todayInfo.dayOfWeek)
        );
    }, [habits, todayInfo.dayOfWeek]);

    const habitsCompletedToday = useMemo(() => {
        return habitsToday.filter(h => h.completedDates.includes(todayInfo.today)).length;
    }, [habitsToday, todayInfo.today]);

    const supplementsTakenToday = useMemo(() => {
        return activeSupplements.filter(s => isTakenToday(s)).length;
    }, [activeSupplements, isTakenToday]);

    // Sort habits: incomplete first, then by streak descending
    const sortedHabits = useMemo(() => {
        return [...habitsToday].sort((a, b) => {
            const aComplete = a.completedDates.includes(todayInfo.today);
            const bComplete = b.completedDates.includes(todayInfo.today);
            if (aComplete !== bComplete) return aComplete ? 1 : -1;
            return b.currentStreak - a.currentStreak;
        });
    }, [habitsToday, todayInfo.today]);

    // Navigation handlers
    const handleHabitPress = useCallback((id: string) => {
        router.push({ pathname: '/habit-detail', params: { id } });
    }, [router]);

    const handleProjectPress = useCallback((id: string) => {
        router.push(`/project/${id}` as any);
    }, [router]);

    return (
        <View style={styles.container}>
            <AmbientBackground />
        <VariantPicker group="life" current={1} />
            <SafeAreaView edges={['top']} style={styles.safeArea}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 120 }}
                >
                    {/* Page Title */}
                    <View style={styles.pageHeader}>
                        <Text style={styles.pageTitle}>Life</Text>
                    </View>

                    {/* Habits Swimlane */}
                    <View style={styles.swimlaneSection}>
                        <SwimlaneHeader
                            title="Habits"
                            count={habitsToday.length}
                            onSeeAll={() => router.push('/habits' as any)}
                        />
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.swimlaneScroll}
                        >
                            {sortedHabits.map(habit => (
                                <HabitCard
                                    key={habit.id}
                                    habit={habit}
                                    weeklyProgress={getWeeklyProgress(habit)}
                                    isCompleted={isCompletedToday(habit)}
                                    onPress={() => handleHabitPress(habit.id)}
                                />
                            ))}
                            <AddHabitCard onPress={() => router.push('/add-habit')} />
                        </ScrollView>
                    </View>

                    {/* Projects Swimlane */}
                    <View style={styles.swimlaneSection}>
                        <SwimlaneHeader
                            title="Projects"
                            count={activeProjects.length}
                            onSeeAll={() => router.push('/projects' as any)}
                        />
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.swimlaneScroll}
                        >
                            {activeProjects.map(project => (
                                <ProjectCard
                                    key={project.id}
                                    project={project}
                                    progress={getProjectProgress(project)}
                                    onPress={() => handleProjectPress(project.id)}
                                />
                            ))}
                            <AddProjectCard onPress={() => router.push('/add-project' as any)} />
                        </ScrollView>
                    </View>

                    {/* Supplements Swimlane */}
                    <View style={styles.swimlaneSection}>
                        <SwimlaneHeader
                            title="Supplements"
                            count={activeSupplements.length}
                            onSeeAll={() => router.push('/add-supplement' as any)}
                        />
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.swimlaneScroll}
                        >
                            {activeSupplements.map(supplement => (
                                <SupplementChip
                                    key={supplement.id}
                                    supplement={supplement}
                                    isTaken={isTakenToday(supplement)}
                                    onToggle={() => toggleTaken(supplement.id)}
                                />
                            ))}
                            <AddSupplementChip onPress={() => router.push('/add-supplement')} />
                        </ScrollView>
                    </View>

                    {/* Quick Links */}
                    <View style={styles.quickLinksSection}>
                        <QuickLinkCard
                            emoji="\uD83D\uDED2"
                            title="Groceries"
                            badge={
                                groceryStats.onListCount > 0
                                    ? `${groceryStats.onListCount} item${groceryStats.onListCount !== 1 ? 's' : ''}`
                                    : 'None'
                            }
                            onPress={() => router.push('/groceries')}
                        />
                        <QuickLinkCard
                            emoji="\u2708\uFE0F"
                            title="Travel"
                            badge={
                                activeTrips.length > 0
                                    ? `${activeTrips.length} trip${activeTrips.length !== 1 ? 's' : ''}`
                                    : 'None'
                            }
                            onPress={() => router.push('/travel')}
                        />
                    </View>
                </ScrollView>
            </SafeAreaView>
            <BottomNavBar />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },

    // Page Header
    pageHeader: {
        paddingHorizontal: 20,
        marginTop: 8,
        marginBottom: 24,
    },
    pageTitle: {
        fontSize: 34,
        fontWeight: '800',
        color: '#000',
        letterSpacing: -1,
    },

    // Swimlane Section
    swimlaneSection: {
        marginBottom: 28,
    },
    swimlaneHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    swimlaneHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    swimlaneTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#000',
        letterSpacing: -0.4,
    },
    swimlaneCount: {
        fontSize: 14,
        fontWeight: '500',
        color: '#8E8E93',
    },
    seeAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    seeAllText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#5856D6',
    },
    swimlaneScroll: {
        paddingHorizontal: 16,
        gap: 12,
    },

    // Habit Card
    habitCard: {
        width: 120,
        height: 120,
        backgroundColor: 'rgba(255,255,255,0.85)',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    cardPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.97 }],
    },
    habitCheckBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#34C759',
        alignItems: 'center',
        justifyContent: 'center',
    },
    habitEmoji: {
        fontSize: 28,
        marginBottom: 6,
    },
    habitName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#000',
        textAlign: 'center',
        paddingHorizontal: 8,
        marginBottom: 8,
    },
    habitWeekDots: {
        flexDirection: 'row',
        gap: 3,
    },
    habitDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
    },
    habitDotCompleted: {
        backgroundColor: '#34C759',
    },
    habitDotIncomplete: {
        backgroundColor: 'rgba(60,60,67,0.12)',
    },
    habitDotHidden: {
        backgroundColor: 'transparent',
    },

    // Add Card (shared empty state)
    addCard: {
        borderWidth: 1.5,
        borderColor: 'rgba(60,60,67,0.15)',
        borderStyle: 'dashed',
        backgroundColor: 'rgba(255,255,255,0.5)',
        shadowOpacity: 0,
        elevation: 0,
    },
    addCardPlus: {
        fontSize: 24,
        fontWeight: '300',
        color: '#8E8E93',
        marginBottom: 4,
    },
    addCardLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: '#8E8E93',
    },

    // Project Card
    projectCard: {
        width: 200,
        height: 100,
        backgroundColor: 'rgba(255,255,255,0.85)',
        borderRadius: 16,
        flexDirection: 'row',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
        alignItems: 'center',
        justifyContent: 'center',
    },
    projectColorStrip: {
        width: 4,
        height: '100%',
    },
    projectContent: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 12,
        justifyContent: 'center',
    },
    projectEmoji: {
        fontSize: 20,
        marginBottom: 4,
    },
    projectName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
        letterSpacing: -0.2,
        marginBottom: 2,
    },
    projectTaskCount: {
        fontSize: 12,
        fontWeight: '400',
        color: '#8E8E93',
        marginBottom: 8,
    },
    projectProgressBar: {
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(60,60,67,0.08)',
    },
    projectProgressFill: {
        height: 4,
        borderRadius: 2,
    },

    // Supplement Chip
    supplementChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    supplementChipUntaken: {
        backgroundColor: 'rgba(255,255,255,0.85)',
        borderWidth: 1,
        borderColor: 'rgba(60,60,67,0.15)',
    },
    supplementChipTaken: {
        backgroundColor: '#34C759',
        borderWidth: 1,
        borderColor: '#34C759',
    },
    supplementChipEmoji: {
        fontSize: 16,
    },
    supplementChipEmojiTaken: {
        // emoji color stays the same but we keep the style hook
    },
    supplementChipName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#000',
    },
    supplementChipNameTaken: {
        color: '#fff',
    },
    addChip: {
        borderWidth: 1.5,
        borderColor: 'rgba(60,60,67,0.15)',
        borderStyle: 'dashed',
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    addChipText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#8E8E93',
    },

    // Quick Links
    quickLinksSection: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 12,
        marginBottom: 28,
    },
    quickLinkCard: {
        flex: 1,
        height: 80,
        backgroundColor: 'rgba(255,255,255,0.85)',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    quickLinkEmoji: {
        fontSize: 24,
        marginBottom: 4,
    },
    quickLinkTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
        marginBottom: 2,
    },
    quickLinkBadge: {
        fontSize: 13,
        fontWeight: '400',
        color: '#8E8E93',
    },
});
