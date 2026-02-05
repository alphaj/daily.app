
import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { Habit } from '@/types/habit';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GAP = 12;
const PADDING = 20;
// Calculate item width for 2 columns: (Screen Width - (Horizontal Padding * 2) - Gap) / 2
const ITEM_WIDTH = (SCREEN_WIDTH - (PADDING * 2) - GAP) / 2;

interface HabitVariantProps {
    habits: Habit[];
    onToggle: (id: string) => void;
    isCompletedToday: (habit: Habit) => boolean;
}

export function HabitChips({ habits, onToggle, isCompletedToday }: HabitVariantProps) {
    return (
        <View style={styles.container}>
            <View style={styles.gridContainer}>
                {habits.map((habit) => {
                    const isCompleted = isCompletedToday(habit);
                    return (
                        <Pressable
                            key={habit.id}
                            style={[styles.card, isCompleted && styles.cardActive]}
                            onPress={() => {
                                Haptics.selectionAsync();
                                onToggle(habit.id);
                            }}
                        >
                            <View style={styles.cardHeader}>
                                <View style={[styles.iconContainer, isCompleted && styles.iconContainerActive]}>
                                    <Text style={styles.emoji}>{habit.emoji || '⚡️'}</Text>
                                </View>
                                {habit.currentStreak > 0 && (
                                    <View style={[styles.streakBadge, isCompleted && styles.streakBadgeActive]}>
                                        <Text style={[styles.streakText, isCompleted && styles.streakTextActive]}>
                                            {habit.currentStreak}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            <Text
                                style={[styles.label, isCompleted && styles.labelActive]}
                                numberOfLines={2}
                            >
                                {habit.name}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 8,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: GAP,
        paddingHorizontal: PADDING,
    },
    card: {
        width: ITEM_WIDTH,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 20,
        minHeight: 100,
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardActive: {
        backgroundColor: '#fff', // Keep white background but maybe change border or icon
        // Option A: Invert colors (Black background)
        // backgroundColor: '#000',

        // Option B: Subtle active state (Apple Home style - usually turns white or colored)
        // Since default is white, let's try a very subtle "done" look or keep it white and change the icon background
        opacity: 0.6, // Dim it slightly to show it's "done"
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainerActive: {
        backgroundColor: '#34C759', // Green check feel
    },
    emoji: {
        fontSize: 18,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        lineHeight: 20,
    },
    labelActive: {
        color: '#000',
        textDecorationLine: 'line-through',
        opacity: 0.6,
    },
    streakBadge: {
        backgroundColor: '#F2F2F7',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    streakBadgeActive: {
        backgroundColor: '#E5E5EA',
    },
    streakText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#8E8E93',
    },
    streakTextActive: {
        color: '#8E8E93',
    },
});
