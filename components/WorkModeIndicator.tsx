import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useWorkMode } from '@/contexts/WorkModeContext';

/**
 * WorkModeIndicator: Focal Glow Design
 * An ambient switcher that uses a centered glow that shifts and 
 * changes color to represent the current state (Life/Work).
 */
export function WorkModeIndicator() {
    const { currentMode, setMode } = useWorkMode();
    const isWork = currentMode === 'work';

    const animation = useRef(new Animated.Value(isWork ? 1 : 0)).current;

    useEffect(() => {
        Animated.spring(animation, {
            toValue: isWork ? 1 : 0,
            useNativeDriver: false,
            friction: 8,
            tension: 40,
        }).start();
    }, [isWork]);

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setMode(isWork ? 'life' : 'work');
    };

    const translateX = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [-18, 18], // Adjusted for better alignment in the container
    });

    const scale = animation.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [1, 1.15, 1],
    });

    const glowColor = animation.interpolate({
        inputRange: [0, 1],
        outputRange: ['#FF9500', '#5856D6'], // Amber for Life, Indigo for Work
    });

    return (
        <Pressable
            onPress={handlePress}
            style={styles.container}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
            <Animated.View
                style={[
                    styles.glow,
                    {
                        transform: [{ translateX }, { scale }],
                        backgroundColor: glowColor,
                        shadowColor: glowColor,
                    }
                ]}
            />
            <BlurView intensity={25} tint="light" style={styles.blurWrapper}>
                <View style={styles.innerContainer}>
                    <Animated.Text style={[
                        styles.label,
                        {
                            opacity: animation.interpolate({
                                inputRange: [0, 1],
                                outputRange: [1, 0.4]
                            }),
                            fontWeight: isWork ? '400' : '700'
                        }
                    ]}>Life</Animated.Text>
                    <View style={styles.divider} />
                    <Animated.Text style={[
                        styles.label,
                        {
                            opacity: animation.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.4, 1]
                            }),
                            fontWeight: isWork ? '700' : '400'
                        }
                    ]}>Work</Animated.Text>
                </View>
            </BlurView>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 36,
        width: 120, // Match original container width
        justifyContent: 'center',
        alignItems: 'center',
    },
    glow: {
        position: 'absolute',
        width: 54,
        height: 54,
        borderRadius: 27,
        opacity: 0.35,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 18,
        elevation: 10,
    },
    blurWrapper: {
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    innerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 32,
    },
    label: {
        fontSize: 13,
        color: '#000',
        paddingHorizontal: 4,
        letterSpacing: -0.3,
    },
    divider: {
        width: 1,
        height: 14,
        backgroundColor: 'rgba(0,0,0,0.06)',
        marginHorizontal: 6,
    }
});
