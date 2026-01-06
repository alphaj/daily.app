import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import { useOnboarding } from '@/contexts/OnboardingContext';

const PERSONALIZED_MESSAGES: Record<string, string> = {
    overwhelmed: "Let's clear that mental clutter together.",
    scattered: "We'll help you focus on what matters.",
    stuck: "Small steps lead to big momentum.",
    hopeful: "Great energy! Let's channel it well.",
};

export default function WelcomeScreen() {
    const router = useRouter();
    const { state, completeOnboarding } = useOnboarding();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleBegin = async () => {
        await completeOnboarding();
        router.replace('/');
    };

    const personalizedMessage = state.responses.currentFeeling
        ? PERSONALIZED_MESSAGES[state.responses.currentFeeling]
        : "Let's make today count.";

    return (
        <SafeAreaView style={styles.container}>
            {/* Progress Indicator - Complete */}
            <View style={styles.progressContainer}>
                <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: '100%' }]} />
                </View>
            </View>

            {/* Content */}
            <Animated.View
                style={[
                    styles.content,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
            >
                {/* Icon */}
                <View style={styles.iconContainer}>
                    <View style={styles.iconCircle}>
                        <Sparkles size={48} color="#007AFF" strokeWidth={1.5} />
                    </View>
                </View>

                <Text style={styles.title}>You're all set!</Text>
                <Text style={styles.personalizedMessage}>{personalizedMessage}</Text>

                {/* Today's win reminder */}
                {state.responses.todayWin && (
                    <View style={styles.winCard}>
                        <Text style={styles.winLabel}>Today's intention:</Text>
                        <Text style={styles.winText}>{state.responses.todayWin}</Text>
                    </View>
                )}
            </Animated.View>

            {/* Begin Button */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.beginButton}
                    onPress={handleBegin}
                    activeOpacity={0.8}
                >
                    <Text style={styles.beginButtonText}>Let's begin</Text>
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
        backgroundColor: '#34C759',
        borderRadius: 2,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: 24,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#F0F7FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 36,
        fontWeight: '700',
        color: '#000',
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    personalizedMessage: {
        fontSize: 18,
        color: '#8E8E93',
        textAlign: 'center',
        lineHeight: 26,
        marginBottom: 32,
    },
    winCard: {
        backgroundColor: '#F5F5F7',
        borderRadius: 16,
        padding: 20,
        width: '100%',
        alignItems: 'center',
    },
    winLabel: {
        fontSize: 14,
        color: '#8E8E93',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    winText: {
        fontSize: 17,
        color: '#000',
        fontWeight: '500',
        textAlign: 'center',
        lineHeight: 24,
    },
    buttonContainer: {
        paddingHorizontal: 24,
        paddingBottom: 16,
    },
    beginButton: {
        backgroundColor: '#007AFF',
        borderRadius: 28,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    beginButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },
});
