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
import { LosesDayAt } from '@/types/onboarding';

const OPTIONS: { value: LosesDayAt; label: string; emoji: string }[] = [
    { value: 'morning', label: 'Morning feels wasted before it starts', emoji: '🌅' },
    { value: 'afternoon', label: 'Afternoons disappear in meetings', emoji: '🌤️' },
    { value: 'evening', label: 'Evenings collapse into doom-scrolling', emoji: '🌙' },
    { value: 'sleep', label: 'Sleep steals my tomorrow', emoji: '😴' },
];

export default function LosesDayScreen() {
    const router = useRouter();
    const { state, setLosesDayAt, nextStep, previousStep } = useOnboarding();
    const selected = state.responses.losesDayAt;

    const handleSelect = (value: LosesDayAt) => {
        setLosesDayAt(value);
    };

    const handleContinue = () => {
        if (selected) {
            nextStep();
            router.push('/(onboarding)/falls-through');
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
                    <View style={[styles.progressFill, { width: '33%' }]} />
                </View>
            </View>

            {/* Back Button */}
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <ChevronLeft size={28} color="#000" strokeWidth={1.5} />
            </TouchableOpacity>

            {/* Content */}
            <View style={styles.content}>
                <Text style={styles.title}>When do you{'\n'}lose your day?</Text>
                <Text style={styles.subtitle}>Be honest — we've all been there</Text>

                <View style={styles.optionsContainer}>
                    {OPTIONS.map((option) => (
                        <TouchableOpacity
                            key={option.value}
                            style={[
                                styles.optionButton,
                                selected === option.value && styles.optionButtonSelected,
                            ]}
                            onPress={() => handleSelect(option.value)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.optionEmoji}>{option.emoji}</Text>
                            <Text
                                style={[
                                    styles.optionText,
                                    selected === option.value && styles.optionTextSelected,
                                ]}
                            >
                                {option.label}
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
        backgroundColor: '#F0F7FF',
        borderColor: '#007AFF',
    },
    optionEmoji: {
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
