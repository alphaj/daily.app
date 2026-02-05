import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';

interface Item {
    id: string;
    name: string;
    emoji?: string;
    completed: boolean;
    streak?: number;
}

interface VariantProps {
    items: Item[];
    onToggle: (id: string) => void;
    title: string;
}

export function HabitsVariant3({ items, onToggle, title }: VariantProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.headerTitle}>{title}</Text>
            <View style={styles.gridContainer}>
                {items.map((item) => (
                    <Pressable
                        key={item.id}
                        style={[styles.gridItem, item.completed && styles.gridItemActive]}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            onToggle(item.id);
                        }}
                    >
                        <View style={styles.topRow}>
                            <View style={[styles.iconCircle, item.completed && styles.iconCircleActive]}>
                                <Text style={styles.emoji}>{item.emoji || '⚡️'}</Text>
                            </View>
                            {item.completed && (
                                <View style={styles.checkBadge}>
                                    <Text style={styles.checkIcon}>✓</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.bottomContent}>
                            <Text style={[styles.label, item.completed && styles.labelActive]} numberOfLines={2}>
                                {item.name}
                            </Text>
                            {item.streak ? (
                                <Text style={[styles.streak, item.completed && styles.streakActive]}>
                                    {item.streak} day streak
                                </Text>
                            ) : null}
                        </View>
                    </Pressable>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
        paddingHorizontal: 20,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#000',
        letterSpacing: -0.4,
        marginBottom: 16,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    gridItem: {
        width: '48%', // roughly half minus gap
        backgroundColor: '#F2F2F7',
        borderRadius: 20,
        padding: 16,
        height: 110,
        justifyContent: 'space-between',
    },
    gridItemActive: {
        backgroundColor: '#000', // Dark mode style for active
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    iconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconCircleActive: {
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    emoji: {
        fontSize: 16,
    },
    checkBadge: {
        backgroundColor: '#34C759',
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkIcon: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '800',
    },
    bottomContent: {
        gap: 2,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
        letterSpacing: -0.2,
    },
    labelActive: {
        color: '#fff',
    },
    streak: {
        fontSize: 11,
        color: '#8E8E93',
        fontWeight: '500',
    },
    streakActive: {
        color: 'rgba(255,255,255,0.6)',
    },
});
