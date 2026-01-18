import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop, Path, G } from 'react-native-svg';

interface SuccessGraphicProps {
    size?: number;
}

export function SuccessGraphic({ size = 120 }: SuccessGraphicProps) {
    // Animation values
    const pulseAnim = useRef(new Animated.Value(0)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Continuous rotation for the outer ring
        const startRotation = () => {
            rotateAnim.setValue(0);
            Animated.loop(
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 10000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ).start();
        };

        // Gentle pulsing for the core
        const startPulsing = () => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 2000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 0,
                        duration: 2000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        };

        startRotation();
        startPulsing();
    }, []);

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const pulseScale = pulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.05],
    });

    const AnimatedSvg = Animated.createAnimatedComponent(Svg);
    const AnimatedG = Animated.createAnimatedComponent(G);
    const AnimatedView = Animated.createAnimatedComponent(View);

    // Center point
    const c = size / 2;
    const radius = size * 0.4;

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <AnimatedView style={{ transform: [{ scale: pulseScale }] }}>
                <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    <Defs>
                        <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                            <Stop offset="0" stopColor="#3B82F6" stopOpacity="0.8" />
                            <Stop offset="1" stopColor="#8B5CF6" stopOpacity="0.8" />
                        </LinearGradient>
                        <LinearGradient id="ringGrad" x1="1" y1="0" x2="0" y2="1">
                            <Stop offset="0" stopColor="#60A5FA" stopOpacity="0.4" />
                            <Stop offset="0.5" stopColor="#A78BFA" stopOpacity="0.1" />
                            <Stop offset="1" stopColor="#3B82F6" stopOpacity="0.4" />
                        </LinearGradient>
                    </Defs>

                    {/* Core Gradient Orb */}
                    <Circle
                        cx={c}
                        cy={c}
                        r={radius}
                        fill="url(#grad)"
                        opacity={0.15}
                    />

                    <Circle
                        cx={c}
                        cy={c}
                        r={radius * 0.7}
                        fill="url(#grad)"
                        opacity={0.3}
                    />
                </Svg>
            </AnimatedView>

            {/* Rotating Ring / Checkmark Abstract */}
            <AnimatedView
                style={[
                    styles.absoluteFill,
                    {
                        transform: [{ rotate: spin }],
                    },
                ]}
            >
                <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    {/* Abstract Orbit Ring */}
                    <Path
                        d={`M ${c} ${c - radius * 1.2} A ${radius * 1.2} ${radius * 1.2} 0 0 1 ${c + radius * 1.2} ${c}`}
                        stroke="url(#ringGrad)"
                        strokeWidth={3}
                        strokeLinecap="round"
                        fill="none"
                    />
                    <Path
                        d={`M ${c} ${c + radius * 1.2} A ${radius * 1.2} ${radius * 1.2} 0 0 1 ${c - radius * 1.2} ${c}`}
                        stroke="url(#ringGrad)"
                        strokeWidth={3}
                        strokeLinecap="round"
                        fill="none"
                    />
                </Svg>
            </AnimatedView>

            {/* Central Abstract Icon (Stylized Check) */}
            <View style={styles.absoluteFill}>
                <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    <Path
                        d={`M ${c - 10} ${c} L ${c - 2} ${c + 8} L ${c + 12} ${c - 6}`}
                        stroke="#fff"
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                    />
                </Svg>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    absoluteFill: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
