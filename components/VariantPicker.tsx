import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

type VariantGroup = 'life' | 'add-trip';

const VARIANTS: Record<VariantGroup, { route: string; label: string }[]> = {
    life: [
        { route: '/life-v1', label: 'V1' },
        { route: '/life-v2', label: 'V2' },
        { route: '/life-v3', label: 'V3' },
        { route: '/life-v4', label: 'V4' },
        { route: '/life-v5', label: 'V5' },
    ],
    'add-trip': [
        { route: '/add-trip', label: 'Current' },
        { route: '/add-trip-v1', label: 'Stepper' },
        { route: '/add-trip-v2', label: 'Hero' },
        { route: '/add-trip-v3', label: 'Quick Start' },
        { route: '/add-trip-v4', label: 'Boarding Pass' },
        { route: '/add-trip-v5', label: 'Compact' },
    ],
};

interface VariantPickerProps {
    group: VariantGroup;
    current: number;
}

export function VariantPicker({ group, current }: VariantPickerProps) {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const variants = VARIANTS[group];
    const total = variants.length;

    const goTo = (index: number) => {
        Haptics.selectionAsync();
        router.replace(variants[index].route as any);
    };

    return (
        <View style={[styles.wrapper, { top: insets.top + 6 }]}>
            <View style={styles.bar}>
                <Pressable
                    onPress={() => current > 0 && goTo(current - 1)}
                    hitSlop={12}
                    style={styles.arrowBtn}
                >
                    <ChevronLeft
                        size={16}
                        color={current > 0 ? '#fff' : 'rgba(255,255,255,0.25)'}
                        strokeWidth={2.5}
                    />
                </Pressable>

                <Pressable onPress={() => router.back()} hitSlop={8}>
                    <Text style={styles.groupLabel}>
                        {group === 'life' ? 'Life' : 'Add Trip'}
                    </Text>
                </Pressable>

                <View style={styles.center}>
                    <Text style={styles.label}>{variants[current].label}</Text>
                    <View style={styles.dots}>
                        {variants.map((_, i) => (
                            <Pressable key={i} onPress={() => goTo(i)} hitSlop={6}>
                                <View
                                    style={[
                                        styles.dot,
                                        i === current && styles.dotActive,
                                    ]}
                                />
                            </Pressable>
                        ))}
                    </View>
                </View>

                <Pressable
                    onPress={() => current < total - 1 && goTo(current + 1)}
                    hitSlop={12}
                    style={styles.arrowBtn}
                >
                    <ChevronRight
                        size={16}
                        color={current < total - 1 ? '#fff' : 'rgba(255,255,255,0.25)'}
                        strokeWidth={2.5}
                    />
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        left: 0,
        right: 0,
        zIndex: 999,
        alignItems: 'center',
        pointerEvents: 'box-none',
    },
    bar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderRadius: 20,
        paddingHorizontal: 6,
        paddingVertical: 6,
        gap: 2,
    },
    arrowBtn: {
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    groupLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 11,
        fontWeight: '500',
        marginRight: 4,
    },
    center: {
        alignItems: 'center',
        paddingHorizontal: 6,
        gap: 3,
    },
    label: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
    dots: {
        flexDirection: 'row',
        gap: 5,
    },
    dot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: 'rgba(255,255,255,0.25)',
    },
    dotActive: {
        backgroundColor: '#fff',
        width: 14,
        borderRadius: 2.5,
    },
});
