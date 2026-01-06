import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Check } from 'lucide-react-native';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { FallsThrough } from '@/types/onboarding';

const OPTIONS: { value: FallsThrough; label: string; icon: string }[] = [
    { value: 'later', label: 'Things I said I\'d do "later"', icon: '⏰' },
    { value: 'annoying', label: 'Small tasks that feel annoying', icon: '😤' },
    { value: 'no-home', label: 'Habits that don\'t have a home', icon: '🏠' },
    { value: 'promises', label: 'Promises to other people', icon: '🤝' },
];

export default function FallsThroughScreen() {
    const router = useRouter();
    const { state, toggleFallsThrough, nextStep, previousStep } = useOnboarding();
    const selected = state.responses.fallsThrough;

    const handleContinue = () => {
        if (selected.length > 0) {
            nextStep();
            router.push('/(onboarding)/feeling');
        }
    };

    const handleBack = () => {
        previousStep();
        router.back();
    };

    const isSelected = (value: FallsThrough) => selected.includes(value);

    return (
        <SafeAreaView style={styles.container}>
            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
                <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: '50%' }]} />
                </View>
            </View>

            {/* Back Button */}
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <ChevronLeft size={28} color="#000" strokeWidth={1.5} />
            </TouchableOpacity>

            {/* Content */}
            <View style={styles.content}>
                <Text style={styles.title}>What falls through{'\n'}the cracks?</Text>
                <Text style={styles.subtitle}>Select all that apply</Text>

                <View style={styles.optionsContainer}>
                    {OPTIONS.map((option) => (
                        <TouchableOpacity
                            key={option.value}
                            style={[
                                styles.optionButton,
                                isSelected(option.value) && styles.optionButtonSelected,
                            ]}
                            onPress={() => toggleFallsThrough(option.value)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.optionIcon}>{option.icon}</Text>
                            <Text
                                style={[
                                    styles.optionText,
                                    isSelected(option.value) && styles.optionTextSelected,
                                ]}
                            >
                                {option.label}
                            </Text>
                            <View
                                style={[
                                    styles.checkbox,
                                    isSelected(option.value) && styles.checkboxSelected,
                                ]}
                            >
                                {isSelected(option.value) && (
                                    <Check size={14} color="#FFF" strokeWidth={3} />
                                )}
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Continue Button */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[
                        styles.continueButton,
                        selected.length === 0 && styles.continueButtonDisabled,
                    ]}
                    onPress={handleContinue}
                    disabled={selected.length === 0}
                    activeOpacity={0.8}
                >
                    <Text style={styles.continueButtonText}>Continue</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    progressContainer: {
        paddingHorizontal: 24,
        paddingTop: 8,
    },
    progressTrack: {
        height: 4,
        backgroundColor: '#E5E5EA',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#000',
        borderRadius: 2,
    },
    backButton: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        alignSelf: 'flex-start',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#000',
        lineHeight: 40,
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 17,
        color: '#8E8E93',
        marginBottom: 32,
    },
    optionsContainer: {
        gap: 12,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F7',
        borderRadius: 16,
        padding: 16,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    optionButtonSelected: {
        backgroundColor: '#FFF9E6',
        borderColor: '#F5A623',
    },
    optionIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    optionText: {
        fontSize: 16,
        color: '#3C3C43',
        flex: 1,
    },
    optionTextSelected: {
        color: '#000',
        fontWeight: '500',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#C7C7CC',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxSelected: {
        backgroundColor: '#F5A623',
        borderColor: '#F5A623',
    },
    buttonContainer: {
        paddingHorizontal: 24,
        paddingBottom: 16,
    },
    continueButton: {
        backgroundColor: '#007AFF',
        borderRadius: 28,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    continueButtonDisabled: {
        backgroundColor: '#E5E5EA',
    },
    continueButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },
});
