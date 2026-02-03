import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Animated,
} from 'react-native';
import { Mic, Square } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface VoiceRecordButtonProps {
    isRecording: boolean;
    duration: number;
    onPress: () => void;
    disabled?: boolean;
}

function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function VoiceRecordButton({
    isRecording,
    duration,
    onPress,
    disabled = false,
}: VoiceRecordButtonProps) {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const ringAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isRecording) {
            // Pulse animation while recording
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.08,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ])
            ).start();

            // Ring expanding animation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(ringAnim, {
                        toValue: 1,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(ringAnim, {
                        toValue: 0,
                        duration: 0,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.stopAnimation();
            ringAnim.stopAnimation();
            pulseAnim.setValue(1);
            ringAnim.setValue(0);
        }
    }, [isRecording, pulseAnim, ringAnim]);

    const handlePress = () => {
        Haptics.impactAsync(
            isRecording
                ? Haptics.ImpactFeedbackStyle.Medium
                : Haptics.ImpactFeedbackStyle.Heavy
        );
        onPress();
    };

    const ringScale = ringAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.8],
    });

    const ringOpacity = ringAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.4, 0.2, 0],
    });

    return (
        <View style={styles.container}>
            {/* Duration display */}
            <View style={styles.durationContainer}>
                <Text style={[
                    styles.duration,
                    isRecording && styles.durationRecording
                ]}>
                    {formatDuration(duration)}
                </Text>
                {isRecording && (
                    <View style={styles.recordingIndicator}>
                        <Animated.View
                            style={[
                                styles.recordingDot,
                                { opacity: pulseAnim }
                            ]}
                        />
                        <Text style={styles.recordingText}>Recording</Text>
                    </View>
                )}
            </View>

            {/* Button with rings */}
            <View style={styles.buttonWrapper}>
                {/* Expanding ring effect */}
                {isRecording && (
                    <Animated.View
                        style={[
                            styles.expandingRing,
                            {
                                transform: [{ scale: ringScale }],
                                opacity: ringOpacity,
                            },
                        ]}
                    />
                )}

                {/* Main button */}
                <Animated.View
                    style={[
                        styles.buttonOuter,
                        isRecording && styles.buttonOuterRecording,
                        { transform: [{ scale: pulseAnim }] },
                    ]}
                >
                    <Pressable
                        style={({ pressed }) => [
                            styles.button,
                            isRecording && styles.buttonRecording,
                            pressed && styles.buttonPressed,
                            disabled && styles.buttonDisabled,
                        ]}
                        onPress={handlePress}
                        disabled={disabled}
                    >
                        {isRecording ? (
                            <Square size={32} color="#FFF" fill="#FFF" strokeWidth={0} />
                        ) : (
                            <Mic size={40} color="#FFF" strokeWidth={2} />
                        )}
                    </Pressable>
                </Animated.View>
            </View>

            {/* Helper text */}
            <Text style={styles.helperText}>
                {isRecording ? 'Tap to stop' : 'Tap to start recording'}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
    },
    durationContainer: {
        alignItems: 'center',
        minHeight: 60,
    },
    duration: {
        fontSize: 48,
        fontWeight: '300',
        color: '#8E8E93',
        fontVariant: ['tabular-nums'],
        letterSpacing: 2,
    },
    durationRecording: {
        color: '#FF3B30',
    },
    recordingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
    },
    recordingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF3B30',
    },
    recordingText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#FF3B30',
        letterSpacing: -0.2,
    },
    buttonWrapper: {
        width: 140,
        height: 140,
        alignItems: 'center',
        justifyContent: 'center',
    },
    expandingRing: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#FF3B30',
    },
    buttonOuter: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 59, 48, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonOuterRecording: {
        backgroundColor: 'rgba(255, 59, 48, 0.15)',
    },
    button: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: '#FF3B30',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#FF3B30',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
        elevation: 8,
    },
    buttonRecording: {
        backgroundColor: '#FF3B30',
        shadowOpacity: 0.5,
    },
    buttonPressed: {
        transform: [{ scale: 0.95 }],
        opacity: 0.9,
    },
    buttonDisabled: {
        backgroundColor: '#C7C7CC',
        shadowOpacity: 0,
    },
    helperText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#8E8E93',
        letterSpacing: -0.2,
    },
});
