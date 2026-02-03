import React, { useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Sparkles, Zap, Target, Pill, ShoppingCart, Mic } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';

import * as Haptics from 'expo-haptics';
import { AmbientBackground } from '@/components/AmbientBackground';
import { BottomNavBar } from '@/components/BottomNavBar';
import { useHabits } from '@/contexts/HabitContext';
import { useProjects } from '@/contexts/ProjectContext';
import { useSupplements } from '@/contexts/SupplementContext';
import { useGroceries } from '@/contexts/GroceryContext';
import { useJournal } from '@/contexts/JournalContext';

// Progress Ring Component - Proper SVG with rounded caps
function ProgressRing({ progress, size = 60, strokeWidth = 5, color = '#34C759' }: {
    progress: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
}) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progressValue = Math.min(Math.max(progress, 0), 1);
    const strokeDashoffset = circumference * (1 - progressValue);

    return (
        <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
            {/* Background circle */}
            <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={color + '20'}
                strokeWidth={strokeWidth}
                fill="none"
            />
            {/* Progress circle with rounded caps */}
            <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={color}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
            />
        </Svg>
    );
}

// Large Featured Card
function HeroCard({
    title,
    emoji,
    primaryStat,
    secondaryStat,
    progress,
    color,
    onPress,
}: {
    title: string;
    emoji: string;
    primaryStat: string;
    secondaryStat?: string;
    progress?: number;
    color: string;
    onPress: () => void;
}) {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.heroCard,
                pressed && { opacity: 0.8 }
            ]}
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onPress();
            }}
        >
            <View style={styles.heroCardHeader}>
                <View style={[styles.heroEmoji, { backgroundColor: color + '0D' }]}>
                    <Text style={styles.heroEmojiText}>{emoji}</Text>
                </View>
                <Text style={styles.heroTitle}>{title}</Text>
            </View>

            <View style={styles.heroContent}>
                <View>
                    <Text style={styles.heroPrimaryStat}>{primaryStat}</Text>
                    {secondaryStat && (
                        <Text style={styles.heroSecondaryStat}>
                            {secondaryStat}
                        </Text>
                    )}
                </View>

                {progress !== undefined && (
                    <ProgressRing progress={progress} size={70} strokeWidth={6} color={color} />
                )}
            </View>
        </Pressable>
    );
}

// Compact Card
function CompactCard({
    title,
    Icon,
    stat,
    subtitle,
    color,
    onPress,
}: {
    title: string;
    Icon: any;
    stat: string;
    subtitle?: string;
    color: string;
    onPress: () => void;
}) {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.compactCard,
                pressed && { opacity: 0.8, backgroundColor: '#F8F8F8' }
            ]}
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onPress();
            }}
        >
            <View style={[styles.compactIconBg, { backgroundColor: color + '0D' }]}>
                <Icon size={20} color={color} strokeWidth={2.5} />
            </View>

            <Text style={styles.compactTitle}>{title}</Text>

            <Text style={[styles.compactStat, { color }]}>{stat}</Text>

            {subtitle && (
                <Text style={styles.compactSubtitle}>{subtitle}</Text>
            )}
        </Pressable>
    );
}


