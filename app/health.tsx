import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, RefreshCw, Heart, Moon, Flame, MapPin } from 'lucide-react-native';
import Svg, { Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

import { AmbientBackground } from '@/components/AmbientBackground';
import { BottomNavBar } from '@/components/BottomNavBar';
import { useHealth } from '@/contexts/HealthContext';
import { format, parseISO } from 'date-fns';

function StepBarChart({ weeklySteps }: { weeklySteps: { date: string; steps: number }[] }) {
    const maxSteps = Math.max(...weeklySteps.map(d => d.steps), 1);
    const barMaxHeight = 120;

    return (
        <View style={chartStyles.container}>
            <View style={chartStyles.barsRow}>
                {weeklySteps.map((day) => {
                    const barHeight = Math.max((day.steps / maxSteps) * barMaxHeight, 4);
                    const dayLabel = format(parseISO(day.date), 'EEE').charAt(0);
                    const isToday =
                        day.date ===
                        `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;

                    return (
                        <View key={day.date} style={chartStyles.barColumn}>
                            <Text style={chartStyles.barValue}>
                                {day.steps >= 1000 ? `${(day.steps / 1000).toFixed(1)}k` : day.steps}
                            </Text>
                            <Svg width={32} height={barMaxHeight}>
                                {/* Background bar */}
                                <Rect
                                    x={4}
                                    y={0}
                                    width={24}
                                    height={barMaxHeight}
                                    rx={12}
                                    fill="#F2F2F7"
                                />
                                {/* Value bar */}
                                <Rect
                                    x={4}
                                    y={barMaxHeight - barHeight}
                                    width={24}
                                    height={barHeight}
                                    rx={12}
                                    fill={isToday ? '#34C759' : '#8E8E93'}
                                    opacity={isToday ? 1 : 0.4}
                                />
                            </Svg>
                            <Text style={[chartStyles.dayLabel, isToday && chartStyles.dayLabelToday]}>
                                {dayLabel}
                            </Text>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

function MetricCard({
    Icon,
    label,
    value,
    unit,
    color,
}: {
    Icon: any;
    label: string;
    value: string;
    unit?: string;
    color: string;
}) {
    return (
        <View style={metricStyles.card}>
            <View style={[metricStyles.iconBg, { backgroundColor: color + '15' }]}>
                <Icon size={20} color={color} strokeWidth={2.5} />
            </View>
            <Text style={metricStyles.label}>{label}</Text>
            <View style={metricStyles.valueRow}>
                <Text style={[metricStyles.value, { color }]}>{value}</Text>
                {unit && <Text style={metricStyles.unit}>{unit}</Text>}
            </View>
        </View>
    );
}

function ConnectPrompt({ onConnect }: { onConnect: () => void }) {
    return (
        <View style={promptStyles.container}>
            <Text style={promptStyles.emoji}>🏃‍♂️</Text>
            <Text style={promptStyles.title}>Connect Apple Health</Text>
            <Text style={promptStyles.body}>
                See your steps, distance, calories, heart rate, and sleep data right alongside your daily habits.
            </Text>
            <Pressable
                style={({ pressed }) => [promptStyles.button, pressed && { opacity: 0.8 }]}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onConnect();
                }}
            >
                <Text style={promptStyles.buttonText}>Connect</Text>
            </Pressable>
        </View>
    );
}

function NotAvailableMessage() {
    return (
        <View style={promptStyles.container}>
            <Text style={promptStyles.emoji}>📱</Text>
            <Text style={promptStyles.title}>Apple Health Not Available</Text>
            <Text style={promptStyles.body}>
                Apple Health integration is only available on iOS devices. Health data cannot be accessed on this platform.
            </Text>
        </View>
    );
}

export default function HealthScreen() {
    const router = useRouter();
    const {
        isAvailable,
        isAuthorized,
        isLoading,
        todayData,
        weeklySteps,
        formattedDistance,
        authorize,
        refresh,
    } = useHealth();

    return (
        <View style={styles.container}>
            <AmbientBackground />
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable
                        style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.5 }]}
                        onPress={() => router.back()}
                    >
                        <ChevronLeft size={28} color="#000" strokeWidth={2} />
                    </Pressable>
                    <Text style={styles.headerTitle}>Health</Text>
                    {isAuthorized && (
                        <Pressable
                            style={({ pressed }) => [styles.refreshButton, pressed && { opacity: 0.5 }]}
                            onPress={() => {
                                Haptics.selectionAsync();
                                refresh();
                            }}
                        >
                            <RefreshCw size={20} color="#8E8E93" strokeWidth={2} />
                        </Pressable>
                    )}
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {!isAvailable && <NotAvailableMessage />}

                    {isAvailable && !isAuthorized && (
                        <ConnectPrompt onConnect={authorize} />
                    )}

                    {isAvailable && isAuthorized && (
                        <>
                            {isLoading && (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="small" color="#8E8E93" />
                                </View>
                            )}

                            {/* Steps Hero */}
                            <View style={styles.stepsHero}>
                                <Text style={styles.stepsLabel}>Today's Steps</Text>
                                <Text style={styles.stepsValue}>
                                    {todayData.steps.toLocaleString()}
                                </Text>
                                <Text style={styles.stepsGoal}>
                                    {todayData.steps >= 10000
                                        ? 'Goal reached!'
                                        : `${(10000 - todayData.steps).toLocaleString()} to go`}
                                </Text>
                            </View>

                            {/* Weekly Steps Chart */}
                            {weeklySteps.length > 0 && (
                                <View style={styles.chartCard}>
                                    <Text style={styles.chartTitle}>This Week</Text>
                                    <StepBarChart weeklySteps={weeklySteps} />
                                </View>
                            )}

                            {/* Metrics Grid */}
                            <View style={styles.metricsGrid}>
                                <MetricCard
                                    Icon={MapPin}
                                    label="Distance"
                                    value={formattedDistance}
                                    color="#007AFF"
                                />
                                <MetricCard
                                    Icon={Flame}
                                    label="Active Cal"
                                    value={`${todayData.activeEnergy}`}
                                    unit="kcal"
                                    color="#FF9500"
                                />
                            </View>

                            <View style={styles.metricsGrid}>
                                <MetricCard
                                    Icon={Heart}
                                    label="Resting HR"
                                    value={todayData.restingHeartRate != null ? `${todayData.restingHeartRate}` : '--'}
                                    unit="bpm"
                                    color="#FF3B30"
                                />
                                <MetricCard
                                    Icon={Moon}
                                    label="Sleep"
                                    value={todayData.sleepHours != null ? `${todayData.sleepHours}` : '--'}
                                    unit="hrs"
                                    color="#AF52DE"
                                />
                            </View>
                        </>
                    )}
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        padding: 4,
        marginRight: 8,
    },
    headerTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: '700',
        color: '#000',
        letterSpacing: -0.3,
    },
    refreshButton: {
        padding: 8,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 120,
        paddingHorizontal: 20,
    },
    loadingContainer: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    stepsHero: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 28,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 4,
    },
    stepsLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#8E8E93',
        marginBottom: 8,
        letterSpacing: -0.2,
    },
    stepsValue: {
        fontSize: 56,
        fontWeight: '700',
        color: '#34C759',
        letterSpacing: -2,
        marginBottom: 4,
    },
    stepsGoal: {
        fontSize: 15,
        fontWeight: '500',
        color: '#8E8E93',
        letterSpacing: -0.2,
    },
    chartCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 2,
    },
    chartTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000',
        marginBottom: 16,
        letterSpacing: -0.3,
    },
    metricsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
});

const chartStyles = StyleSheet.create({
    container: {
        alignItems: 'center',
    },
    barsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        alignItems: 'flex-end',
    },
    barColumn: {
        alignItems: 'center',
        flex: 1,
        gap: 6,
    },
    barValue: {
        fontSize: 10,
        fontWeight: '600',
        color: '#8E8E93',
    },
    dayLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#8E8E93',
    },
    dayLabelToday: {
        color: '#34C759',
        fontWeight: '700',
    },
});

const metricStyles = StyleSheet.create({
    card: {
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
    iconBg: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    label: {
        fontSize: 13,
        fontWeight: '500',
        color: '#8E8E93',
        marginBottom: 4,
    },
    valueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    value: {
        fontSize: 24,
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    unit: {
        fontSize: 14,
        fontWeight: '500',
        color: '#8E8E93',
    },
});

const promptStyles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        marginTop: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 4,
    },
    emoji: {
        fontSize: 48,
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#000',
        letterSpacing: -0.3,
        marginBottom: 8,
    },
    body: {
        fontSize: 15,
        fontWeight: '400',
        color: '#8E8E93',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
        letterSpacing: -0.2,
    },
    button: {
        backgroundColor: '#34C759',
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 14,
    },
    buttonText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFFFFF',
        letterSpacing: -0.2,
    },
});
