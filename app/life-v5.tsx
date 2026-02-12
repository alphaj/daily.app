import React, { useMemo, useCallback, memo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronRight, Check, Plus, ArrowRight } from 'lucide-react-native';
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

// --- Colors ---
const COLORS = {
    habit: '#34C759',
    supplement: '#AF52DE',
    project: '#007AFF',
    grocery: '#FF9500',
};

// --- Stat Block ---
const StatBlock = memo(function StatBlock({
    value,
    label,
    bgColor,
    textColor,
}: {
    value: string;
    label: string;
    bgColor: string;
    textColor: string;
}) {
    return (
        <View style={[styles.statBlock, { backgroundColor: bgColor }]}>
            <Text style={[styles.statValue, { color: textColor }]}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
});

// --- Section Header ---
function SectionHeader({ title, onAdd }: { title: string; onAdd: () => void }) {
    return (
        <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Pressable
                style={({ pressed }) => [
                    styles.addTextBtn,
                    pressed && { opacity: 0.5 },
                ]}
                onPress={() => {
                    Haptics.selectionAsync();
                    onAdd();
                }}
                hitSlop={8}
            >
                <Text style={styles.addTextBtnLabel}>Add</Text>
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
    const streakText = habit.currentStreak > 0
        ? `${habit.currentStreak} day streak`
        : 'Not started';

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
            <View style={[
                styles.habitEmojiCircle,
                { backgroundColor: isCompleted ? 'rgba(52,199,89,0.12)' : 'rgba(60,60,67,0.06)' },
            ]}>
                <Text style={styles.habitEmoji}>{habit.emoji || '\u26A1'}</Text>
            </View>

            <View style={styles.habitTextColumn}>
                <Text style={styles.habitName} numberOfLines={1}>{habit.name}</Text>
                <Text style={[
                    styles.habitSubtitle,
                    isCompleted && { color: COLORS.habit },
                ]}>
                    {isCompleted ? 'Done today' : streakText}
                </Text>
            </View>

            <View style={styles.habitRightColumn}>
                <View style={styles.weekDotsRow}>
                    {weeklyProgress.map((day, i) => (
                        <View
                            key={i}
                            style={[
                                styles.weekDot,
                                day.isBeforeCreation
                                    ? styles.weekDotHidden
                                    : day.completed
                                        ? styles.weekDotCompleted
                                        : styles.weekDotIncomplete,
                                day.isToday && !day.isBeforeCreation && styles.weekDotToday,
                            ]}
                        />
                    ))}
                </View>
                <View style={[
                    styles.checkCircle,
                    isCompleted ? styles.checkCircleComplete : styles.checkCircleIncomplete,
                ]}>
                    {isCompleted && <Check size={16} color="#fff" strokeWidth={3} />}
                </View>
            </View>
        </Pressable>
    );
});

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
            <View style={styles.projectTopRow}>
                <View style={[styles.projectEmojiCircle, { backgroundColor: project.color + '18' }]}>
                    <Text style={styles.projectEmoji}>{project.icon || '\uD83C\uDFAF'}</Text>
                </View>
                <View style={styles.projectTextColumn}>
                    <Text style={styles.projectName} numberOfLines={1}>{project.name}</Text>
                    <Text style={styles.projectTaskCount}>
                        {totalTasks === 0
                            ? 'No tasks'
                            : `${completedTasks}/${totalTasks} tasks done`}
                    </Text>
                </View>
                <ChevronRight size={16} color="#C7C7CC" strokeWidth={2} />
            </View>
            <View style={styles.projectProgressBarBg}>
                <View
                    style={[
                        styles.projectProgressBarFill,
                        {
                            width: `${Math.min(progress, 100)}%`,
                            backgroundColor: project.color,
                        },
                    ]}
                />
            </View>
        </Pressable>
    );
});

