import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Animated,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Droplets } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useWater } from '@/contexts/WaterContext';

// Animated progress ring
function ProgressRing({
    progress,
    size = 64,
    strokeWidth = 5,
    color = '#007AFF'
}: {
    progress: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
}) {
    const animatedProgress = useRef(new Animated.Value(0)).current;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    useEffect(() => {
        Animated.spring(animatedProgress, {
            toValue: progress,
            useNativeDriver: false,
            tension: 40,
            friction: 7,
        }).start();
    }, [progress, animatedProgress]);

    const strokeDashoffset = animatedProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [circumference, 0],
    });

    return (
        <View style={{ width: size, height: size }}>
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
            </Svg>
            <Animated.View style={[StyleSheet.absoluteFill]}>
                <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference * (1 - Math.min(progress, 1))}
                        strokeLinecap="round"
                        fill="none"
                    />
                </Svg>
            </Animated.View>
        </View>
    );
}

// Format ml to display string
function formatAmount(ml: number): string {
    if (ml >= 1000) {
        return `${(ml / 1000).toFixed(1)}L`;
    }
    return `${ml}ml`;
}

export function WaterCard() {
    const { stats, addWater, settings } = useWater();
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handleAddWater = async (type: 'glass' | 'bottle') => {
        // Haptic feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        // Animate button
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 0.95,
                duration: 50,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 300,
                friction: 10,
            }),
        ]).start();

        const reachedGoal = await addWater(type);

        if (reachedGoal) {
            // Celebration haptic when goal is reached!
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    };

    const color = stats.isComplete ? '#34C759' : '#007AFF';

    return (
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={[styles.iconBg, { backgroundColor: color + '15' }]}>
                    <Droplets size={22} color={color} strokeWidth={2.5} />
                </View>
                <Text style={styles.title}>Water</Text>
            </View>

            {/* Content */}
            <View style={styles.content}>
                <View style={styles.statsContainer}>
                    <Text style={styles.primaryStat}>
                        {formatAmount(stats.total)}
                        <Text style={styles.goalText}> / {formatAmount(stats.goal)}</Text>
                    </Text>
                    <Text style={styles.secondaryStat}>
                        {stats.isComplete
                            ? '✓ Goal reached!'
                            : `${formatAmount(stats.remaining)} to go`}
                    </Text>
                </View>
                <ProgressRing progress={stats.progress} size={64} strokeWidth={5} color={color} />
            </View>

            {/* Quick Add Buttons */}
            <View style={styles.buttonRow}>
                <Pressable
                    style={({ pressed }) => [
                        styles.addButton,
                        pressed && styles.addButtonPressed,
                    ]}
                    onPress={() => handleAddWater('glass')}
                >
                    <Text style={styles.buttonEmoji}>🥛</Text>
                    <Text style={styles.buttonText}>Glass</Text>
                    <Text style={styles.buttonAmount}>{settings.glassSize}ml</Text>
                </Pressable>

                <Pressable
                    style={({ pressed }) => [
                        styles.addButton,
                        pressed && styles.addButtonPressed,
                    ]}
                    onPress={() => handleAddWater('bottle')}
                >
                    <Text style={styles.buttonEmoji}>🍶</Text>
                    <Text style={styles.buttonText}>Bottle</Text>
                    <Text style={styles.buttonAmount}>{settings.bottleSize}ml</Text>
                </Pressable>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 22,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    iconBg: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    title: {
        fontSize: 19,
        fontWeight: '600',
        color: '#000',
        letterSpacing: -0.4,
    },
    content: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    statsContainer: {
        flex: 1,
    },
    primaryStat: {
        fontSize: 26,
        fontWeight: '700',
        color: '#000',
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    goalText: {
        fontSize: 18,
        fontWeight: '500',
        color: '#8E8E93',
    },
    secondaryStat: {
        fontSize: 15,
        fontWeight: '500',
        color: '#8E8E93',
        letterSpacing: -0.2,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    addButton: {
        flex: 1,
        backgroundColor: '#F2F2F7',
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    addButtonPressed: {
        backgroundColor: '#E5E5EA',
        transform: [{ scale: 0.98 }],
    },
    buttonEmoji: {
        fontSize: 24,
        marginBottom: 4,
    },
    buttonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
        marginBottom: 2,
    },
    buttonAmount: {
        fontSize: 12,
        fontWeight: '500',
        color: '#8E8E93',
    },
});
