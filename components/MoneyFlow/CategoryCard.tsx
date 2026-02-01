import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Animated,
    Dimensions,
} from 'react-native';
import { useSpending } from '@/contexts/SpendingContext';
import { formatCurrency } from '@/types/spending';
import * as Haptics from 'expo-haptics';

import { Pencil } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CategoryCardProps {
    categoryId: string;
    name: string;
    emoji: string;
    color: string;
    budget: number;
    onPress: () => void;
    onLongPress?: () => void;
}

export function CategoryCard({
    categoryId,
    name,
    emoji,
    color,
    budget,
    onPress,
    onLongPress,
}: CategoryCardProps) {
    const { getSpentInCategory, getBudgetPercentage, getRemainingBudget } = useSpending();

    const spent = getSpentInCategory(categoryId);
    const percentage = getBudgetPercentage(categoryId);
    const remaining = getRemainingBudget(categoryId);

    const scaleAnim = useRef(new Animated.Value(1)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    // Animate progress when percentage changes
    useEffect(() => {
        Animated.spring(progressAnim, {
            toValue: Math.min(percentage, 100),
            useNativeDriver: false,
            tension: 40,
            friction: 8,
        }).start();
    }, [percentage]);

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.97,
            useNativeDriver: true,
            tension: 300,
            friction: 15,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 300,
            friction: 15,
        }).start();
    };

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
    };

    const handleLongPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onLongPress?.();
    };

    // Determine progress bar color based on usage
    const getProgressColor = () => {
        if (percentage >= 90) return '#FF3B30';
        if (percentage >= 75) return '#FF9500';
        return color;
    };

    // Status indicator
    const getStatusText = () => {
        if (percentage >= 100) return 'Over budget';
        if (percentage >= 90) return 'Almost done';
        if (percentage >= 75) return 'Getting low';
        return null;
    };

    const statusText = getStatusText();

    return (
        <Pressable
            onPress={handlePress}
            onLongPress={handleLongPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            delayLongPress={400}
        >
            <Animated.View
                style={[
                    styles.card,
                    { transform: [{ scale: scaleAnim }] },
                ]}
            >
                {/* Header row */}
                <View style={styles.header}>
                    <View style={styles.emojiContainer}>
                        <Text style={styles.emoji}>{emoji}</Text>
                    </View>
                    <View style={styles.headerRight}>
                        {statusText && (
                            <View style={[
                                styles.statusBadge,
                                percentage >= 90 && styles.statusBadgeCritical
                            ]}>
                                <Text style={[
                                    styles.statusText,
                                    percentage >= 90 && styles.statusTextCritical
                                ]}>
                                    {statusText}
                                </Text>
                            </View>
                        )}
                        {onLongPress && (
                            <Pencil size={12} color="#8E8E93" style={styles.editIcon} />
                        )}
                    </View>
                </View>

                {/* Category name */}
                <Text style={styles.name} numberOfLines={1}>{name}</Text>

                {/* Amount info */}
                <View style={styles.amountRow}>
                    <Text style={styles.remaining}>{formatCurrency(remaining)}</Text>
                    <Text style={styles.remainingLabel}> left</Text>
                </View>
                <Text style={styles.budget}>of {formatCurrency(budget)}</Text>

                {/* Progress bar */}
                <View style={styles.progressContainer}>
                    <Animated.View
                        style={[
                            styles.progressBar,
                            {
                                backgroundColor: getProgressColor(),
                                width: progressAnim.interpolate({
                                    inputRange: [0, 100],
                                    outputRange: ['0%', '100%'],
                                }),
                            },
                        ]}
                    />
                </View>
            </Animated.View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        width: (SCREEN_WIDTH - 52) / 2,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    editIcon: {
        opacity: 0.6,
    },
    emojiContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emoji: {
        fontSize: 18,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        backgroundColor: '#FFF3E0',
        borderRadius: 6,
    },
    statusBadgeCritical: {
        backgroundColor: '#FFEBEE',
    },
    statusText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#FF9500',
    },
    statusTextCritical: {
        color: '#FF3B30',
    },
    name: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
        marginBottom: 8,
    },
    amountRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    remaining: {
        fontSize: 20,
        fontWeight: '700',
        color: '#000',
        letterSpacing: -0.5,
    },
    remainingLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#8E8E93',
    },
    budget: {
        fontSize: 13,
        color: '#8E8E93',
        marginTop: 2,
        marginBottom: 10,
    },
    progressContainer: {
        height: 4,
        backgroundColor: '#F2F2F7',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: 2,
    },
});
