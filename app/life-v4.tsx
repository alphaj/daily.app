import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, LayoutAnimation, Platform, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronRight, ChevronDown, Check, Plus } from 'lucide-react-native';
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

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- Progress Circle ---

function ProgressCircle({ percentage, completed, total }: {
    percentage: number;
    completed: number;
    total: number;
}) {
    const borderColor = percentage >= 80 ? '#34C759' : percentage < 30 ? '#FF9500' : '#007AFF';

    return (
        <View style={styles.progressCircleWrapper}>
            <View style={[styles.progressCircleOuter, { borderColor }]}>
                <Text style={styles.progressCircleText}>{percentage}</Text>
                <Text style={styles.progressCirclePercent}>%</Text>
            </View>
            <Text style={styles.progressCircleLabel}>
                {completed} of {total} done
            </Text>
        </View>
    );
}

// --- Accordion Section Header ---

function AccordionHeader({ icon, title, completed, total, isExpanded, onToggle, onAdd }: {
    icon: string;
    title: string;
    completed: number;
    total: number;
    isExpanded: boolean;
    onToggle: () => void;
    onAdd: () => void;
}) {
    const ChevronIcon = isExpanded ? ChevronDown : ChevronRight;
    const allDone = total > 0 && completed === total;

    return (
        <Pressable
            style={({ pressed }) => [
                styles.accordionHeader,
                pressed && styles.accordionHeaderPressed,
            ]}
            onPress={onToggle}
        >
            <Text style={styles.accordionIcon}>{icon}</Text>
            <Text style={styles.accordionTitle}>{title}</Text>
            {allDone && (
                <View style={styles.accordionCheckBadge}>
                    <Check size={12} color="#fff" strokeWidth={3} />
                </View>
            )}
            <Text style={styles.accordionFraction}>{completed}/{total}</Text>
            <Pressable
                style={({ pressed }) => [
                    styles.accordionAddBtn,
                    pressed && { opacity: 0.5 },
                ]}
                onPress={(e) => {
                    e.stopPropagation();
                    Haptics.selectionAsync();
                    onAdd();
                }}
                hitSlop={8}
            >
                <Plus size={16} color="#8E8E93" strokeWidth={2.5} />
            </Pressable>
            <ChevronIcon size={18} color="#8E8E93" strokeWidth={2} />
        </Pressable>
    );
}

// --- Habit Item Row ---

function HabitItemRow({ habit, isCompleted, isLast, onPress }: {
    habit: Habit;
    isCompleted: boolean;
    isLast: boolean;
    onPress: () => void;
}) {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.itemRow,
                pressed && styles.itemRowPressed,
            ]}
            onPress={() => {
                Haptics.selectionAsync();
                onPress();
            }}
        >
            <Text style={styles.itemEmoji}>{habit.emoji || '\u26A1'}</Text>
            <Text style={[styles.itemText, isCompleted && styles.itemTextCompleted]} numberOfLines={1}>
                {habit.name}
            </Text>
            <View style={styles.itemRight}>
                {isCompleted ? (
                    <View style={[styles.checkCircle, styles.checkCircleComplete]}>
                        <Check size={14} color="#fff" strokeWidth={3} />
                    </View>
                ) : habit.currentStreak > 0 ? (
                    <Text style={styles.streakBadge}>{habit.currentStreak}d</Text>
                ) : (
                    <View style={[styles.checkCircle, styles.checkCircleIncomplete]} />
                )}
            </View>
            {!isLast && <View style={styles.itemSeparator} />}
        </Pressable>
    );
}

// --- Project Item Row ---

function ProjectItemRow({ project, onPress, isLast }: {
    project: Project;
    onPress: () => void;
    isLast: boolean;
}) {
    const completedTasks = project.tasks.filter(t => t.completed).length;
    const totalTasks = project.tasks.length;

    return (
        <Pressable
            style={({ pressed }) => [
                styles.itemRow,
                pressed && styles.itemRowPressed,
            ]}
            onPress={() => {
                Haptics.selectionAsync();
                onPress();
            }}
        >
            <Text style={styles.itemEmoji}>{project.icon || '\uD83C\uDFAF'}</Text>
            <Text style={styles.itemText} numberOfLines={1}>{project.name}</Text>
            <View style={styles.itemRight}>
                <Text style={styles.itemFraction}>{completedTasks}/{totalTasks}</Text>
            </View>
            {!isLast && <View style={styles.itemSeparator} />}
        </Pressable>
    );
}

