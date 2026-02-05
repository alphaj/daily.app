import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

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

export function HabitsVariant2({ items, onToggle, title }: VariantProps) {
    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.headerTitle}>{title}</Text>
            </View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                decelerationRate="fast"
                snapToInterval={130} // card width + gap
            >
                {items.map((item) => (
                    <Pressable
                        key={item.id}
                        style={[styles.card, item.completed && styles.cardActive]}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            onToggle(item.id);
                        }}
                    >
                        {item.completed ? (
                            <LinearGradient
                                colors={['#FFcc00', '#FF9500']}
                                style={StyleSheet.absoluteFill}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            />
                        ) : null}

                        <View style={styles.cardHeader}>
                            <View style={[styles.iconBadge, item.completed && styles.iconBadgeActive]}>
                                <Text style={styles.emoji}>{item.emoji || '⚡️'}</Text>
                            </View>
                            {item.streak ? (
                                <View style={[styles.streakPill, item.completed && styles.streakPillActive]}>
                                    <Text style={[styles.streakText, item.completed && styles.streakTextActive]}>
                                        {item.streak}
                                    </Text>
                                    <Text style={[styles.streakIcon, item.completed && styles.streakTextActive]}>🔥</Text>
                                </View>
                            ) : null}
                        </View>

                        <View style={styles.cardFooter}>
                            <Text
                                numberOfLines={2}
                                style={[styles.itemName, item.completed && styles.itemNameActive]}
                            >
                                {item.name}
                            </Text>
                            <Text style={[styles.statusText, item.completed && styles.statusTextActive]}>
                                {item.completed ? 'Completed' : 'Tap to complete'}
                            </Text>
                        </View>
                    </Pressable>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    headerRow: {
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#000',
        letterSpacing: -0.4,
    },
    scrollContent: {
        paddingHorizontal: 20,
        gap: 12,
        paddingBottom: 4, // shadow room
    },
    card: {
        width: 120,
        aspectRatio: 1,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 12,
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        overflow: 'hidden',
    },
    cardActive: {
        // Background handled by gradient
        shadowColor: '#FF9500',
        shadowOpacity: 0.3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    iconBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconBadgeActive: {
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    emoji: {
        fontSize: 18,
    },
    streakPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        backgroundColor: '#F2F2F7',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 100,
    },
    streakPillActive: {
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    streakText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#8E8E93',
    },
    streakIcon: {
        fontSize: 10,
    },
    streakTextActive: {
        color: '#fff',
    },
    cardFooter: {
        gap: 4,
    },
    itemName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
        lineHeight: 20,
    },
    itemNameActive: {
        color: '#fff',
    },
    statusText: {
        fontSize: 11,
        fontWeight: '500',
        color: '#8E8E93',
    },
    statusTextActive: {
        color: 'rgba(255,255,255,0.8)',
    },
});
