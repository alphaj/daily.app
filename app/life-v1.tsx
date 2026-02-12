import React, { useMemo, useCallback, memo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronRight, Check, Plus } from 'lucide-react-native';
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

// --- Helpers ---

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDateSubtitle(date: Date): string {
    const dayName = DAY_NAMES[date.getDay()];
    const month = MONTH_NAMES[date.getMonth()];
    const day = date.getDate();
    return `${dayName}, ${month} ${day}`;
}

// --- Card Sub-Components ---

const ACCENT_COLORS = {
    habits: '#34C759',
    projects: '#007AFF',
    supplements: '#AF52DE',
    quickAccess: '#8E8E93',
} as const;

interface CardHeaderProps {
    title: string;
    progressText: string;
    accentColor: string;
    onAdd?: () => void;
}

function CardHeader({ title, progressText, accentColor, onAdd }: CardHeaderProps) {
    return (
        <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
                <Text style={styles.cardTitle}>{title}</Text>
                {onAdd && (
                    <Pressable
                        onPress={() => {
                            Haptics.selectionAsync();
                            onAdd();
                        }}
                        hitSlop={8}
                        style={({ pressed }) => [
                            styles.addLink,
                            pressed && { opacity: 0.5 },
                        ]}
                    >
                        <Text style={[styles.addLinkText, { color: accentColor }]}>Add</Text>
                    </Pressable>
                )}
            </View>
            <Text style={[styles.cardProgressNumber, { color: accentColor }]}>{progressText}</Text>
        </View>
    );
}

interface ProgressBarProps {
    progress: number; // 0–1
    color: string;
}

function ProgressBar({ progress, color }: ProgressBarProps) {
    const clampedProgress = Math.max(0, Math.min(1, progress));
    return (
        <View style={styles.progressBarTrack}>
            <View
                style={[
                    styles.progressBarFill,
                    {
                        width: `${clampedProgress * 100}%`,
                        backgroundColor: color,
                    },
                ]}
            />
        </View>
    );
}

// --- Compact Row Components ---

const CompactHabitItem = memo(function CompactHabitItem({
    habit,
    isCompleted,
    onPress,
}: {
    habit: Habit;
    isCompleted: boolean;
    onPress: () => void;
}) {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.compactItem,
                pressed && styles.compactItemPressed,
            ]}
            onPress={() => {
                Haptics.selectionAsync();
                onPress();
            }}
        >
            <View style={styles.compactItemLeft}>
                <Text style={styles.compactEmoji}>{habit.emoji || '~'}</Text>
                <Text
                    style={[
                        styles.compactItemText,
                        isCompleted && styles.compactItemTextDone,
                    ]}
                    numberOfLines={1}
                >
                    {habit.name}
                </Text>
            </View>
            <View style={styles.compactItemRight}>
                {habit.currentStreak > 0 && !isCompleted && (
                    <Text style={styles.compactStreakText}>{habit.currentStreak}d</Text>
                )}
                {isCompleted ? (
                    <View style={styles.compactCheckDone}>
                        <Check size={12} color="#fff" strokeWidth={3} />
                    </View>
                ) : (
                    <ChevronRight size={14} color="#C7C7CC" strokeWidth={2} />
                )}
            </View>
        </Pressable>
    );
});

const CompactProjectItem = memo(function CompactProjectItem({
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
                styles.compactItem,
                pressed && styles.compactItemPressed,
            ]}
            onPress={() => {
                Haptics.selectionAsync();
                onPress();
            }}
        >
            <View style={styles.compactItemLeft}>
                <Text style={styles.compactEmoji}>{project.icon || '~'}</Text>
                <Text style={styles.compactItemText} numberOfLines={1}>
                    {project.name}
                </Text>
            </View>
            <View style={styles.compactItemRight}>
                <Text style={styles.compactMetaText}>
                    {completedTasks}/{totalTasks}
                </Text>
                <ChevronRight size={14} color="#C7C7CC" strokeWidth={2} />
            </View>
        </Pressable>
    );
});

const CompactSupplementItem = memo(function CompactSupplementItem({
    supplement,
    isTaken,
    onToggle,
}: {
    supplement: Supplement;
    isTaken: boolean;
    onToggle: () => void;
}) {
    return (
        <View style={styles.compactItem}>
            <View style={styles.compactItemLeft}>
                <Text style={styles.compactEmoji}>{supplement.emoji || '~'}</Text>
                <Text
                    style={[
                        styles.compactItemText,
                        isTaken && styles.compactItemTextDone,
                    ]}
                    numberOfLines={1}
                >
                    {supplement.name}
                </Text>
                {supplement.dosage ? (
                    <Text style={styles.compactDosageText}>{supplement.dosage}</Text>
                ) : null}
            </View>
            <Pressable
                style={[
                    styles.supplementCheckbox,
                    isTaken ? styles.supplementCheckboxDone : styles.supplementCheckboxUndone,
                ]}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onToggle();
                }}
                hitSlop={8}
            >
                {isTaken && <Check size={13} color="#fff" strokeWidth={3} />}
            </Pressable>
        </View>
    );
});

