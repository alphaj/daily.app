import React, { useMemo, useCallback, memo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronRight, Check, Settings, Inbox } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';
import { useInbox } from '@/contexts/InboxContext';
import { AmbientBackground } from '@/components/AmbientBackground';
import { BottomNavBar } from '@/components/BottomNavBar';
import { useHabits } from '@/contexts/HabitContext';
import { useProjects } from '@/contexts/ProjectContext';
import { useSupplements } from '@/contexts/SupplementContext';
import { useGroceries } from '@/contexts/GroceryContext';
import { useTravel } from '@/contexts/TravelContext';
import { useTodos } from '@/contexts/TodoContext';
import type { Habit, DayCompletion } from '@/types/habit';
import type { Project } from '@/types/project';
import type { Supplement } from '@/types/supplement';
import type { Todo } from '@/types/todo';
import { Plus } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 12;
const GRID_PADDING = 16;
const TILE_HALF = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;
const TILE_FULL = SCREEN_WIDTH - GRID_PADDING * 2;

// --- Tile Components ---

const HabitTile = memo(function HabitTile({
    habitsToday,
    habitsCompletedToday,
    displayHabits,
    todayStr,
    onPress,
}: {
    habitsToday: Habit[];
    habitsCompletedToday: number;
    displayHabits: Habit[];
    todayStr: string;
    onPress: () => void;
}) {
    const percentage = habitsToday.length > 0
        ? Math.round((habitsCompletedToday / habitsToday.length) * 100)
        : 0;

    if (habitsToday.length === 0) {
        return (
            <Pressable
                style={({ pressed }) => [
                    styles.tileFullWidth,
                    styles.habitTile,
                    styles.emptyTile,
                    pressed && styles.tilePressed,
                ]}
                onPress={() => {
                    Haptics.selectionAsync();
                    onPress();
                }}
            >
                <Text style={styles.emptyTileTitle}>Add Habits</Text>
                <Text style={styles.emptyTileSubtitle}>Track your daily habits</Text>
            </Pressable>
        );
    }

    return (
        <Pressable
            style={({ pressed }) => [
                styles.tileFullWidth,
                styles.habitTile,
                pressed && styles.tilePressed,
            ]}
            onPress={() => {
                Haptics.selectionAsync();
                onPress();
            }}
        >
            <View style={styles.habitTileHeader}>
                <Text style={styles.tileLabel}>Habits</Text>
                <View style={styles.habitPercentageBadge}>
                    <Text style={styles.habitPercentageText}>{percentage}%</Text>
                </View>
            </View>

            <View style={styles.habitTileBody}>
                <Text style={styles.habitBigNumber}>
                    {habitsCompletedToday}/{habitsToday.length}
                </Text>
                <Text style={styles.habitCountLabel}>habits today</Text>
            </View>

            <View style={styles.habitEmojiRow}>
                {displayHabits.map((habit) => {
                    const isComplete = habit.completedDates.includes(todayStr);
                    return (
                        <View
                            key={habit.id}
                            style={[
                                styles.habitEmojiCircle,
                                isComplete
                                    ? styles.habitEmojiCircleComplete
                                    : styles.habitEmojiCircleIncomplete,
                            ]}
                        >
                            <Text style={styles.habitEmojiText}>{habit.emoji || '⚡'}</Text>
                        </View>
                    );
                })}
                {habitsToday.length > 6 && (
                    <View style={[styles.habitEmojiCircle, styles.habitEmojiCircleMore]}>
                        <Text style={styles.habitMoreText}>+{habitsToday.length - 6}</Text>
                    </View>
                )}
            </View>
        </Pressable>
    );
});

