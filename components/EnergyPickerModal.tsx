
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Check } from 'lucide-react-native';

export type EnergyLevel = 'survival' | 'normal' | 'peak';

interface EnergyPickerModalProps {
    visible: boolean;
    onClose: () => void;
    selectedLevel: EnergyLevel;
    onSelect: (level: EnergyLevel) => void;
}

const ENERGY_OPTIONS: { id: EnergyLevel; label: string; icon: string; color: string; desc: string }[] = [
    {
        id: 'survival',
        label: 'Survival',
        icon: '🔋',
        color: '#34C759',
        desc: 'Focus on essentials. Low energy tasks only.'
    },
    {
        id: 'normal',
        label: 'Normal',
        icon: '⚡️',
        color: '#FFcc00',
        desc: 'Standard productivity mode.'
    },
    {
        id: 'peak',
        label: 'Peak',
        icon: '🔥',
        color: '#FF3B30',
        desc: 'High energy! Crush ambitious goals.'
    },
];

export function EnergyPickerModal({ visible, onClose, selectedLevel, onSelect }: EnergyPickerModalProps) {
    const anim = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            anim.value = withSpring(1, { damping: 20, stiffness: 90 });
        } else {
            anim.value = withTiming(0, { duration: 200 });
        }
    }, [visible]);

    const handleSelect = (level: EnergyLevel) => {
        Haptics.selectionAsync();
        onSelect(level);
        onClose();
    };

    const modalStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: 0.95 + anim.value * 0.05 },
            { translateY: 20 * (1 - anim.value) },
        ],
        opacity: anim.value,
    }));

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={StyleSheet.absoluteFill}>
                <BlurView
                    intensity={20}
                    tint="dark"
                    style={StyleSheet.absoluteFill}
                >
                    <Pressable style={styles.overlay} onPress={onClose}>
                        <Animated.View
                            style={[styles.modalContainer, modalStyle]}
                        >
                            <View style={styles.header}>
                                <Text style={styles.title}>Energy Level</Text>
                            </View>

                            <View style={styles.optionsContainer}>
                                {ENERGY_OPTIONS.map((option) => {
                                    const isSelected = selectedLevel === option.id;
                                    return (
                                        <Pressable
                                            key={option.id}
                                            style={({ pressed }) => [
                                                styles.optionRow,
                                                pressed && styles.optionPressed,
                                                isSelected && styles.optionSelected
                                            ]}
                                            onPress={() => handleSelect(option.id)}
                                        >
                                            <View style={styles.iconContainer}>
                                                <Text style={styles.icon}>{option.icon}</Text>
                                            </View>
                                            <View style={styles.textContainer}>
                                                <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                                                    {option.label}
                                                </Text>
                                                <Text style={styles.optionDesc}>{option.desc}</Text>
                                            </View>
                                            {isSelected && (
                                                <View style={styles.checkContainer}>
                                                    <Check size={20} color="#007AFF" />
                                                </View>
                                            )}
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </Animated.View>
                    </Pressable>
                </BlurView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 24,
        width: '100%',
        maxWidth: 340,
        paddingVertical: 20,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 20,
    },
    header: {
        marginBottom: 16,
        paddingHorizontal: 8,
        alignItems: 'center',
    },
    title: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000',
        letterSpacing: -0.4,
    },
    optionsContainer: {
        gap: 8,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.02)',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    optionPressed: {
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    optionSelected: {
        backgroundColor: '#fff',
        borderColor: '#007AFF20',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
        elevation: 1,
    },
    icon: {
        fontSize: 22,
    },
    textContainer: {
        flex: 1,
    },
    optionLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginBottom: 2,
    },
    optionLabelSelected: {
        color: '#007AFF',
    },
    optionDesc: {
        fontSize: 13,
        color: '#3C3C4399',
    },
    checkContainer: {
        marginLeft: 8,
    },
});
