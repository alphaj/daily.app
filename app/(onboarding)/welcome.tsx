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
import { SuccessGraphic } from '@/components/SuccessGraphic';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useTodos } from '@/contexts/TodoContext';
import { Fonts } from '@/lib/typography';

const PERSONALIZED_MESSAGES: Record<string, string> = {
    overwhelmed: "Let's clear that mental clutter together.",
    scattered: "We'll help you focus on what matters.",
    stuck: "Small steps lead to big momentum.",
    hopeful: "Great energy! Let's channel it well.",
};

export default function WelcomeScreen() {
    const router = useRouter();
    const { state, completeOnboarding } = useOnboarding();
    const { addTodo } = useTodos();
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

        // Seed default tasks for new users
        await addTodo('Morning routine', new Date(), undefined, false, undefined, {
            emoji: '🌅',
            emojiColor: '#FFF3E0',
            timeOfDay: 'morning',
            repeat: 'daily',
            subtasks: [
                { id: 'seed_1', title: 'Drink a glass of water', completed: false },
                { id: 'seed_2', title: 'Go for a morning walk', completed: false },
                { id: 'seed_3', title: 'Have a healthy breakfast', completed: false },
                { id: 'seed_4', title: 'Plan your day ahead', completed: false },
            ],
        });

        await addTodo('Evening wind-down', new Date(), undefined, false, undefined, {
            emoji: '🌙',
            emojiColor: '#E8E0F0',
            timeOfDay: 'evening',
            repeat: 'daily',
            subtasks: [
                { id: 'seed_5', title: 'Review what you accomplished today', completed: false },
                { id: 'seed_6', title: 'Prepare tomorrow\'s priorities', completed: false },
                { id: 'seed_7', title: 'Put your phone away', completed: false },
                { id: 'seed_8', title: 'Read or journal before bed', completed: false },
            ],
        });

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
                    <SuccessGraphic size={120} />
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
        alignItems: 'center',
    },
    title: {
        fontSize: 36,
        fontFamily: Fonts.heading,
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
