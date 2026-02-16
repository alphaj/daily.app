import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useWorkMode } from '@/contexts/WorkModeContext';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

/**
 * AmbientBackground: A subtle, unified mesh gradient that shifts slightly based on context.
 * 
 * Design:
 * - Base: Warm, engaging neutral (Pearl/Cream)
 * - Life Mode: Subtle warm sunlight (Golden Hour)
 * - Work Mode: Subtle cool focus (Morning Mist)
 * - The transition should be almost imperceptible, just a "feeling" of change.
 */
export function AmbientBackground() {
    const { isWorkMode } = useWorkMode();
    // 0 = Life, 1 = Work
    const modeAnim = useRef(new Animated.Value(isWorkMode ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(modeAnim, {
            toValue: isWorkMode ? 1 : 0,
            duration: 1200, // Very slow, breathing transition
            useNativeDriver: false, // Color interpolation needs JS driver
        }).start();
    }, [isWorkMode]);

    // Interpolate colors for the dynamic orbs
    const orb1Color = modeAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(90, 200, 250, 0.15)', 'rgba(88, 86, 214, 0.12)'] // Teal -> Indigo
    });

    const orb2Color = modeAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(90, 200, 250, 0.10)', 'rgba(88, 86, 214, 0.10)'] // Teal -> Indigo
    });

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* Base Layer - High quality slightly off-white */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#F9F9F9' }]} />

            {/* Top Mesh Gradient Layer */}
            <View style={StyleSheet.absoluteFill}>
                {/* Orb 1: Top Left - Primary Mood Setter */}
                <Animated.View style={[styles.orb, {
                    top: -height * 0.1,
                    left: -width * 0.2,
                    backgroundColor: orb1Color,
                    transform: [{ scale: 1.2 }]
                }]} />

                {/* Orb 2: Bottom Right - Secondary Balancer */}
                <Animated.View style={[styles.orb, {
                    bottom: -height * 0.1,
                    right: -width * 0.2,
                    backgroundColor: orb2Color,
                    transform: [{ scale: 1.5 }]
                }]} />
            </View>

            {/* Glass Texture Overlay - Adds grain/texture for premium feel */}
            <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />

            {/* Final Gradient Wash to unify everything */}
            <LinearGradient
                colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.1)']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    orb: {
        position: 'absolute',
        width: width * 0.8,
        height: width * 0.8,
        borderRadius: width * 0.4,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 0,
        },
        shadowOpacity: 0.1,
        shadowRadius: 50,
        elevation: 10,
        filter: 'blur(60px)', // Web compatibility
    }
});
