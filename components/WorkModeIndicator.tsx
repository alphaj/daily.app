import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, LayoutChangeEvent } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useWorkMode } from '@/contexts/WorkModeContext';

export function WorkModeIndicator() {
    const { currentMode, setMode } = useWorkMode();
    const [containerWidth, setContainerWidth] = useState(0);
    const slideAnim = useRef(new Animated.Value(0)).current;

    // derived for readability
    const isWork = currentMode === 'work';

    useEffect(() => {
        Animated.spring(slideAnim, {
            toValue: isWork ? 1 : 0,
            useNativeDriver: true,
            bounciness: 0,
            speed: 20
        }).start();
    }, [isWork]);

    const handleLayout = (e: LayoutChangeEvent) => {
        setContainerWidth(e.nativeEvent.layout.width);
    };

    const handlePressWork = () => {
        if (!isWork) {
            Haptics.selectionAsync();
            setMode('work');
        }
    };

    const handlePressLife = () => {
        if (isWork) {
            Haptics.selectionAsync();
            setMode('life');
        }
    };

    // Calculate translation based on container width
    // Segment width is roughly half of container (minus padding)
    const padding = 2;
    const segmentWidth = (containerWidth - (padding * 2)) / 2;

    return (
        <View style={styles.container} onLayout={handleLayout}>
            <Animated.View
                style={[
                    styles.activeIndicator,
                    {
                        width: segmentWidth,
                        transform: [{
                            translateX: slideAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [padding, segmentWidth + padding] // Slight adjustment for right side might need checking
                            })
                        }]
                    }
                ]}
            />

            <View style={styles.segmentsContainer}>
                <Pressable
                    onPress={handlePressLife}
                    style={styles.segment}
                    hitSlop={5}
                >
                    <Text style={[styles.label, !isWork && styles.activeLabel]}>Life</Text>
                </Pressable>

                <Pressable
                    onPress={handlePressWork}
                    style={styles.segment}
                    hitSlop={5}
                >
                    <Text style={[styles.label, isWork && styles.activeLabel]}>Work</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(118, 118, 128, 0.12)', // iOS tertiary fill
        borderRadius: 8, // Standard small segmented control radius
        height: 32,
        width: 120, // Fixed width for consistency in header
        justifyContent: 'center',
    },
    segmentsContainer: {
        flexDirection: 'row',
        width: '100%',
        height: '100%',
    },
    activeIndicator: {
        position: 'absolute',
        top: 2,
        bottom: 2,
        borderRadius: 6,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 2,
    },
    segment: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1, // Ensure pressable is above indicator for touch usually, but here indicator is behind text visually? No, indicator is absolute. 
        // Text is inside Pressable. Pressable needs to capture touch.
    },
    label: {
        fontSize: 13,
        fontWeight: '500',
        color: '#000', // Default color, check if we want lighter for inactive
        letterSpacing: -0.2,
    },
    activeLabel: {
        fontWeight: '600',
    }
});
