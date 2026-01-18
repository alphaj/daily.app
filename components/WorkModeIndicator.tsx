import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Briefcase, Leaf } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useWorkMode } from '@/contexts/WorkModeContext';
import { MODE_CONFIG } from '@/types/workmode';

interface WorkModeIndicatorProps {
    /** Called when indicator is pressed */
    onPress?: () => void;
}

export function WorkModeIndicator({ onPress }: WorkModeIndicatorProps) {
    const { currentMode, isWorkMode } = useWorkMode();
    const config = MODE_CONFIG[currentMode];

    const handlePress = () => {
        Haptics.selectionAsync();
        onPress?.();
    };

    return (
        <Pressable onPress={handlePress} style={styles.container}>
            <View style={[styles.pill, { backgroundColor: config.backgroundColor }]}>
                {isWorkMode ? (
                    <Briefcase size={12} color={config.color} strokeWidth={2.5} />
                ) : (
                    <Leaf size={12} color={config.color} strokeWidth={2.5} />
                )}
                <Text style={[styles.label, { color: config.color }]}>
                    {config.label}
                </Text>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {},
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: -0.2,
    },
});