export default function LifeScreen() {
    const router = useRouter();
    const { habits, getOverallStats } = useHabits();
    const { projects } = useProjects();
    const { activeSupplements, isTakenToday } = useSupplements();
    const { stats: groceryStats } = useGroceries();
    const { hasTodayEntry, getTodayEntries, totalEntries } = useJournal();

    // Calculate live stats
    const habitStats = useMemo(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const today = `${year}-${month}-${day}`;

        const dayOfWeek = now.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6; // Type matching DayOfWeek

        const habitsToday = habits.filter(h =>
            !h.scheduledDays || h.scheduledDays.length === 0 || h.scheduledDays.includes(dayOfWeek)
        );

        const completedToday = habitsToday.filter(h => h.completedDates.includes(today)).length;
        const total = habitsToday.length;

        const stats = getOverallStats;
        return { completedToday, total, longestStreak: stats.longestStreak };
    }, [habits, getOverallStats]);

    const projectStats = useMemo(() => {
        const active = projects.filter(p => {
            const completedTasks = p.tasks.filter(t => t.completed).length;
            return completedTasks < p.tasks.length;
        }).length;
        const totalTasks = projects.reduce((sum, p) => sum + p.tasks.length, 0);
        const completedTasks = projects.reduce((sum, p) => sum + p.tasks.filter(t => t.completed).length, 0);
        return { active, totalTasks, completedTasks };
    }, [projects]);

    const supplementStats = useMemo(() => {
        // useSupplements provides isTakenToday which already handles the local date check
        const takenToday = activeSupplements.filter(s => isTakenToday(s)).length;

        // Filter supplements that should be taken today (daily coverage)
        // Note: Supplement "frequency" logic is inside isCompleteForFrequency but we can do a simple check here
        // or just rely on total active supplements if we assume daily usage for now.
        // Given current simple implementation of supplements, 'total' usually means all active ones.
        return { takenToday, total: activeSupplements.length };
    }, [activeSupplements, isTakenToday]);

    // Calculate completion percentage for progress ring
    const habitsProgress = habitStats.total > 0 ? habitStats.completedToday / habitStats.total : 0;
    const supplementsProgress = supplementStats.total > 0 ? supplementStats.takenToday / supplementStats.total : 0;

    return (
        <View style={styles.container}>
            <AmbientBackground />
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Page Header */}
                    <View style={styles.pageHeader}>
                        <Text style={styles.subDate}>YOUR LIFE</Text>
                        <Text style={styles.mainDate}>Overview</Text>
                    </View>

                    {/* Hero Cards - Featured Systems */}
                    <View style={styles.heroSection}>
                        <HeroCard
                            emoji="⚡️"
                            title="Habits"
                            primaryStat={habitStats.total > 0
                                ? `${habitStats.completedToday}/${habitStats.total} today`
                                : 'No habits yet'}
                            secondaryStat={habitStats.longestStreak > 0
                                ? `${habitStats.longestStreak} day streak`
                                : 'Start building'}
                            progress={habitsProgress}
                            color="#34C759"
                            onPress={() => router.push('/habits')}
                        />

                        <HeroCard
                            emoji="🎯"
                            title="Projects"
                            primaryStat={projectStats.active > 0
                                ? `${projectStats.active} active`
                                : 'No active projects'}
                            secondaryStat={projectStats.totalTasks > 0
                                ? `${projectStats.completedTasks}/${projectStats.totalTasks} tasks done`
                                : 'Create your first'}
                            progress={projectStats.totalTasks > 0
                                ? projectStats.completedTasks / projectStats.totalTasks
                                : 0}
                            color="#FF9500"
                            onPress={() => router.push('/projects')}
                        />
                    </View>

                    {/* Compact Cards Grid */}
                    <View style={styles.compactSection}>
                        <CompactCard
                            Icon={Pill}
                            title="Supplements"
                            stat={supplementStats.total > 0
                                ? `${supplementStats.takenToday}/${supplementStats.total}`
                                : '0'}
                            subtitle="taken today"
                            color="#AF52DE"
                            onPress={() => router.push('/add-supplement')}
                        />

                        <CompactCard
                            Icon={ShoppingCart}
                            title="Groceries"
                            stat={groceryStats.onListCount > 0
                                ? `${groceryStats.onListCount}`
                                : '0'}
                            subtitle={groceryStats.onListCount > 0 ? 'to buy' : 'items'}
                            color="#30D158"
                            onPress={() => router.push('/groceries')}
                        />
                    </View>

                    {/* Journal Card */}
                    <View style={styles.compactSection}>
                        <CompactCard
                            Icon={Mic}
                            title="Journal"
                            stat={hasTodayEntry ? `${getTodayEntries().length}` : '0'}
                            subtitle={hasTodayEntry ? 'entries today' : 'start recording'}
                            color="#5856D6"
                            onPress={() => router.push('/journal')}
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
        backgroundColor: '#F2F2F7',
    },
    safeArea: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 120,
    },

    // Page Header
    pageHeader: {
        paddingHorizontal: 24,
        marginTop: 8,
        marginBottom: 28,
    },
    subDate: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
        marginBottom: 4,
        letterSpacing: 0.8,
    },
    mainDate: {
        fontSize: 34,
        fontWeight: '700',
        color: '#000',
        letterSpacing: -1,
    },

    // Hero Cards Section
    heroSection: {
        paddingHorizontal: 20,
        gap: 16,
        marginBottom: 20,
    },
    heroCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 4,
        overflow: 'hidden',
        position: 'relative',
    },
    heroCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    heroEmoji: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    heroEmojiText: {
        fontSize: 24,
    },
    heroTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000',
        letterSpacing: -0.3,
    },
    heroContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    heroPrimaryStat: {
        fontSize: 28,
        fontWeight: '700',
        color: '#000',
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    heroSecondaryStat: {
        fontSize: 15,
        fontWeight: '500',
        color: '#8E8E93',
        letterSpacing: -0.2,
    },


    // Compact Cards Section
    compactSection: {
        paddingHorizontal: 20,
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    compactCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 2,
    },
    compactIconBg: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    compactTitle: {
        fontSize: 15,
        fontWeight: '500',
        color: '#000',
        marginBottom: 8,
        letterSpacing: -0.2,
    },
    compactStat: {
        fontSize: 26,
        fontWeight: '700',
        letterSpacing: -0.5,
        marginBottom: 2,
    },
    compactSubtitle: {
        fontSize: 13,
        fontWeight: '500',
        color: '#8E8E93',
    },

});
