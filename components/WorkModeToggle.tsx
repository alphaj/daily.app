import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Animated,
} from 'react-native';
import { Briefcase, Leaf } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useWorkMode } from '@/contexts/WorkModeContext';
import { MODE_CONFIG } from '@/types/workmode';

interface WorkModeToggleProps {
    /** Compact version for header use */
    compact?: boolean;
    /** Show label text */
    showLabel?: boolean;
}

export function WorkModeToggle({ compact = false, showLabel = true }: WorkModeToggleProps) {
    const { currentMode, isWorkMode, toggleMode } = useWorkMode();
    const slideAnim = useRef(new Animated.Value(isWorkMode ? 1 : 0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const config = MODE_CONFIG[currentMode];

    useEffect(() => {
        Animated.spring(slideAnim, {
            toValue: isWorkMode ? 1 : 0,
            useNativeDriver: false,
            tension: 80,
            friction: 12,
        }).start();
    }, [isWorkMode, slideAnim]);

    const handlePress = async () => {
        // Haptic feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Scale animation
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 0.95,
                duration: 50,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 200,
                friction: 10,
            }),
        ]).start();

        await toggleMode();
    };

    // Interpolated colors
    const backgroundColor = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(90, 200, 250, 0.12)', 'rgba(88, 86, 214, 0.12)'],
    });

    const thumbPosition = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [2, compact ? 26 : 38],
    });

    const thumbColor = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['#5AC8FA', '#5856D6'],
    });

    if (compact) {
        return (
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <Pressable onPress={handlePress} style={styles.compactContainer}>
                    <Animated.View style={[styles.compactTrack, { backgroundColor }]}>
                        <Animated.View
                            style={[
                                styles.compactThumb,
                                {
                                    backgroundColor: thumbColor,
                                    transform: [{ translateX: thumbPosition }],
                                },
                            ]}
                        >
                            {isWorkMode ? (
                                <Briefcase size={12} color="#fff" strokeWidth={2.5} />
                            ) : (
                                <Leaf size={12} color="#fff" strokeWidth={2.5} />
                            )}
                        </Animated.View>
                    </Animated.View>
                </Pressable>
            </Animated.View>
        );
    }

    return (
        <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
            <Pressable onPress={handlePress} style={styles.pressable}>
                <Animated.View style={[styles.track, { backgroundColor }]}>
                    {/* Background icons */}
                    <View style={styles.iconRow}>
                        <View style={[styles.bgIcon, { opacity: isWorkMode ? 0.3 : 1 }]}>
                            <Leaf size={16} color="#5AC8FA" strokeWidth={2} />
                        </View>
                        <View style={[styles.bgIcon, { opacity: isWorkMode ? 1 : 0.3 }]}>
                            <Briefcase size={16} color="#5856D6" strokeWidth={2} />
                        </View>
                    </View>

                    {/* Sliding thumb */}
                    <Animated.View
                        style={[
                            styles.thumb,
                            {
                                backgroundColor: thumbColor,
                                transform: [{ translateX: thumbPosition }],
                            },
                        ]}
                    >
                        {isWorkMode ? (
                            <Briefcase size={18} color="#fff" strokeWidth={2.5} />
                        ) : (
                            <Leaf size={18} color="#fff" strokeWidth={2.5} />
                        )}
                    </Animated.View>
                </Animated.View>

                {showLabel && (
                    <View style={styles.labelContainer}>
                        <Text style={[styles.modeLabel, { color: config.color }]}>
                            {config.emoji} {config.label} Mode
                        </Text>
                        <Text style={styles.modeMessage}>{config.message}</Text>
                    </View>
                )}
            </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignSelf: 'stretch',
    },
    pressable: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        gap: 16,
    },
    track: {
        width: 76,
        height: 40,
        borderRadius: 20,
        cornerCurve: 'continuous',
        justifyContent: 'center',
        position: 'relative',
    },
    iconRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        position: 'absolute',
        left: 0,
        right: 0,
    },
    bgIcon: {
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    thumb: {
        width: 36,
        height: 36,
        borderRadius: 18,
        cornerCurve: 'continuous',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    labelContainer: {
        flex: 1,
    },
    modeLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    modeMessage: {
        fontSize: 13,
        color: '#8E8E93',
    },
    // Compact styles
    compactContainer: {
        padding: 4,
    },
    compactTrack: {
        width: 52,
        height: 28,
        borderRadius: 14,
        cornerCurve: 'continuous',
        justifyContent: 'center',
        position: 'relative',
    },
    compactThumb: {
        width: 24,
        height: 24,
        borderRadius: 12,
        curve: 'continuous',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 2,
    },
});
