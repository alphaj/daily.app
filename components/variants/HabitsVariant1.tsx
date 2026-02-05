import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Check } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

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

export function HabitsVariant1({ items, onToggle, title }: VariantProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.headerTitle}>{title}</Text>
            <View style={styles.listContainer}>
                {items.map((item, index) => (
                    <View key={item.id}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.row,
                                pressed && styles.rowPressed
                            ]}
                            onPress={() => {
                                Haptics.selectionAsync();
                                onToggle(item.id);
                            }}
                        >
                            <View style={styles.leftContent}>
                                <View style={[styles.iconContainer, item.completed && styles.iconContainerActive]}>
                                    <Text style={styles.emoji}>{item.emoji || '⚡️'}</Text>
                                </View>
                                <View style={styles.textContent}>
                                    <Text style={[styles.label, item.completed && styles.labelActive]}>{item.name}</Text>
                                    {item.streak ? (
                                        <Text style={styles.streakText}>
                                            {item.streak} day streak
                                        </Text>
                                    ) : null}
                                </View>
                            </View>

                            <View style={[styles.checkbox, item.completed && styles.checkboxChecked]}>
                                {item.completed && <Check size={14} color="#fff" strokeWidth={3} />}
                            </View>
                        </Pressable>
                        {index < items.length - 1 && <View style={styles.divider} />}
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
        marginBottom: 8,
        marginLeft: 16,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    listContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        minHeight: 56,
    },
    rowPressed: {
        backgroundColor: '#F2F2F7',
    },
    leftContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainerActive: {
        backgroundColor: '#fff', // Or maybe keep gray? let's stick to gray for list style
    },
    emoji: {
        fontSize: 20,
    },
    textContent: {
        flex: 1,
    },
    label: {
        fontSize: 17,
        fontWeight: '400',
        color: '#000',
        letterSpacing: -0.3,
    },
    labelActive: {
        color: '#8E8E93',
        // textDecorationLine: 'line-through', // Optional: Strikethrough for habits? Maybe not.
    },
    streakText: {
        fontSize: 13,
        color: '#8E8E93',
        marginTop: 2,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#C7C7CC',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#C6C6C8',
        marginLeft: 64, // Align with text
    },
});