// --- Supplement Item Row ---

function SupplementItemRow({ supplement, isTaken, onToggle, isLast }: {
    supplement: Supplement;
    isTaken: boolean;
    onToggle: () => void;
    isLast: boolean;
}) {
    return (
        <View style={styles.itemRow}>
            <Text style={styles.itemEmoji}>{supplement.emoji || '\uD83D\uDC8A'}</Text>
            <Text style={[styles.itemText, isTaken && styles.itemTextCompleted]} numberOfLines={1}>
                {supplement.name}
            </Text>
            <Pressable
                style={[
                    styles.toggleCircle,
                    isTaken ? styles.toggleCircleActive : styles.toggleCircleInactive,
                ]}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onToggle();
                }}
                hitSlop={8}
            >
                {isTaken && <Check size={14} color="#fff" strokeWidth={3} />}
            </Pressable>
            {!isLast && <View style={styles.itemSeparator} />}
        </View>
    );
}

// --- Quick Link Row ---

function QuickLinkRow({ emoji, title, badge, onPress }: {
    emoji: string;
    title: string;
    badge: string;
    onPress: () => void;
}) {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.quickLinkRow,
                pressed && styles.itemRowPressed,
            ]}
            onPress={() => {
                Haptics.selectionAsync();
                onPress();
            }}
        >
            <Text style={styles.quickLinkEmoji}>{emoji}</Text>
            <Text style={styles.quickLinkTitle}>{title}</Text>
            <View style={styles.itemRight}>
                <Text style={styles.quickLinkBadge}>{badge}</Text>
                <ChevronRight size={16} color="#C7C7CC" strokeWidth={2} />
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

    const allHabitsComplete = habitsToday.length > 0 && habitsCompletedToday === habitsToday.length;

    const supplementsTakenToday = useMemo(() => {
        return activeSupplements.filter(s => isTakenToday(s)).length;
    }, [activeSupplements, isTakenToday]);

    const allSupplementsComplete = activeSupplements.length > 0 && supplementsTakenToday === activeSupplements.length;

    // Accordion state
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

    // Auto-expand sections with remaining items
    useEffect(() => {
        setExpandedSections({
            habits: !allHabitsComplete && habitsToday.length > 0,
            projects: activeProjects.length > 0,
            supplements: !allSupplementsComplete && activeSupplements.length > 0,
        });
    }, [allHabitsComplete, allSupplementsComplete, habitsToday.length, activeProjects.length, activeSupplements.length]);

    const toggleSection = useCallback((section: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
        Haptics.selectionAsync();
    }, []);

    // Navigation
    const handleHabitPress = useCallback((id: string) => {
        router.push({ pathname: '/habit-detail', params: { id } });
    }, [router]);

    const handleProjectPress = useCallback((id: string) => {
        router.push(`/project/${id}` as any);
    }, [router]);

    // Overall progress
    const overallProgress = useMemo(() => {
        const totalItems = habitsToday.length + activeSupplements.length;
        const completedItems = habitsCompletedToday + supplementsTakenToday;
        if (totalItems === 0) return 0;
        return Math.round((completedItems / totalItems) * 100);
    }, [habitsToday.length, activeSupplements.length, habitsCompletedToday, supplementsTakenToday]);

    const totalItems = habitsToday.length + activeSupplements.length;
    const completedItems = habitsCompletedToday + supplementsTakenToday;

    // Sort habits: incomplete first, then by streak desc
    const sortedHabits = useMemo(() => {
        return [...habitsToday].sort((a, b) => {
            const aComplete = a.completedDates.includes(todayInfo.today);
            const bComplete = b.completedDates.includes(todayInfo.today);
            if (aComplete !== bComplete) return aComplete ? 1 : -1;
            return b.currentStreak - a.currentStreak;
        });
    }, [habitsToday, todayInfo.today]);

    return (
        <View style={styles.container}>
            <AmbientBackground />
            <VariantPicker group="life" current={3} />
            <SafeAreaView edges={['top']} style={styles.safeArea}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                    {/* Header: Title + Progress Circle */}
                    <View style={styles.headerRow}>
                        <View style={styles.headerTextBlock}>
                            <Text style={styles.pageTitle}>Life</Text>
                            <Text style={styles.headerSubtitle}>
                                {completedItems === totalItems && totalItems > 0
                                    ? 'All done for today'
                                    : `${totalItems - completedItems} remaining`
                                }
                            </Text>
                        </View>
                        <ProgressCircle
                            percentage={overallProgress}
                            completed={completedItems}
                            total={totalItems}
                        />
                    </View>

                    {/* Habits Accordion */}
                    <View style={styles.accordionContainer}>
                        <AccordionHeader
                            icon={'\u26A1'}
                            title="Habits"
                            completed={habitsCompletedToday}
                            total={habitsToday.length}
                            isExpanded={!!expandedSections.habits}
                            onToggle={() => toggleSection('habits')}
                            onAdd={() => router.push('/add-habit')}
                        />
                        {expandedSections.habits && (
                            <View style={styles.accordionBody}>
                                {habitsToday.length === 0 ? (
                                    <Text style={styles.emptyText}>No habits scheduled today</Text>
                                ) : (
                                    sortedHabits.map((habit, i) => (
                                        <HabitItemRow
                                            key={habit.id}
                                            habit={habit}
                                            isCompleted={habit.completedDates.includes(todayInfo.today)}
                                            isLast={i === sortedHabits.length - 1}
                                            onPress={() => handleHabitPress(habit.id)}
                                        />
                                    ))
                                )}
                            </View>
                        )}
                    </View>

                    {/* Projects Accordion */}
                    <View style={styles.accordionContainer}>
                        <AccordionHeader
                            icon={'\uD83C\uDFAF'}
                            title="Projects"
                            completed={activeProjects.filter(p => {
                                const done = p.tasks.filter(t => t.completed).length;
                                return done === p.tasks.length && p.tasks.length > 0;
                            }).length}
                            total={activeProjects.length}
                            isExpanded={!!expandedSections.projects}
                            onToggle={() => toggleSection('projects')}
                            onAdd={() => router.push('/add-project' as any)}
                        />
                        {expandedSections.projects && (
                            <View style={styles.accordionBody}>
                                {activeProjects.length === 0 ? (
                                    <Text style={styles.emptyText}>No active projects</Text>
                                ) : (
                                    activeProjects.map((project, i) => (
                                        <ProjectItemRow
                                            key={project.id}
                                            project={project}
                                            onPress={() => handleProjectPress(project.id)}
                                            isLast={i === activeProjects.length - 1}
                                        />
                                    ))
                                )}
                            </View>
                        )}
                    </View>

                    {/* Supplements Accordion */}
                    <View style={styles.accordionContainer}>
                        <AccordionHeader
                            icon={'\uD83D\uDC8A'}
                            title="Supplements"
                            completed={supplementsTakenToday}
                            total={activeSupplements.length}
                            isExpanded={!!expandedSections.supplements}
                            onToggle={() => toggleSection('supplements')}
                            onAdd={() => router.push('/add-supplement')}
                        />
                        {expandedSections.supplements && (
                            <View style={styles.accordionBody}>
                                {activeSupplements.length === 0 ? (
                                    <Text style={styles.emptyText}>No supplements yet</Text>
                                ) : (
                                    activeSupplements.map((supplement, i) => (
                                        <SupplementItemRow
                                            key={supplement.id}
                                            supplement={supplement}
                                            isTaken={isTakenToday(supplement)}
                                            onToggle={() => toggleTaken(supplement.id)}
                                            isLast={i === activeSupplements.length - 1}
                                        />
                                    ))
                                )}
                            </View>
                        )}
                    </View>

                    {/* Quick Links (non-collapsible) */}
                    <View style={styles.quickLinksSection}>
                        <Text style={styles.quickLinksLabel}>Quick Links</Text>
                        <View style={styles.quickLinksContainer}>
                            <QuickLinkRow
                                emoji={'\uD83D\uDED2'}
                                title="Groceries"
                                badge={groceryStats.onListCount > 0 ? `${groceryStats.onListCount} items` : 'None'}
                                onPress={() => router.push('/groceries')}
                            />
                            <View style={styles.quickLinkSeparator} />
                            <QuickLinkRow
                                emoji={'\u2708\uFE0F'}
                                title="Travel"
                                badge={activeTrips.length > 0 ? `${activeTrips.length} trip${activeTrips.length !== 1 ? 's' : ''}` : 'None'}
                                onPress={() => router.push('/travel')}
                            />
                        </View>
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
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        marginTop: 8,
        marginBottom: 28,
    },
    headerTextBlock: {
        flex: 1,
    },
    pageTitle: {
        fontSize: 34,
        fontWeight: '800',
        color: '#000',
        letterSpacing: -1,
    },
    headerSubtitle: {
        fontSize: 15,
        fontWeight: '500',
        color: '#8E8E93',
        marginTop: 4,
    },

    // Progress Circle
    progressCircleWrapper: {
        alignItems: 'center',
    },
    progressCircleOuter: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.6)',
        flexDirection: 'row',
    },
    progressCircleText: {
        fontSize: 28,
        fontWeight: '700',
        color: '#000',
        letterSpacing: -1,
    },
    progressCirclePercent: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8E8E93',
        marginTop: 4,
    },
    progressCircleLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#8E8E93',
        marginTop: 6,
    },

    // Accordion
    accordionContainer: {
        marginHorizontal: 16,
        marginBottom: 12,
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 14,
        overflow: 'hidden',
    },
    accordionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    accordionHeaderPressed: {
        backgroundColor: 'rgba(0,0,0,0.03)',
    },
    accordionIcon: {
        fontSize: 18,
        marginRight: 10,
    },
    accordionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        letterSpacing: -0.3,
    },
    accordionCheckBadge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#34C759',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    accordionFraction: {
        fontSize: 14,
        fontWeight: '500',
        color: '#8E8E93',
        marginLeft: 'auto',
        marginRight: 12,
    },
    accordionAddBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    accordionBody: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#E5E5EA',
    },

    // Item rows
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        paddingLeft: 44,
    },
    itemRowPressed: {
        backgroundColor: 'rgba(0,0,0,0.03)',
    },
    itemEmoji: {
        fontSize: 18,
        marginRight: 12,
    },
    itemText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: '#000',
        letterSpacing: -0.2,
    },
    itemTextCompleted: {
        color: '#8E8E93',
    },
    itemRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginLeft: 8,
    },
    itemFraction: {
        fontSize: 14,
        fontWeight: '500',
        color: '#8E8E93',
    },
    itemSeparator: {
        position: 'absolute',
        bottom: 0,
        left: 44,
        right: 0,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E5E5EA',
    },

    // Check circle
    checkCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkCircleComplete: {
        backgroundColor: '#34C759',
    },
    checkCircleIncomplete: {
        borderWidth: 2,
        borderColor: '#E5E5EA',
    },

    // Streak badge
    streakBadge: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FF9500',
    },

    // Toggle circle (supplements)
    toggleCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    toggleCircleActive: {
        backgroundColor: '#34C759',
    },
    toggleCircleInactive: {
        borderWidth: 2,
        borderColor: '#E5E5EA',
    },

    // Empty state
    emptyText: {
        fontSize: 15,
        color: '#8E8E93',
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingLeft: 44,
    },

    // Quick links
    quickLinksSection: {
        marginHorizontal: 16,
        marginTop: 8,
        marginBottom: 12,
    },
    quickLinksLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    quickLinksContainer: {
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 14,
        overflow: 'hidden',
    },
    quickLinkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
    },
    quickLinkEmoji: {
        fontSize: 18,
        marginRight: 12,
    },
    quickLinkTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: '#000',
        letterSpacing: -0.2,
    },
    quickLinkBadge: {
        fontSize: 14,
        fontWeight: '500',
        color: '#8E8E93',
    },
    quickLinkSeparator: {
        marginLeft: 50,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E5E5EA',
    },
});
