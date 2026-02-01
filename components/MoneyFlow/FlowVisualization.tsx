import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Animated,
    Dimensions,
} from 'react-native';
import { useSpending } from '@/contexts/SpendingContext';
import { formatCurrency } from '@/types/spending';
import { Pencil } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FlowVisualizationProps {
    onIncomeLongPress?: () => void;
}

export function FlowVisualization({ onIncomeLongPress }: FlowVisualizationProps) {
    const { categories, monthlyIncome, getTotalSpent, getSpentInCategory } = useSpending();
    const totalSpent = getTotalSpent();
    const remaining = monthlyIncome - totalSpent;
    const percentRemaining = monthlyIncome > 0 ? (remaining / monthlyIncome) * 100 : 100;

    const scaleAnim = useRef(new Animated.Value(0.95)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 50,
                friction: 8,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    // Categories with spending
    const spentCategories = categories
        .map(cat => ({
            ...cat,
            spent: getSpentInCategory(cat.id),
        }))
        .filter(cat => cat.spent > 0)
        .sort((a, b) => b.spent - a.spent)
        .slice(0, 4);

    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const currentDay = new Date().getDate();
    const daysLeft = daysInMonth - currentDay;

    // Get progress bar color
    const getIncomeBarColor = () => {
        if (percentRemaining >= 50) return '#34C759';
        if (percentRemaining >= 25) return '#FF9500';
        return '#FF3B30';
    };

    return (
        <View style={styles.container}>
            <Pressable
                onLongPress={onIncomeLongPress}
                delayLongPress={400}
                style={({ pressed }) => [
                    { opacity: pressed ? 0.95 : 1 }
                ]}
            >
                <Animated.View
                    style={[
                        styles.incomeCard,
                        {
                            opacity: opacityAnim,
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                >
                    {/* Top section */}
                    <View style={styles.topSection}>
                        <View style={styles.incomeInfo}>
                            <View style={styles.labelRow}>
                                <Text style={styles.incomeLabel}>Monthly Budget</Text>
                                <Pencil size={12} color="#8E8E93" style={styles.editIcon} />
                            </View>
                            <Text style={styles.incomeAmount}>{formatCurrency(monthlyIncome)}</Text>
                        </View>

                        {/* Circular progress indicator */}
                        <View style={styles.circleContainer}>
                            <View style={styles.circleOuter}>
                                <View style={[
                                    styles.circleProgress,
                                    {
                                        height: `${Math.max(5, percentRemaining)}%`,
                                        backgroundColor: getIncomeBarColor(),
                                    }
                                ]} />
                            </View>
                            <Text style={styles.circlePercent}>{Math.round(percentRemaining)}%</Text>
                        </View>
                    </View>

                    {/* Bottom stats row */}
                    <View style={styles.statsGrid}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{formatCurrency(remaining)}</Text>
                            <Text style={styles.statLabel}>Remaining</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{formatCurrency(totalSpent)}</Text>
                            <Text style={styles.statLabel}>Spent</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{daysLeft}</Text>
                            <Text style={styles.statLabel}>Days left</Text>
                        </View>
                    </View>
                </Animated.View>
            </Pressable>

            {/* Spending breakdown - only show if there's spending */}
            {spentCategories.length > 0 && (
                <View style={styles.breakdownCard}>
                    <Text style={styles.breakdownTitle}>Top Spending</Text>
                    <View style={styles.breakdownList}>
                        {spentCategories.map((cat, index) => (
                            <View key={cat.id} style={styles.breakdownItem}>
                                <View style={styles.breakdownLeft}>
                                    <View style={[styles.breakdownDot, { backgroundColor: cat.color }]} />
                                    <Text style={styles.breakdownEmoji}>{cat.emoji}</Text>
                                    <Text style={styles.breakdownName} numberOfLines={1}>{cat.name}</Text>
                                </View>
                                <Text style={styles.breakdownAmount}>{formatCurrency(cat.spent)}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 8,
    },
    incomeCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },
    topSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    incomeInfo: {
        flex: 1,
    },
    incomeLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: '#8E8E93',
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    editIcon: {
        opacity: 0.8,
    },
    incomeAmount: {
        fontSize: 32,
        fontWeight: '700',
        color: '#000',
        letterSpacing: -0.5,
    },
    circleContainer: {
        alignItems: 'center',
        gap: 6,
    },
    circleOuter: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#F2F2F7',
        overflow: 'hidden',
        justifyContent: 'flex-end',
    },
    circleProgress: {
        width: '100%',
        borderRadius: 26,
    },
    circlePercent: {
        fontSize: 12,
        fontWeight: '600',
        color: '#8E8E93',
    },
    statsGrid: {
        flexDirection: 'row',
        backgroundColor: '#F9F9F9',
        borderRadius: 12,
        padding: 14,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 17,
        fontWeight: '700',
        color: '#000',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 12,
        color: '#8E8E93',
    },
    statDivider: {
        width: 1,
        backgroundColor: '#E5E5EA',
        marginVertical: 2,
    },
    breakdownCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 1,
    },
    breakdownTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
        marginBottom: 12,
    },
    breakdownList: {
        gap: 10,
    },
    breakdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    breakdownLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 10,
    },
    breakdownDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    breakdownEmoji: {
        fontSize: 16,
    },
    breakdownName: {
        fontSize: 15,
        color: '#000',
        flex: 1,
    },
    breakdownAmount: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
    },
});
