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

export function HabitsVariant4({ items, onToggle, title }: VariantProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.headerTitle}>{title}</Text>
            <View style={styles.chipCloud}>
                {items.map((item) => (
                    <Pressable
                        key={item.id}
                        style={[styles.chip, item.completed && styles.chipActive]}
                        onPress={() => {
                            Haptics.selectionAsync();
                            onToggle(item.id);
                        }}
                    >
                        <View style={[styles.iconBox, item.completed && styles.iconBoxActive]}>
                            <Text style={styles.emoji}>{item.emoji || '⚡️'}</Text>
                        </View>
                        <Text style={[styles.label, item.completed && styles.labelActive]}>
                            {item.name}
                        </Text>
                        {item.streak ? (
                            <Text style={[styles.streak, item.completed && styles.streakActive]}>
                                {item.streak}
                            </Text>
                        ) : null}
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
    chipCloud: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12, // Increased gap
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff', // White background
        paddingVertical: 8,
        paddingLeft: 8,
        paddingRight: 16,
        borderRadius: 100, // Fully rounded
        borderWidth: 1.5, // Thicker border
        borderColor: '#E5E5EA',
        gap: 10,
        // Subtle shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
    },
    chipActive: {
        backgroundColor: '#E8F2FF', // Very light blue tint
        borderColor: '#007AFF', // Blue border
        shadowColor: '#007AFF',
        shadowOpacity: 0.1,
    },
    iconBox: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconBoxActive: {
        backgroundColor: '#007AFF',
    },
    emoji: {
        fontSize: 14,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
    },
    labelActive: {
        color: '#007AFF',
    },
    streak: {
        fontSize: 12,
        fontWeight: '700',
        color: '#C7C7CC',
        marginLeft: 2,
    },
    streakActive: {
        color: '#007AFF',
        opacity: 0.6,
    },
});