const ProjectTile = memo(function ProjectTile({
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
    const bgColor = project.color + '10';

    return (
        <Pressable
            style={({ pressed }) => [
                styles.tileHalf,
                styles.projectTile,
                { backgroundColor: bgColor },
                pressed && styles.tilePressed,
            ]}
            onPress={() => {
                Haptics.selectionAsync();
                onPress();
            }}
        >
            <Text style={styles.projectEmoji}>{project.icon || '🎯'}</Text>
            <Text style={styles.projectName} numberOfLines={1}>{project.name}</Text>
            <Text style={styles.projectFraction}>{completedTasks}/{totalTasks}</Text>
            <View style={styles.projectBarContainer}>
                <View
                    style={[
                        styles.projectBarFill,
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

const NoProjectsTile = memo(function NoProjectsTile({
    onPress,
}: {
    onPress: () => void;
}) {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.tileFullWidth,
                styles.projectTile,
                styles.emptyTile,
                { height: 120 },
                pressed && styles.tilePressed,
            ]}
            onPress={() => {
                Haptics.selectionAsync();
                onPress();
            }}
        >
            <Text style={styles.emptyTileTitle}>Add Projects</Text>
            <Text style={styles.emptyTileSubtitle}>Organize your goals</Text>
        </Pressable>
    );
});

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
            style={[
                styles.supplementChip,
                isTaken
                    ? styles.supplementChipTaken
                    : styles.supplementChipNotTaken,
            ]}
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onToggle();
            }}
            hitSlop={4}
        >
            <Text style={styles.supplementChipEmoji}>{supplement.emoji || '💊'}</Text>
            {isTaken && (
                <View style={styles.supplementChipCheck}>
                    <Check size={10} color="#fff" strokeWidth={3} />
                </View>
            )}
        </Pressable>
    );
});

const SupplementsTile = memo(function SupplementsTile({
    supplements,
    takenCount,
    isTakenToday,
    onToggle,
    onPress,
}: {
    supplements: Supplement[];
    takenCount: number;
    isTakenToday: (s: Supplement) => boolean;
    onToggle: (id: string) => void;
    onPress: () => void;
}) {
    if (supplements.length === 0) {
        return (
            <Pressable
                style={({ pressed }) => [
                    styles.tileFullWidth,
                    styles.supplementsTile,
                    styles.emptyTile,
                    pressed && styles.tilePressed,
                ]}
                onPress={() => {
                    Haptics.selectionAsync();
                    onPress();
                }}
            >
                <Text style={styles.emptyTileTitle}>Add Supplements</Text>
                <Text style={styles.emptyTileSubtitle}>Track your daily supplements</Text>
            </Pressable>
        );
    }

    return (
        <Pressable
            style={({ pressed }) => [
                styles.tileFullWidth,
                styles.supplementsTile,
                pressed && styles.tilePressed,
            ]}
            onPress={() => {
                Haptics.selectionAsync();
                onPress();
            }}
        >
            <View style={styles.supplementsTileHeader}>
                <Text style={styles.tileLabel}>Supplements</Text>
                <Text style={styles.supplementsCount}>
                    {takenCount}/{supplements.length}
                </Text>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.supplementsRow}
                scrollEnabled={supplements.length > 7}
            >
                {supplements.map((supplement) => (
                    <SupplementChip
                        key={supplement.id}
                        supplement={supplement}
                        isTaken={isTakenToday(supplement)}
                        onToggle={() => onToggle(supplement.id)}
                    />
                ))}
            </ScrollView>
        </Pressable>
    );
});