function QuickAccessRow({
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
                styles.compactItem,
                pressed && styles.compactItemPressed,
            ]}
            onPress={() => {
                Haptics.selectionAsync();
                onPress();
            }}
        >
            <View style={styles.compactItemLeft}>
                <Text style={styles.compactEmoji}>{emoji}</Text>
                <Text style={styles.compactItemText}>{title}</Text>
            </View>
            <View style={styles.compactItemRight}>
                <Text style={styles.compactMetaText}>{badge}</Text>
                <ChevronRight size={14} color="#C7C7CC" strokeWidth={2} />
            </View>
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
        return { today, dayOfWeek, dateObj: now };
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

    // Navigation handlers
    const handleHabitPress = useCallback((id: string) => {
        router.push({ pathname: '/habit-detail', params: { id } });
    }, [router]);

    const handleProjectPress = useCallback((id: string) => {
        router.push(`/project/${id}` as any);
    }, [router]);

    // Progress ratios
    const habitsProgress = habitsToday.length > 0 ? habitsCompletedToday / habitsToday.length : 0;
    const supplementsProgress = activeSupplements.length > 0 ? supplementsTakenToday / activeSupplements.length : 0;

    // Average project progress
    const projectsAvgProgress = useMemo(() => {
        if (activeProjects.length === 0) return 0;
        const total = activeProjects.reduce((sum, p) => sum + getProjectProgress(p), 0);
        return total / activeProjects.length / 100;
    }, [activeProjects, getProjectProgress]);

    const dateSubtitle = formatDateSubtitle(todayInfo.dateObj);

    return (
        <View style={styles.container}>
            <AmbientBackground />
        <VariantPicker group="life" current={0} />
            <SafeAreaView edges={['top']} style={styles.safeArea}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                    {/* Header */}
                    <View style={styles.pageHeader}>
                        <Text style={styles.pageTitle}>Life</Text>
                        <Text style={styles.pageSubtitle}>{dateSubtitle}</Text>
                    </View>

                    {/* Habits Card */}
                    <View style={styles.cardWrapper}>
                        <View style={[styles.card, { borderLeftColor: ACCENT_COLORS.habits }]}>
                            <CardHeader
                                title="Habits"
                                progressText={`${habitsCompletedToday}/${habitsToday.length}`}
                                accentColor={ACCENT_COLORS.habits}
                                onAdd={() => router.push('/add-habit')}
                            />
                            <ProgressBar progress={habitsProgress} color={ACCENT_COLORS.habits} />

                            {habitsToday.length === 0 ? (
                                <Text style={styles.emptyText}>No habits scheduled today</Text>
                            ) : (
                                <View style={styles.itemsList}>
                                    {displayHabits.map((habit) => (
                                        <CompactHabitItem
                                            key={habit.id}
                                            habit={habit}
                                            isCompleted={habit.completedDates.includes(todayInfo.today)}
                                            onPress={() => handleHabitPress(habit.id)}
                                        />
                                    ))}
                                    {habitsToday.length > 5 && (
                                        <Pressable
                                            style={({ pressed }) => [
                                                styles.seeAllLink,
                                                pressed && { opacity: 0.5 },
                                            ]}
                                            onPress={() => {
                                                Haptics.selectionAsync();
                                                router.push('/habits');
                                            }}
                                        >
                                            <Text style={styles.seeAllText}>
                                                See all {habitsToday.length} habits
                                            </Text>
                                        </Pressable>
                                    )}
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Projects Card */}
                    <View style={styles.cardWrapper}>
                        <View style={[styles.card, { borderLeftColor: ACCENT_COLORS.projects }]}>
                            <CardHeader
                                title="Projects"
                                progressText={`${activeProjects.length}`}
                                accentColor={ACCENT_COLORS.projects}
                                onAdd={() => router.push('/add-project')}
                            />
                            <ProgressBar progress={projectsAvgProgress} color={ACCENT_COLORS.projects} />

                            {activeProjects.length === 0 ? (
                                <Text style={styles.emptyText}>No active projects</Text>
                            ) : (
                                <View style={styles.itemsList}>
                                    {displayProjects.map((project) => (
                                        <CompactProjectItem
                                            key={project.id}
                                            project={project}
                                            progress={getProjectProgress(project)}
                                            onPress={() => handleProjectPress(project.id)}
                                        />
                                    ))}
                                    {activeProjects.length > 3 && (
                                        <Pressable
                                            style={({ pressed }) => [
                                                styles.seeAllLink,
                                                pressed && { opacity: 0.5 },
                                            ]}
                                            onPress={() => {
                                                Haptics.selectionAsync();
                                                router.push('/projects');
                                            }}
                                        >
                                            <Text style={styles.seeAllText}>
                                                See all {activeProjects.length} projects
                                            </Text>
                                        </Pressable>
                                    )}
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Supplements Card */}
                    <View style={styles.cardWrapper}>
                        <View style={[styles.card, { borderLeftColor: ACCENT_COLORS.supplements }]}>
                            <CardHeader
                                title="Supplements"
                                progressText={`${supplementsTakenToday}/${activeSupplements.length}`}
                                accentColor={ACCENT_COLORS.supplements}
                                onAdd={() => router.push('/add-supplement')}
                            />
                            <ProgressBar progress={supplementsProgress} color={ACCENT_COLORS.supplements} />

                            {activeSupplements.length === 0 ? (
                                <Text style={styles.emptyText}>No supplements yet</Text>
                            ) : (
                                <View style={styles.itemsList}>
                                    {activeSupplements.map((supplement) => (
                                        <CompactSupplementItem
                                            key={supplement.id}
                                            supplement={supplement}
                                            isTaken={isTakenToday(supplement)}
                                            onToggle={() => toggleTaken(supplement.id)}
                                        />
                                    ))}
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Quick Access Card */}
                    <View style={styles.cardWrapper}>
                        <View style={[styles.card, { borderLeftColor: ACCENT_COLORS.quickAccess }]}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>Quick Access</Text>
                            </View>

                            <View style={styles.itemsList}>
                                <QuickAccessRow
                                    emoji="🛒"
                                    title="Groceries"
                                    badge={groceryStats.onListCount > 0 ? `${groceryStats.onListCount} items` : 'None'}
                                    onPress={() => router.push('/groceries')}
                                />
                                <QuickAccessRow
                                    emoji="✈️"
                                    title="Travel"
                                    badge={activeTrips.length > 0 ? `${activeTrips.length} trip${activeTrips.length !== 1 ? 's' : ''}` : 'None'}
                                    onPress={() => router.push('/travel')}
                                />
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
            <BottomNavBar />
        </View>
    );
}

// --- Styles ---

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
        fontSize: 28,
        fontWeight: '800',
        color: '#000',
        letterSpacing: -0.8,
    },
    pageSubtitle: {
        fontSize: 15,
        fontWeight: '500',
        color: '#8E8E93',
        marginTop: 2,
    },

    // Card container
    cardWrapper: {
        marginHorizontal: 16,
        marginBottom: 16,
    },
    card: {
        backgroundColor: 'rgba(255,255,255,0.85)',
        borderRadius: 16,
        borderLeftWidth: 3,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },

    // Card Header
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    cardHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        letterSpacing: -0.3,
    },
    cardProgressNumber: {
        fontSize: 32,
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    addLink: {
        paddingVertical: 2,
        paddingHorizontal: 4,
    },
    addLinkText: {
        fontSize: 14,
        fontWeight: '600',
    },

    // Progress Bar
    progressBarTrack: {
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(0,0,0,0.06)',
        marginBottom: 16,
    },
    progressBarFill: {
        height: 4,
        borderRadius: 2,
    },

    // Empty state
    emptyText: {
        fontSize: 14,
        color: '#8E8E93',
        fontWeight: '500',
    },

    // Items list
    itemsList: {
        gap: 2,
    },

    // Compact item rows
    compactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 2,
    },
    compactItemPressed: {
        opacity: 0.6,
    },
    compactItemLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginRight: 8,
    },
    compactEmoji: {
        fontSize: 16,
        width: 22,
        textAlign: 'center',
    },
    compactItemText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#000',
        letterSpacing: -0.2,
        flexShrink: 1,
    },
    compactItemTextDone: {
        color: '#8E8E93',
        textDecorationLine: 'line-through',
    },
    compactItemRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    compactStreakText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FF9500',
    },
    compactMetaText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#8E8E93',
    },
    compactDosageText: {
        fontSize: 12,
        fontWeight: '400',
        color: '#8E8E93',
        marginLeft: 2,
    },

    // Compact check circle (habits)
    compactCheckDone: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#34C759',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Supplement checkbox
    supplementCheckbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    supplementCheckboxDone: {
        backgroundColor: '#34C759',
    },
    supplementCheckboxUndone: {
        borderWidth: 2,
        borderColor: 'rgba(60,60,67,0.2)',
    },

    // See all link
    seeAllLink: {
        paddingTop: 8,
        paddingBottom: 2,
    },
    seeAllText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#5856D6',
    },
});
