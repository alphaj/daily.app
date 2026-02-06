import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Modal,
    Animated,
    Platform,
    useWindowDimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { X, Flag, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useHaptics } from '@/hooks/useHaptics';

type Priority = 'low' | 'medium' | 'high' | undefined;

interface PriorityPickerModalProps {
    visible: boolean;
    onClose: () => void;
    selectedPriority: Priority;
    onSelectPriority: (priority: Priority) => void;
}

const priorityOptions: { value: Priority; label: string; color: string }[] = [
    { value: undefined, label: 'None', color: '#8E8E93' },
    { value: 'low', label: 'Low', color: '#34C759' },
    { value: 'medium', label: 'Medium', color: '#FF9500' },
    { value: 'high', label: 'High', color: '#FF3B30' },
];

export function PriorityPickerModal({
    visible,
    onClose,
    selectedPriority,
    onSelectPriority,
}: PriorityPickerModalProps) {
    const { width: screenWidth } = useWindowDimensions();
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const [isVisible, setIsVisible] = useState(visible);

    const haptics = useHaptics();
    const modalWidth = Math.min(screenWidth - 32, 380);

    useEffect(() => {
        if (visible) {
            setIsVisible(true);
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                    damping: 20,
                    stiffness: 300,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(scaleAnim, {
                    toValue: 0.9,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setIsVisible(false);
            });
        }
    }, [visible, scaleAnim, opacityAnim]);

    const handleSelect = (priority: Priority) => {
        // Escalating haptic intensity based on priority level
        if (priority === 'high') {
            haptics.priority('high');
        } else if (priority === 'medium') {
            haptics.priority('medium');
        } else if (priority === 'low') {
            haptics.priority('low');
        } else {
            haptics.softTick();
        }
        onSelectPriority(priority);
        onClose();
    };

    if (!isVisible) return null;

    return (
        <Modal
            transparent
            visible={true}
            statusBarTranslucent
            onRequestClose={onClose}
            animationType="none"
        >
            <View style={styles.container}>
                <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
                        {Platform.OS === 'web' ? (
                            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
                        ) : (
                            <BlurView
                                intensity={Platform.OS === 'ios' ? 30 : 50}
                                tint="dark"
                                style={StyleSheet.absoluteFill}
                            />
                        )}
                    </Pressable>
                </Animated.View>

                <Animated.View
                    style={[
                        styles.contentContainer,
                        {
                            width: modalWidth,
                            transform: [{ scale: scaleAnim }],
                            opacity: opacityAnim,
                        },
                    ]}
                >
                    <View style={styles.header}>
                        <Text style={styles.title}>Priority</Text>
                        <Pressable
                            onPress={onClose}
                            hitSlop={12}
                            style={({ pressed }) => [
                                styles.closeButton,
                                pressed && styles.closeButtonPressed,
                            ]}
                        >
                            <X size={20} color="#8E8E93" />
                        </Pressable>
                    </View>

                    <View style={styles.optionsContainer}>
                        {priorityOptions.map((option) => {
                            const isSelected = selectedPriority === option.value;

                            return (
                                <Pressable
                                    key={option.label}
                                    style={({ pressed }) => [
                                        styles.optionButton,
                                        pressed && styles.optionButtonPressed,
                                    ]}
                                    onPress={() => handleSelect(option.value)}
                                >
                                    <View style={styles.optionLeft}>
                                        <View style={[styles.iconContainer, { backgroundColor: option.color }]}>
                                            <Flag size={16} color="#fff" />
                                        </View>
                                        <Text style={styles.optionText}>{option.label}</Text>
                                    </View>
                                    {isSelected && (
                                        <View style={styles.checkContainer}>
                                            <Check size={20} color="#007AFF" strokeWidth={3} />
                                        </View>
                                    )}
                                </Pressable>
                            );
                        })}
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    contentContainer: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#000',
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButtonPressed: {
        opacity: 0.7,
        backgroundColor: '#E5E5EA',
    },
    optionsContainer: {
        gap: 8,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        backgroundColor: '#F9F9F9',
        borderRadius: 12,
    },
    optionButtonPressed: {
        backgroundColor: '#F2F2F7',
    },
    optionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionText: {
        fontSize: 17,
        fontWeight: '500',
        color: '#1C1C1E',
    },
    checkContainer: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
