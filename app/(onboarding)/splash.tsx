import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    TouchableOpacity,
    ImageBackground,
    Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function SplashScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const floatAnim1 = useRef(new Animated.Value(0)).current;
    const floatAnim2 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Entrance animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            })
        ]).start();

        // Floating animations for elements
        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim1, {
                    toValue: 10,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(floatAnim1, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim2, {
                    toValue: -8,
                    duration: 2500,
                    useNativeDriver: true,
                }),
                Animated.timing(floatAnim2, {
                    toValue: 0,
                    duration: 2500,
                    useNativeDriver: true,
                }),
            ])
        ).start();

    }, [fadeAnim, slideAnim, floatAnim1, floatAnim2]);

    const handleGetStarted = () => {
        router.push('/(onboarding)/email');
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <ImageBackground
                source={require('@/assets/images/splash/bg.png')}
                style={styles.background}
                resizeMode="cover"
            >
                <View style={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom + 20 }]}>

                    {/* Decorative Elements Layer */}
                    <View style={styles.decorationsContainer}>
                        {/* Raccoon - Top Right */}
                        <Animated.View style={[
                            styles.raccoonContainer,
                            { transform: [{ translateY: floatAnim2 }] }
                        ]}>
                            <Image
                                source={require('@/assets/images/splash/raccoon.png')}
                                style={styles.raccoonImage}
                                contentFit="contain"
                            />
                        </Animated.View>
                    </View>

                    {/* Main Content */}
                    <Animated.View style={[
                        styles.mainContent,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}>
                        <Text style={styles.title}>
                            Reach{"\n"}your{"\n"}weight{"\n"}goals
                        </Text>
                    </Animated.View>

                    {/* Buttons */}
                    <Animated.View style={[
                        styles.buttonContainer,
                        { opacity: fadeAnim }
                    ]}>
                        <TouchableOpacity
                            style={styles.getStartedButton}
                            onPress={handleGetStarted}
                            activeOpacity={0.9}
                        >
                            <Text style={styles.getStartedButtonText}>Get started</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.loginButton}
                            onPress={() => router.push('/(onboarding)/login')}
                        >
                            <Text style={styles.loginButtonText}>I already have an account</Text>
                        </TouchableOpacity>
                    </Animated.View>

                </View>
            </ImageBackground>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E0F2FE', // Fallback color
    },
    background: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
    },
    decorationsContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '60%', // Top half of screen for images
        zIndex: 1,
    },
    raccoonContainer: {
        position: 'absolute',
        top: '15%',
        right: -10,
        width: 160,
        height: 160,
        alignItems: 'center',
    },
    raccoonImage: {
        width: 120,
        height: 120,
        borderRadius: 60, // Make it circular-ish if needed
    },
    mainContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: SCREEN_HEIGHT * 0.35, // Push title down below images
        zIndex: 2,
    },
    title: {
        fontSize: 64,
        fontWeight: '800',
        color: '#1e293b',
        textAlign: 'center',
        lineHeight: 64,
        letterSpacing: -2,
    },
    buttonContainer: {
        paddingHorizontal: 24,
        gap: 16,
        zIndex: 2,
    },
    getStartedButton: {
        backgroundColor: '#1F2937', // Dark color from screenshot
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    getStartedButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
    loginButton: {
        paddingVertical: 10,
        alignItems: 'center',
    },
    loginButtonText: {
        color: '#4B5563',
        fontSize: 16,
        fontWeight: '500',
    },
});
