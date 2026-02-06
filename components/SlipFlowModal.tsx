import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    Pressable,
    TextInput,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import type { SlipEntry } from '@/types/habit';

const { width } = Dimensions.get('window');

const TRIGGER_OPTIONS: { value: SlipEntry['trigger']; label: string; emoji: string }[] = [
    { value: 'stress', label: 'Stress', emoji: '😰' },
    { value: 'boredom', label: 'Boredom', emoji: '😑' },
    { value: 'social', label: 'Social', emoji: '👥' },
    { value: 'environment', label: 'Environment', emoji: '🏠' },
    { value: 'autopilot', label: 'Autopilot', emoji: '🤖' },
    { value: 'other', label: 'Other', emoji: '❓' },
];

interface SlipFlowModalProps {
    visible: boolean;
    habitName: string;
    previousStrategies?: string[];
    onSubmit: (trigger?: SlipEntry['trigger'], strategy?: string) => void;
    onClose: () => void;
}

export function SlipFlowModal({ visible, habitName, previousStrategies = [], onSubmit, onClose }: SlipFlowModalProps) {
    const [step, setStep] = useState<1 | 2>(1);
    const [selectedTrigger, setSelectedTrigger] = useState<SlipEntry['trigger'] | undefined>();
    const [strategy, setStrategy] = useState('');

    const handleTriggerSelect = (trigger: SlipEntry['trigger']) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedTrigger(selectedTrigger === trigger ? undefined : trigger);
    };

    const handleNext = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setStep(2);
    };

    const handleSubmit = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSubmit(selectedTrigger, strategy.trim() || undefined);
        resetState();
    };

    const handleClose = () => {
        onClose();
        resetState();
    };

    const handleSkipTrigger = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setStep(2);
    };

    const resetState = () => {
        setStep(1);
        setSelectedTrigger(undefined);
        setStrategy('');
    };

    const uniqueStrategies = [...new Set(previousStrategies.filter(Boolean))].slice(0, 3);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <Pressable style={styles.overlayBg} onPress={handleClose} />

                <View style={styles.sheet}>
                    {/* Handle */}
                    <View style={styles.handle} />

                    {/* Close */}
                    <Pressable style={styles.closeButton} onPress={handleClose} hitSlop={10}>
                        <X size={20} color="#8E8E93" strokeWidth={2} />
                    </Pressable>

                    {step === 1 ? (
                        <View style={styles.stepContent}>
                            <Text style={styles.stepTitle}>What triggered this?</Text>
                            <Text style={styles.stepSubtitle}>
                                Understanding your triggers helps you prepare next time
                            </Text>

                            <View style={styles.chipGrid}>
                                {TRIGGER_OPTIONS.map((option) => (
                                    <Pressable
                                        key={option.value}
                                        style={[
                                            styles.chip,
                                            selectedTrigger === option.value && styles.chipSelected,
                                        ]}
                                        onPress={() => handleTriggerSelect(option.value)}
                                    >
                                        <Text style={styles.chipEmoji}>{option.emoji}</Text>
                                        <Text style={[
                                            styles.chipLabel,
                                            selectedTrigger === option.value && styles.chipLabelSelected,
                                        ]}>
                                            {option.label}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>

                            <Pressable style={styles.primaryButton} onPress={handleNext}>
                                <Text style={styles.primaryButtonText}>Next</Text>
                            </Pressable>

                            <Pressable style={styles.skipButton} onPress={handleSkipTrigger}>
                                <Text style={styles.skipButtonText}>Skip</Text>
                            </Pressable>
                        </View>
                    ) : (
                        <View style={styles.stepContent}>
                            <Text style={styles.stepTitle}>What could you try next time?</Text>
                            <Text style={styles.stepSubtitle}>Optional — but writing it down makes it real</Text>

                            {uniqueStrategies.length > 0 && (
                                <View style={styles.previousStrategies}>
                                    <Text style={styles.previousLabel}>Previous strategies:</Text>
                                    <View style={styles.strategyChips}>
                                        {uniqueStrategies.map((s, i) => (
                                            <Pressable
                                                key={i}
                                                style={[
                                                    styles.strategyChip,
                                                    strategy === s && styles.strategyChipSelected,
                                                ]}
                                                onPress={() => {
                                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                    setStrategy(s);
                                                }}
                                            >
                                                <Text style={[
                                                    styles.strategyChipText,
                                                    strategy === s && styles.strategyChipTextSelected,
                                                ]} numberOfLines={1}>
                                                    {s}
                                                </Text>
                                            </Pressable>
                                        ))}
                                    </View>
                                </View>
                            )}

                            <TextInput
                                style={styles.strategyInput}
                                placeholder="I'll try to..."
                                placeholderTextColor="#C7C7CC"
                                value={strategy}
                                onChangeText={setStrategy}
                                multiline
                                maxLength={200}
                            />

                            <Text style={styles.compassionMessage}>
                                Slips are part of the process. You're learning.
                            </Text>

                            <Pressable style={styles.primaryButton} onPress={handleSubmit}>
                                <Text style={styles.primaryButtonText}>Done</Text>
                            </Pressable>
                        </View>
                    )}
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    overlayBg: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    sheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 24,
        paddingBottom: 40,
        paddingTop: 12,
        maxHeight: '80%',
    },
    handle: {
        width: 36,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: '#E5E5EA',
        alignSelf: 'center',
        marginBottom: 16,
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 20,
        padding: 8,
        zIndex: 1,
    },
    stepContent: {
        paddingTop: 8,
    },
    stepTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#000',
        marginBottom: 8,
        letterSpacing: -0.3,
    },
    stepSubtitle: {
        fontSize: 15,
        color: '#8E8E93',
        marginBottom: 24,
        lineHeight: 22,
    },
    chipGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 24,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 16,
        backgroundColor: '#F5F5F7',
        gap: 8,
    },
    chipSelected: {
        backgroundColor: '#5856D6',
    },
    chipEmoji: {
        fontSize: 18,
    },
    chipLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
    },
    chipLabelSelected: {
        color: '#fff',
    },
    primaryButton: {
        width: '100%',
        backgroundColor: '#000',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
    },
    primaryButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#fff',
    },
    skipButton: {
        width: '100%',
        paddingVertical: 14,
        alignItems: 'center',
    },
    skipButtonText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#8E8E93',
    },
    previousStrategies: {
        marginBottom: 16,
    },
    previousLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
        marginBottom: 10,
    },
    strategyChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    strategyChip: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 12,
        backgroundColor: '#F5F5F7',
        maxWidth: '90%',
    },
    strategyChipSelected: {
        backgroundColor: '#E8E7FF',
        borderWidth: 1,
        borderColor: '#5856D6',
    },
    strategyChipText: {
        fontSize: 14,
        color: '#000',
    },
    strategyChipTextSelected: {
        color: '#5856D6',
        fontWeight: '600',
    },
    strategyInput: {
        fontSize: 16,
        color: '#1C1C1E',
        backgroundColor: '#F5F5F7',
        borderRadius: 14,
        padding: 16,
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: 16,
    },
    compassionMessage: {
        fontSize: 14,
        color: '#8E8E93',
        textAlign: 'center',
        marginBottom: 20,
        fontStyle: 'italic',
    },
});