// --- Supplement Card (2-col grid) ---
const SupplementCard = memo(function SupplementCard({
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
                styles.supplementCard,
                isTaken ? styles.supplementCardTaken : styles.supplementCardNotTaken,
                pressed && styles.cardPressed,
            ]}
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onToggle();
            }}
        >
            <View style={styles.supplementTopRow}>
                <Text style={styles.supplementEmoji}>{supplement.emoji || '\uD83D\uDC8A'}</Text>
                {isTaken && (
                    <View style={styles.supplementCheckMini}>
                        <Check size={10} color="#fff" strokeWidth={3} />
                    </View>
                )}
            </View>
            <Text style={styles.supplementName} numberOfLines={1}>{supplement.name}</Text>
            {supplement.dosage ? (
                <Text style={styles.supplementDosage} numberOfLines={1}>{supplement.dosage}</Text>
            ) : null}
        </Pressable>
    );
});

// --- Quick Link ---
function QuickLink({
    label,
    onPress,
}: {
    label: string;
    onPress: () => void;
}) {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.quickLink,
                pressed && { opacity: 0.6 },
            ]}
            onPress={() => {
                Haptics.selectionAsync();
                onPress();
            }}
        >
            <Text style={styles.quickLinkText}>{label}</Text>
            <ArrowRight size={16} color="#007AFF" strokeWidth={2} />
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

    // Display habits: incomplete first, then by streak desc, max 5
    const displayHabits = useMemo(() => {
        const sorted = [...habitsToday].sort((a, b) => {
            const aComplete = a.completedDates.includes(todayInfo.today);
            const bComplete = b.completedDates.includes(todayInfo.today);
            if (aComplete !== bComplete) return aComplete ? 1 : -1;
            return b.currentStreak - a.currentStreak;
        });
        return sorted.slice(0, 5);
    }, [habitsToday, todayInfo.today]);

    // Display projects: max 3
    const displayProjects = useMemo(() => activeProjects.slice(0, 3), [activeProjects]);

    // Supplement stats
    const supplementsTakenToday = useMemo(() => {
        return activeSupplements.filter(s => isTakenToday(s)).length;
    }, [activeSupplements, isTakenToday]);

    // Navigation
    const handleHabitPress = useCallback((id: string) => {
        router.push({ pathname: '/habit-detail', params: { id } });
    }, [router]);

    const handleProjectPress = useCallback((id: string) => {
        router.push(`/project/${id}` as any);
    }, [router]);

    // Supplement grid pairs
    const supplementRows = useMemo(() => {
        const rows: Supplement[][] = [];
        for (let i = 0; i < activeSupplements.length; i += 2) {
            rows.push(activeSupplements.slice(i, i + 2));
        }
        return rows;
    }, [activeSupplements]);

    return (
        <View style={styles.container}>
            <AmbientBackground />
            <VariantPicker group="life" current={4} />
            <SafeAreaView edges={['top']} style={styles.safeArea}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 120 }}
                >
                    {/* Header */}
                    <View style={styles.pageHeader}>
                        <Text style={styles.pageTitle}>Life</Text>
                    </View>

                    {/* Hero Stats Bar */}
                    <View style={styles.statsBar}>
                        <StatBlock
                            value={`${habitsCompletedToday}/${habitsToday.length}`}
                            label="HABITS"
                            bgColor="rgba(52,199,89,0.08)"
                            textColor={COLORS.habit}
                        />
                        <StatBlock
                            value={`${supplementsTakenToday}/${activeSupplements.length}`}
                            label="PILLS"
                            bgColor="rgba(175,82,222,0.08)"
                            textColor={COLORS.supplement}
                        />
                        <StatBlock
                            value={`${activeProjects.length}`}
                            label="PROJECTS"
                            bgColor="rgba(0,122,255,0.08)"
                            textColor={COLORS.project}
                        />
                        <StatBlock
                            value={`${groceryStats.onListCount}`}
                            label="SHOPPING"
                            bgColor="rgba(255,149,0,0.08)"
                            textColor={COLORS.grocery}
                        />
                    </View>

                    {/* Habits Section */}
                    <SectionHeader title="Habits" onAdd={() => router.push('/add-habit')} />
                    {habitsToday.length === 0 && (
                        <Text style={styles.emptyHint}>No habits scheduled today</Text>
                    )}
                    <View style={styles.cardsContainer}>
                        {displayHabits.map((habit) => (
                            <HabitCard
                                key={habit.id}
                                habit={habit}
                                weeklyProgress={getWeeklyProgress(habit)}
                                isCompleted={isCompletedToday(habit)}
                                onPress={() => handleHabitPress(habit.id)}
                            />
                        ))}
                    </View>
                    {habitsToday.length > 5 && (
                        <Pressable
                            style={({ pressed }) => [
                                styles.seeAllBtn,
                                pressed && { opacity: 0.6 },
                            ]}
                            onPress={() => {
                                Haptics.selectionAsync();
                                router.push('/habits' as any);
                            }}
                        >
                            <Text style={styles.seeAllText}>
                                See all {habitsToday.length} habits
                            </Text>
                            <ArrowRight size={14} color="#007AFF" strokeWidth={2} />
                        </Pressable>
                    )}

                    {/* Projects Section */}
                    <SectionHeader title="Projects" onAdd={() => router.push('/add-project' as any)} />
                    {activeProjects.length === 0 && (
                        <Text style={styles.emptyHint}>No active projects</Text>
                    )}
                    <View style={styles.cardsContainer}>
                        {displayProjects.map((project) => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                progress={getProjectProgress(project)}
                                onPress={() => handleProjectPress(project.id)}
                            />
                        ))}
                    </View>
                    {activeProjects.length > 3 && (
                        <Pressable
                            style={({ pressed }) => [
                                styles.seeAllBtn,
                                pressed && { opacity: 0.6 },
                            ]}
                            onPress={() => {
                                Haptics.selectionAsync();
                                router.push('/projects' as any);
                            }}
                        >
                            <Text style={styles.seeAllText}>
                                See all {activeProjects.length} projects
                            </Text>
                            <ArrowRight size={14} color="#007AFF" strokeWidth={2} />
                        </Pressable>
                    )}

                    {/* Supplements Section */}
                    <SectionHeader title="Supplements" onAdd={() => router.push('/add-supplement')} />
                    {activeSupplements.length === 0 && (
                        <Text style={styles.emptyHint}>No supplements yet</Text>
                    )}
                    <View style={styles.supplementGrid}>
                        {supplementRows.map((row, rowIndex) => (
                            <View key={rowIndex} style={styles.supplementRow}>
                                {row.map((supplement) => (
                                    <SupplementCard
                                        key={supplement.id}
                                        supplement={supplement}
                                        isTaken={isTakenToday(supplement)}
                                        onToggle={() => toggleTaken(supplement.id)}
                                    />
                                ))}
                                {row.length === 1 && <View style={styles.supplementCardPlaceholder} />}
                            </View>
                        ))}
                    </View>

                    {/* Quick Links */}
                    <View style={styles.quickLinksSection}>
                        <QuickLink
                            label="Groceries"
                            onPress={() => router.push('/groceries')}
                        />
                        <QuickLink
                            label="Travel"
                            onPress={() => router.push('/travel')}
                        />
                        {activeTrips.length > 0 && (
                            <QuickLink
                                label={`${activeTrips.length} active trip${activeTrips.length !== 1 ? 's' : ''}`}
                                onPress={() => router.push('/travel')}
                            />
                        )}
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

    // Header
    pageHeader: {
        paddingHorizontal: 24,
        marginTop: 8,
        marginBottom: 20,
    },
    pageTitle: {
        fontSize: 34,
        fontWeight: '800',
        color: '#000',
        letterSpacing: -1,
    },

    // Hero Stats Bar
    statsBar: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 28,
        gap: 8,
    },
    statBlock: {
        flex: 1,
        height: 80,
        borderRadius: 16,
        padding: 12,
        justifyContent: 'space-between',
    },
    statValue: {
        fontSize: 24,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#8E8E93',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    // Section Header
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginBottom: 12,
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#000',
        letterSpacing: -0.3,
    },
    addTextBtn: {
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    addTextBtnLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#007AFF',
    },

    // Cards container
    cardsContainer: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },

    // Card pressed state
    cardPressed: {
        opacity: 0.85,
    },

    // Habit Card
    habitCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 14,
        padding: 14,
        marginBottom: 8,
    },
    habitEmojiCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    habitEmoji: {
        fontSize: 18,
    },
    habitTextColumn: {
        flex: 1,
        justifyContent: 'center',
    },
    habitName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        letterSpacing: -0.2,
    },
    habitSubtitle: {
        fontSize: 13,
        color: '#8E8E93',
        marginTop: 2,
    },
    habitRightColumn: {
        alignItems: 'flex-end',
        marginLeft: 8,
        gap: 6,
    },

    // Week dots
    weekDotsRow: {
        flexDirection: 'row',
        gap: 3,
    },
    weekDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
    },
    weekDotCompleted: {
        backgroundColor: '#34C759',
    },
    weekDotIncomplete: {
        backgroundColor: 'rgba(60,60,67,0.12)',
    },
    weekDotHidden: {
        backgroundColor: 'transparent',
    },
    weekDotToday: {
        borderWidth: 1,
        borderColor: 'rgba(52,199,89,0.4)',
    },

    // Check circle
    checkCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkCircleComplete: {
        backgroundColor: '#34C759',
    },
    checkCircleIncomplete: {
        borderWidth: 2,
        borderColor: 'rgba(60,60,67,0.2)',
    },

    // Project Card
    projectCard: {
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 14,
        padding: 14,
        marginBottom: 8,
    },
    projectTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    projectEmojiCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    projectEmoji: {
        fontSize: 18,
    },
    projectTextColumn: {
        flex: 1,
        justifyContent: 'center',
    },
    projectName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        letterSpacing: -0.2,
    },
    projectTaskCount: {
        fontSize: 13,
        color: '#8E8E93',
        marginTop: 2,
    },
    projectProgressBarBg: {
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(60,60,67,0.08)',
        marginTop: 12,
    },
    projectProgressBarFill: {
        height: 4,
        borderRadius: 2,
    },

    // Supplement Grid
    supplementGrid: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    supplementRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    supplementCard: {
        flex: 1,
        borderRadius: 14,
        padding: 14,
        height: 70,
        justifyContent: 'center',
    },
    supplementCardTaken: {
        backgroundColor: 'rgba(52,199,89,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(52,199,89,0.25)',
    },
    supplementCardNotTaken: {
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderWidth: 1,
        borderColor: 'rgba(60,60,67,0.1)',
    },
    supplementCardPlaceholder: {
        flex: 1,
    },
    supplementTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    supplementEmoji: {
        fontSize: 20,
    },
    supplementCheckMini: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#34C759',
        alignItems: 'center',
        justifyContent: 'center',
    },
    supplementName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
        marginTop: 4,
        letterSpacing: -0.1,
    },
    supplementDosage: {
        fontSize: 12,
        color: '#8E8E93',
        marginTop: 1,
    },

    // See All Button
    seeAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 8,
        marginBottom: 8,
    },
    seeAllText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#007AFF',
    },

    // Quick Links
    quickLinksSection: {
        marginTop: 12,
        marginBottom: 16,
    },
    quickLink: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 20,
    },
    quickLinkText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#007AFF',
    },

    // Empty state
    emptyHint: {
        fontSize: 15,
        color: '#8E8E93',
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
});
