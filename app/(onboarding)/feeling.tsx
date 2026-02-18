import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Fonts } from '@/lib/typography';
import { CurrentFeeling } from '@/types/onboarding';

const OPTIONS: { value: CurrentFeeling; label: string; emoji: string; color: string }[] = [
    { value: 'overwhelmed', label: 'Overwhelmed', emoji: '🌊', color: '#E8F4FD' },
    { value: 'scattered', label: 'Scattered', emoji: '🧩', color: '#FFF3E0' },
    { value: 'stuck', label: 'Stuck', emoji: '🪨', color: '#F3E5F5' },
    { value: 'hopeful', label: 'Hopeful', emoji: '✨', color: '#E8F5E9' },
];

const DESCRIPTIONS: Record<CurrentFeeling, string> = {
    overwhelmed: 'Too much in my head',
    scattered: "Can't focus on one thing",
    stuck: "Know what to do but won't start",
    hopeful: 'Ready to try something new',
};

export default function FeelingScreen() {
    const router = useRouter();
    const { state, setCurrentFeeling, nextStep, previousStep } = useOnboarding();
    const selected = state.responses.currentFeeling;

    const handleSelect = (value: CurrentFeeling) => {
        setCurrentFeeling(value);
    };

    const handleContinue = () => {
        if (selected) {
            nextStep();
            router.push('/(onboarding)/today-win');
        }
    };

    const handleBack = () => {
        previousStep();
        router.back();
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
                <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: '66%' }]} />
                </View>
            </View>

            {/* Back Button */}
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <ChevronLeft size={28} color="#000" strokeWidth={1.5} />
            </TouchableOpacity>

            {/* Content */}
            <View style={styles.content}>
                <Text style={styles.title}>How do you feel{'\n'}right now?</Text>
                <Text style={styles.subtitle}>No judgement here</Text>

                <View style={styles.optionsGrid}>
                    {OPTIONS.map((option) => (
                        <TouchableOpacity
                            key={option.value}
                            style={[
                                styles.optionCard,
                                { backgroundColor: option.color },
                                selected === option.value && styles.optionCardSelected,
                            ]}
                            onPress={() => handleSelect(option.value)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.optionEmoji}>{option.emoji}</Text>
                            <Text style={styles.optionLabel}>{option.label}</Text>
                            <Text style={styles.optionDescription}>
                                {DESCRIPTIONS[option.value]}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Continue Button */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[styles.continueButton, !selected && styles.continueButtonDisabled]}
                    onPress={handleContinue}
                    disabled={!selected}
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
        fontFamily: Fonts.heading,
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
    optionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    optionCard: {
        width: '47%',
        borderRadius: 20,
        padding: 16,
        borderWidth: 3,
        borderColor: 'transparent',
    },
    optionCardSelected: {
        borderColor: '#007AFF',
    },
    optionEmoji: {
        fontSize: 32,
        marginBottom: 8,
    },
    optionLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        marginBottom: 4,
    },
    optionDescription: {
        fontSize: 13,
        color: '#3C3C43',
        lineHeight: 18,
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