const QuickLinkTile = memo(function QuickLinkTile({
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
                styles.tileHalf,
                styles.quickLinkTile,
                pressed && styles.tilePressed,
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
});

const TasksTile = memo(function TasksTile({
    todosToday,
    completedCount,
    onPress,
    onAddPress,
}: {
    todosToday: Todo[];
    completedCount: number;
    onPress: () => void;
    onAddPress: () => void;
}) {
    if (todosToday.length === 0) {
        return (
            <Pressable
                style={({ pressed }) => [
                    styles.tileFullWidth,
                    styles.tasksTile,
                    styles.emptyTile,
                    pressed && styles.tilePressed,
                ]}
                onPress={() => {
                    Haptics.selectionAsync();
                    onAddPress();
                }}
            >
                <Text style={styles.emptyTileTitle}>Add Tasks</Text>
                <Text style={styles.emptyTileSubtitle}>Plan your day</Text>
            </Pressable>
        );
    }

    const pendingTodos = todosToday.filter(t => !t.completed).slice(0, 3);

    return (
        <Pressable
            style={({ pressed }) => [
                styles.tileFullWidth,
                styles.tasksTile,
                pressed && styles.tilePressed,
            ]}
            onPress={() => {
                Haptics.selectionAsync();
                onPress();
            }}
        >
            <View style={styles.tasksTileHeader}>
                <Text style={styles.tileLabel}>Tasks</Text>
                <Text style={styles.tasksCount}>
                    {completedCount}/{todosToday.length}
                </Text>
            </View>

            <View style={styles.tasksTileBody}>
                {pendingTodos.map((todo) => (
                    <View key={todo.id} style={styles.taskPreviewRow}>
                        <View style={styles.taskPreviewDot} />
                        <Text style={styles.taskPreviewText} numberOfLines={1}>
                            {todo.title}
                        </Text>
                    </View>
                ))}
                {todosToday.filter(t => !t.completed).length > 3 && (
                    <Text style={styles.taskPreviewMore}>
                        +{todosToday.filter(t => !t.completed).length - 3} more
                    </Text>
                )}
            </View>

            <Pressable
                style={({ pressed }) => [
                    styles.tasksAddButton,
                    pressed && { opacity: 0.7 },
                ]}
                onPress={(e) => {
                    e.stopPropagation();
                    Haptics.selectionAsync();
                    onAddPress();
                }}
            >
                <Plus size={14} color="#5AC8FA" strokeWidth={2.5} />
                <Text style={styles.tasksAddButtonText}>Add task</Text>
            </Pressable>
        </Pressable>
    );
});

// --- Main Screen ---

export default function LifeScreen() {
    const router = useRouter();
    const { items: inboxItems } = useInbox();
    const { habits, isCompletedToday, getWeeklyProgress } = useHabits();
    const { activeProjects, getProjectProgress } = useProjects();
    const { activeSupplements, isTakenToday, toggleTaken } = useSupplements();
    const { stats: groceryStats } = useGroceries();
    const { activeTrips } = useTravel();
    const { getTodosForDate } = useTodos();

    const todayInfo = useMemo(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const today = `${year}-${month}-${day}`;
        const dayOfWeek = now.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
        return { today, dayOfWeek };
    }, []);

    const habitsToday = useMemo(() => {
        return habits.filter(h =>
            !h.scheduledDays || h.scheduledDays.length === 0 || h.scheduledDays.includes(todayInfo.dayOfWeek)
        );
    }, [habits, todayInfo.dayOfWeek]);

    const habitsCompletedToday = useMemo(() => {
        return habitsToday.filter(h => h.completedDates.includes(todayInfo.today)).length;
    }, [habitsToday, todayInfo.today]);

    const displayHabits = useMemo(() => {
        return habitsToday.slice(0, 6);
    }, [habitsToday]);

    const todosToday = useMemo(() => getTodosForDate(new Date()), [getTodosForDate]);
    const todosCompletedToday = useMemo(() => todosToday.filter(t => t.completed).length, [todosToday]);

    const displayProjects = useMemo(() => activeProjects.slice(0, 2), [activeProjects]);

    const supplementsTakenToday = useMemo(() => {
        return activeSupplements.filter(s => isTakenToday(s)).length;
    }, [activeSupplements, isTakenToday]);

    const handleHabitPress = useCallback((id: string) => {
        router.push({ pathname: '/habit-detail', params: { id } });
    }, [router]);

    const handleProjectPress = useCallback((id: string) => {
        router.push(`/project/${id}` as any);
    }, [router]);

    return (
        <View style={styles.container}>
            <AmbientBackground />
            <SafeAreaView edges={['top']} style={styles.safeArea}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                    {/* Header */}
                    <View style={styles.headerContainer}>
                        <View style={styles.headerTopRow}>
                            <Text style={styles.headerDateLabel}>
                                {format(new Date(), 'EEEE, MMMM d').toUpperCase()}
                            </Text>
                            <View style={styles.headerActions}>
                                <Pressable
                                    style={({ pressed }) => [styles.headerIconButton, pressed && { opacity: 0.6 }]}
                                    onPress={() => router.push('/menu')}
                                >
                                    <Settings size={20} color="#8E8E93" />
                                </Pressable>
                                <Pressable
                                    style={({ pressed }) => [styles.headerIconButton, pressed && { opacity: 0.6 }]}
                                    onPress={() => router.push('/inbox')}
                                >
                                    <Inbox size={20} color="#007AFF" />
                                    {inboxItems.length > 0 && (
                                        <View style={styles.headerBadge}>
                                            <Text style={styles.headerBadgeText}>
                                                {inboxItems.length > 9 ? '9+' : inboxItems.length}
                                            </Text>
                                        </View>
                                    )}
                                </Pressable>
                            </View>
                        </View>
                        <View style={styles.headerTitleRow}>
                            <Text style={styles.headerLargeTitle}>Life</Text>
                        </View>
                    </View>

                    {/* Grid Container */}
                    <View style={styles.gridContainer}>
                        {/* Row 1: Full-width Habits Tile */}
                        <HabitTile
                            habitsToday={habitsToday}
                            habitsCompletedToday={habitsCompletedToday}
                            displayHabits={displayHabits}
                            todayStr={todayInfo.today}
                            onPress={() => {
                                if (habitsToday.length === 0) {
                                    router.push('/add-habit');
                                } else {
                                    router.push('/habits' as any);
                                }
                            }}
                        />

                        {/* Row 2: Tasks Tile */}
                        <TasksTile
                            todosToday={todosToday}
                            completedCount={todosCompletedToday}
                            onPress={() => router.push('/')}
                            onAddPress={() => router.push('/add-todo')}
                        />

                        {/* Row 3: Two Project Tiles or single "No projects" tile */}
                        {displayProjects.length === 0 ? (
                            <NoProjectsTile
                                onPress={() => router.push('/add-project' as any)}
                            />
                        ) : (
                            <View style={styles.row}>
                                {displayProjects.map((project) => (
                                    <ProjectTile
                                        key={project.id}
                                        project={project}
                                        progress={getProjectProgress(project)}
                                        onPress={() => handleProjectPress(project.id)}
                                    />
                                ))}
                                {displayProjects.length === 1 && (
                                    <Pressable
                                        style={({ pressed }) => [
                                            styles.tileHalf,
                                            styles.projectTile,
                                            styles.emptyTile,
                                            { height: 120 },
                                            pressed && styles.tilePressed,
                                        ]}
                                        onPress={() => {
                                            Haptics.selectionAsync();
                                            router.push('/add-project' as any);
                                        }}
                                    >
                                        <Text style={styles.emptyTileTitle}>Add Project</Text>
                                        <Text style={styles.emptyTileSubtitle}>New goal</Text>
                                    </Pressable>
                                )}
                            </View>
                        )}

                        {/* Row 3: Full-width Supplements Tile */}
                        <SupplementsTile
                            supplements={activeSupplements}
                            takenCount={supplementsTakenToday}
                            isTakenToday={isTakenToday}
                            onToggle={(id) => toggleTaken(id)}
                            onPress={() => router.push('/add-supplement')}
                        />

                        {/* Row 4: Two Quick Link Tiles */}
                        <View style={styles.row}>
                            <QuickLinkTile
                                emoji="🛒"
                                title="Groceries"
                                badge={groceryStats.onListCount > 0 ? `${groceryStats.onListCount} items` : 'None'}
                                onPress={() => router.push('/groceries')}
                            />
                            <QuickLinkTile
                                emoji="✈️"
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
    headerContainer: {
        paddingTop: 10,
        paddingBottom: 4,
        marginBottom: 12,
    },
    headerTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 4,
        height: 32,
    },
    headerDateLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
        letterSpacing: 0.5,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerIconButton: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        backgroundColor: 'rgba(242, 242, 247, 0.8)',
    },
    headerBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: '#FF3B30',
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 3,
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    headerBadgeText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#fff',
    },
    headerTitleRow: {
        paddingHorizontal: 20,
        marginBottom: 4,
    },
    headerLargeTitle: {
        fontSize: 34,
        fontWeight: '800',
        color: '#000',
        letterSpacing: 0.3,
    },

    // Grid Layout
    gridContainer: {
        paddingHorizontal: GRID_PADDING,
        gap: GRID_GAP,
    },
    row: {
        flexDirection: 'row',
        gap: GRID_GAP,
    },

    // Base Tile Styles
    tileFullWidth: {
        width: TILE_FULL,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    tileHalf: {
        width: TILE_HALF,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    tilePressed: {
        opacity: 0.85,
    },

    // Empty Tile
    emptyTile: {
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: 'rgba(60,60,67,0.15)',
        backgroundColor: 'rgba(255,255,255,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    emptyTileTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#8E8E93',
        marginBottom: 4,
    },
    emptyTileSubtitle: {
        fontSize: 13,
        color: '#AEAEB2',
    },

    // Tile Label (shared)
    tileLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
        letterSpacing: -0.2,
    },

    // --- Habit Tile ---
    habitTile: {
        backgroundColor: 'rgba(90,200,250,0.06)',
        height: 160,
        padding: 20,
    },
    habitTileHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    habitPercentageBadge: {
        backgroundColor: 'rgba(90,200,250,0.12)',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 10,
    },
    habitPercentageText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#5AC8FA',
    },
    habitTileBody: {
        flex: 1,
        justifyContent: 'center',
    },
    habitBigNumber: {
        fontSize: 40,
        fontWeight: '800',
        color: '#5AC8FA',
        letterSpacing: -1,
    },
    habitCountLabel: {
        fontSize: 14,
        color: '#8E8E93',
        marginTop: -2,
    },
    habitEmojiRow: {
        flexDirection: 'row',
        gap: 8,
    },
    habitEmojiCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    habitEmojiCircleComplete: {
        backgroundColor: 'rgba(90,200,250,0.15)',
    },
    habitEmojiCircleIncomplete: {
        backgroundColor: 'rgba(60,60,67,0.08)',
    },
    habitEmojiCircleMore: {
        backgroundColor: 'rgba(60,60,67,0.08)',
    },
    habitEmojiText: {
        fontSize: 18,
    },
    habitMoreText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#8E8E93',
    },

    // --- Project Tile ---
    projectTile: {
        height: 120,
        padding: 16,
        justifyContent: 'space-between',
    },
    projectEmoji: {
        fontSize: 28,
    },
    projectName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#000',
        letterSpacing: -0.2,
        marginTop: 4,
    },
    projectFraction: {
        fontSize: 13,
        fontWeight: '500',
        color: '#8E8E93',
    },
    projectBarContainer: {
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(60,60,67,0.08)',
        marginTop: 4,
    },
    projectBarFill: {
        height: 4,
        borderRadius: 2,
    },

    // --- Supplements Tile ---
    supplementsTile: {
        backgroundColor: 'rgba(90,200,250,0.06)',
        padding: 20,
    },
    supplementsTileHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    supplementsCount: {
        fontSize: 13,
        fontWeight: '600',
        color: '#5AC8FA',
    },
    supplementsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    supplementChip: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
    },
    supplementChipTaken: {
        borderColor: '#5AC8FA',
        backgroundColor: 'rgba(90,200,250,0.08)',
    },
    supplementChipNotTaken: {
        borderColor: 'rgba(60,60,67,0.15)',
        backgroundColor: 'rgba(255,255,255,0.6)',
    },
    supplementChipEmoji: {
        fontSize: 18,
    },
    supplementChipCheck: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#5AC8FA',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // --- Quick Link Tile ---
    quickLinkTile: {
        height: 90,
        backgroundColor: 'rgba(0,0,0,0.03)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    quickLinkEmoji: {
        fontSize: 32,
        marginBottom: 6,
    },
    quickLinkTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
        letterSpacing: -0.2,
    },
    quickLinkBadge: {
        fontSize: 12,
        color: '#8E8E93',
        marginTop: 2,
    },

    // --- Tasks Tile ---
    tasksTile: {
        backgroundColor: 'rgba(90,200,250,0.06)',
        padding: 20,
    },
    tasksTileHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    tasksCount: {
        fontSize: 13,
        fontWeight: '600',
        color: '#5AC8FA',
    },
    tasksTileBody: {
        gap: 8,
    },
    taskPreviewRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    taskPreviewDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#5AC8FA',
    },
    taskPreviewText: {
        fontSize: 15,
        fontWeight: '400',
        color: '#1C1C1E',
        flex: 1,
    },
    taskPreviewMore: {
        fontSize: 13,
        color: '#8E8E93',
        marginTop: 2,
        marginLeft: 18,
    },
    tasksAddButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 12,
        alignSelf: 'flex-start',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        backgroundColor: 'rgba(90,200,250,0.08)',
    },
    tasksAddButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#5AC8FA',
    },
});
