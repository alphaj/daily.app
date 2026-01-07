import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle, Zap, Calendar } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SplashScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    
    const logoScale = useRef(new Animated.Value(0.3)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const titleOpacity = useRef(new Animated.Value(0)).current;
    const titleTranslate = useRef(new Animated.Value(30)).current;
    const subtitleOpacity = useRef(new Animated.Value(0)).current;
    const featuresOpacity = useRef(new Animated.Value(0)).current;
    const buttonOpacity = useRef(new Animated.Value(0)).current;
    const buttonTranslate = useRef(new Animated.Value(40)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.parallel([
                Animated.spring(logoScale, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
                Animated.timing(logoOpacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]),
            Animated.parallel([
                Animated.timing(titleOpacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(titleTranslate, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]),
            Animated.timing(subtitleOpacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(featuresOpacity, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.parallel([
                Animated.timing(buttonOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(buttonTranslate, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();
    }, [logoScale, logoOpacity, titleOpacity, titleTranslate, subtitleOpacity, featuresOpacity, buttonOpacity, buttonTranslate]);

    const handleGetStarted = () => {
        router.push('/(onboarding)/email');
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#0A0A0A', '#1A1A2E', '#16213E']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
            
            <View style={[styles.content, { paddingTop: insets.top + 60 }]}>
                <Animated.View
                    style={[
                        styles.logoContainer,
                        {
                            opacity: logoOpacity,
                            transform: [{ scale: logoScale }],
                        },
                    ]}
                >
                    <View style={styles.logoCircle}>
                        <View style={styles.logoInner}>
                            <Text style={styles.logoText}>D</Text>
                        </View>
                    </View>
                </Animated.View>

                <Animated.View
                    style={{
                        opacity: titleOpacity,
                        transform: [{ translateY: titleTranslate }],
                    }}
                >
                    <Text style={styles.title}>Daily</Text>
                </Animated.View>

                <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
                    Your mindful productivity companion
                </Animated.Text>

                <Animated.View style={[styles.featuresContainer, { opacity: featuresOpacity }]}>
                    <View style={styles.featureRow}>
                        <View style={styles.featureItem}>
                            <View style={styles.featureIcon}>
                                <CheckCircle size={24} color="#4ADE80" strokeWidth={2} />
                            </View>
                            <Text style={styles.featureText}>Track habits</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <View style={styles.featureIcon}>
                                <Zap size={24} color="#FBBF24" strokeWidth={2} />
                            </View>
                            <Text style={styles.featureText}>Brain dump</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <View style={styles.featureIcon}>
                                <Calendar size={24} color="#60A5FA" strokeWidth={2} />
                            </View>
                            <Text style={styles.featureText}>Plan days</Text>
                        </View>
                    </View>
                </Animated.View>
            </View>

            <Animated.View
                style={[
                    styles.bottomContainer,
                    {
                        paddingBottom: insets.bottom + 24,
                        opacity: buttonOpacity,
                        transform: [{ translateY: buttonTranslate }],
                    },
                ]}
            >
                <TouchableOpacity
                    style={styles.getStartedButton}
                    onPress={handleGetStarted}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={['#3B82F6', '#2563EB']}
                        style={styles.buttonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Text style={styles.getStartedText}>Get Started</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.loginButton}
                    onPress={() => router.push('/(onboarding)/login')}
                    activeOpacity={0.7}
                >
                    <Text style={styles.loginText}>I already have an account</Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A0A',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    logoContainer: {
        marginBottom: 24,
    },
    logoCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(59, 130, 246, 0.3)',
    },
    logoInner: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#3B82F6',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 15,
    },
    logoText: {
        fontSize: 48,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: -2,
    },
    title: {
        fontSize: 52,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -1.5,
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.6)',
        textAlign: 'center',
        marginBottom: 48,
        letterSpacing: 0.3,
    },
    featuresContainer: {
        width: '100%',
    },
    featureRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    featureItem: {
        alignItems: 'center',
    },
    featureIcon: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    featureText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        fontWeight: '500',
    },
    bottomContainer: {
        paddingHorizontal: 24,
    },
    getStartedButton: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
    },
    buttonGradient: {
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    getStartedText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    loginButton: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    loginText: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 15,
        fontWeight: '500',
    },
});
