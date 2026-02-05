import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
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

export function HabitsVariant5({ items, onToggle, title }: VariantProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.headerTitle}>{title}</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {items.map((item) => (
                    <Pressable
                        key={item.id}
                        style={styles.itemWrapper}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            onToggle(item.id);
                        }}
                    >
                        <View style={[styles.circleRing, item.completed && styles.circleRingActive]}>
                            <View style={[styles.circle, item.completed && styles.circleActive]}>
                                <Text style={styles.emoji}>{item.emoji || '⚡️'}</Text>
                                {item.completed && (
                                    <View style={styles.checkBadge}>
                                        <Text style={styles.checkIcon}>✓</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                        <Text
                            numberOfLines={1}
                            style={[styles.label, item.completed && styles.labelActive]}
                        >
                            {item.name}
                        </Text>
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
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#000',
        letterSpacing: -0.4,
        marginBottom: 16,
        paddingHorizontal: 20,
    },
    scrollContent: {
        paddingHorizontal: 20,
        gap: 16,
    },
    itemWrapper: {
        alignItems: 'center',
        gap: 8,
        width: 68,
    },
    circleRing: {
        width: 64,
        height: 64,
        borderRadius: 32,
        padding: 3,
        borderWidth: 2,
        borderColor: '#C7C7CC', // Default gray ring
    },
    circleRingActive: {
        borderColor: '#34C759', // Green ring when done
    },
    circle: {
        flex: 1,
        borderRadius: 30, // inner radius
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    circleActive: {
        backgroundColor: '#fff',
    },
    emoji: {
        fontSize: 24,
    },
    checkBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#34C759',
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    checkIcon: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
    },
    label: {
        fontSize: 12,
        fontWeight: '500',
        color: '#000',
        textAlign: 'center',
        width: '100%',
    },
    labelActive: {
        color: '#8E8E93',
    },
});
