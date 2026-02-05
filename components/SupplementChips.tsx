import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { Supplement } from '@/types/supplement';
import { Check } from 'lucide-react-native';

interface SupplementChipsProps {
    supplements: Supplement[];
    onToggle: (id: string) => void;
    isTakenToday: (supplement: Supplement) => boolean;
    onLongPress?: (id: string) => void;
}

export function SupplementChips({ supplements, onToggle, isTakenToday, onLongPress }: SupplementChipsProps) {
    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {supplements.map((supplement) => {
                    const isTaken = isTakenToday(supplement);
                    return (
                        <Pressable
                            key={supplement.id}
                            style={styles.itemWrapper}
                            onPress={() => {
                                Haptics.selectionAsync();
                                onToggle(supplement.id);
                            }}
                            onLongPress={() => {
                                if (onLongPress) {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    onLongPress(supplement.id);
                                }
                            }}
                            delayLongPress={500}
                        >
                            <View style={[styles.circle, isTaken && styles.circleActive]}>
                                {isTaken ? (
                                    <Check size={28} color="#fff" strokeWidth={3} />
                                ) : (
                                    <Text style={styles.emoji}>{supplement.emoji || '💊'}</Text>
                                )}
                            </View>

                            <Text
                                style={[styles.label, isTaken && styles.labelActive]}
                                numberOfLines={1}
                            >
                                {supplement.name}
                            </Text>
                        </Pressable>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 8,
    },
    scrollContent: {
        paddingHorizontal: 20,
        gap: 16,
    },
    itemWrapper: {
        alignItems: 'center',
        width: 72,
        gap: 8,
    },
    circle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    circleActive: {
        backgroundColor: '#007AFF', // Health app blue/cyan
        borderColor: '#007AFF',
    },
    emoji: {
        fontSize: 30,
    },
    label: {
        fontSize: 12,
        fontWeight: '500',
        color: '#000',
        textAlign: 'center',
    },
    labelActive: {
        color: '#8E8E93',
    },
});
