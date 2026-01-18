import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useWorkMode } from '@/contexts/WorkModeContext';

const { width, height } = Dimensions.get('window');

export function AmbientBackground() {
    const { isWorkMode } = useWorkMode();
    const fadeAnim = useRef(new Animated.Value(isWorkMode ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: isWorkMode ? 1 : 0,
            duration: 800,
            useNativeDriver: true,
        }).start();
    }, [isWorkMode]);

    return (
        <View style={[StyleSheet.absoluteFill]} pointerEvents="none">
            {/* Life Mode Background (Base) */}
            <View style={StyleSheet.absoluteFill}>
                <LinearGradient
                    colors={['#FFFBF0', '#F2F2F7', '#F2F2F7']}
                    locations={[0, 0.4, 1]}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
                {/* Subtle warm orb */}
                <LinearGradient
                    colors={['rgba(255, 149, 0, 0.15)', 'transparent']}
                    style={[styles.orb, { top: -100, left: -100 }]}
                    start={{ x: 0.5, y: 0.5 }}
                    end={{ x: 1, y: 1 }}
                />
            </View>

            {/* Work Mode Background (Overlay) */}
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
                <LinearGradient
                    colors={['#F0F8FF', '#F2F2F7', '#F2F2F7']}
                    locations={[0, 0.4, 1]}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
                {/* Subtle cool orb */}
                <LinearGradient
                    colors={['rgba(0, 122, 255, 0.15)', 'transparent']}
                    style={[styles.orb, { top: -100, right: -100 }]}
                    start={{ x: 0.5, y: 0.5 }}
                    end={{ x: 1, y: 1 }}
                />
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    orb: {
        position: 'absolute',
        width: width * 0.8,
        height: width * 0.8,
        borderRadius: width * 0.4,
    }
});
