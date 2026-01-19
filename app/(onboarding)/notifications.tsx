import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Bell } from 'lucide-react-native';
import * as Notifications from 'expo-notifications';
import { useOnboarding } from '@/contexts/OnboardingContext';

export default function NotificationsScreen() {
    const router = useRouter();
    const { setNotificationsEnabled, nextStep, previousStep } = useOnboarding();

    const handleAllow = async () => {
        try {
            const { status } = await Notifications.requestPermissionsAsync();
            setNotificationsEnabled(status === 'granted');
        } catch (error) {
            console.error('Notification permission error:', error);
            setNotificationsEnabled(false);
        }
        nextStep();
        router.push('/(onboarding)/loses-day');
    };

    const handleNotNow = () => {
        setNotificationsEnabled(false);
        nextStep();
        router.push('/(onboarding)/loses-day');
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
                    <View style={[styles.progressFill, { width: '16%' }]} />
                </View>
            </View>

            {/* Back Button */}
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <ChevronLeft size={28} color="#000" strokeWidth={1.5} />
            </TouchableOpacity>

            {/* Content */}
            <View style={styles.content}>
                {/* Illustration */}
                <View style={styles.illustrationContainer}>
                    <View style={styles.iconCircle}>
                        <Bell size={48} color="#007AFF" strokeWidth={1.5} />
                    </View>
                </View>

                <Text style={styles.title}>Stay on track,{'\n'}not distracted</Text>
                <Text style={styles.subtitle}>
                    Quick pings for your habits. No noise, just momentum.
                </Text>

                {/* Benefit callout */}
                <View style={styles.statCard}>
                    <Text style={styles.statText}>
                        <Text style={styles.statHighlight}>Gentle reminders</Text> help you stay consistent
                        and build habits that actually stick.
                    </Text>
                </View>
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.allowButton}
                    onPress={handleAllow}
                    activeOpacity={0.8}
                >
                    <Text style={styles.allowButtonText}>Allow notifications</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.skipButton}
                    onPress={handleNotNow}
                    activeOpacity={0.6}
                >
                    <Text style={styles.skipButtonText}>Not now</Text>
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
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -80,
    },
    illustrationContainer: {
        marginBottom: 32,
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#F0F7FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#000',
        lineHeight: 40,
        letterSpacing: -0.5,
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 17,
        color: '#8E8E93',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    statCard: {
        backgroundColor: '#F5F5F7',
        borderRadius: 16,
        padding: 16,
        marginTop: 8,
    },
    statText: {
        fontSize: 15,
        color: '#3C3C43',
        textAlign: 'center',
        lineHeight: 22,
    },
    statHighlight: {
        fontWeight: '600',
        color: '#000',
    },
    buttonContainer: {
        paddingHorizontal: 24,
        paddingBottom: 16,
        gap: 12,
    },
    allowButton: {
        backgroundColor: '#007AFF',
        borderRadius: 28,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    allowButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },
    skipButton: {
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    skipButtonText: {
        color: '#8E8E93',
        fontSize: 17,
        fontWeight: '500',
    },
});
