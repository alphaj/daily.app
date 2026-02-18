import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Fonts } from '@/lib/typography';

const SUGGESTIONS = [
    'Complete one important thing',
    'Feel less anxious',
    'Actually rest without guilt',
    'Build momentum on a habit',
];

export default function TodayWinScreen() {
    const router = useRouter();
    const { state, setTodayWin, nextStep, previousStep } = useOnboarding();
    const [localWin, setLocalWin] = useState(state.responses.todayWin);

    const handleSelectSuggestion = (suggestion: string) => {
        setLocalWin(suggestion);
    };

    const handleContinue = () => {
        if (localWin.trim()) {
            setTodayWin(localWin.trim());
            nextStep();
            router.push('/(onboarding)/welcome');
        }
    };

    const handleBack = () => {
        previousStep();
        router.back();
    };

    const canContinue = localWin.trim().length > 0;

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                {/* Progress Indicator */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: '83%' }]} />
                    </View>
                </View>

                {/* Back Button */}
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                    <ChevronLeft size={28} color="#000" strokeWidth={1.5} />
                </TouchableOpacity>

                {/* Content */}
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                >
                    <Text style={styles.title}>What would make{'\n'}today a win?</Text>
                    <Text style={styles.subtitle}>Set a small intention</Text>

                    {/* Suggestions */}
                    <View style={styles.suggestionsContainer}>
                        {SUGGESTIONS.map((suggestion, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.suggestionPill,
                                    localWin === suggestion && styles.suggestionPillSelected,
                                ]}
                                onPress={() => handleSelectSuggestion(suggestion)}
                                activeOpacity={0.7}
                            >
                                <Text
                                    style={[
                                        styles.suggestionText,
                                        localWin === suggestion && styles.suggestionTextSelected,
                                    ]}
                                >
                                    {suggestion}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Or divider */}
                    <View style={styles.dividerContainer}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>or write your own</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Text input */}
                    <TextInput
                        style={styles.textInput}
                        placeholder="Today I want to..."
                        placeholderTextColor="#C7C7CC"
                        value={localWin}
                        onChangeText={setLocalWin}
                        multiline
                        maxLength={100}
                    />
                </ScrollView>

                {/* Continue Button */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
                        onPress={handleContinue}
                        disabled={!canContinue}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.continueButtonText}>Continue</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    keyboardView: {
        flex: 1,
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
    scrollView: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 24,
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
        marginBottom: 24,
    },
    suggestionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    suggestionPill: {
        backgroundColor: '#F5F5F7',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    suggestionPillSelected: {
        backgroundColor: '#E8F4FD',
        borderColor: '#007AFF',
    },
    suggestionText: {
        fontSize: 15,
        color: '#3C3C43',
    },
    suggestionTextSelected: {
        color: '#007AFF',
        fontWeight: '500',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
        gap: 12,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E5EA',
    },
    dividerText: {
        fontSize: 14,
        color: '#8E8E93',
    },
    textInput: {
        fontSize: 18,
        color: '#000',
        backgroundColor: '#F5F5F7',
        borderRadius: 16,
        padding: 16,
        minHeight: 80,
        textAlignVertical: 'top',
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
