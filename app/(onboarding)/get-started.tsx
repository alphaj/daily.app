import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Animated,
    Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from '@/lib/haptics';
import { ChevronRight, Target, Sparkles, Zap } from 'lucide-react-native';
import { Fonts } from '@/lib/typography';
function AnimatedVisual() {
    const pulse = useRef(new Animated.Value(1)).current;
    const rotate = useRef(new Animated.Value(0)).current;
    const float1 = useRef(new Animated.Value(0)).current;
    const float2 = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        Animated.spring(scale, { toValue: 1, friction: 4, tension: 40, useNativeDriver: true }).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1.08, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        ).start();

        Animated.loop(
            Animated.timing(rotate, { toValue: 1, duration: 12000, easing: Easing.linear, useNativeDriver: true })
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(float1, { toValue: -12, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(float1, { toValue: 12, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(float2, { toValue: 10, duration: 1900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(float2, { toValue: -10, duration: 1900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

    return (
        <Animated.View style={[visualStyles.wrapper, { transform: [{ scale }] }]}>
            <Animated.View style={[visualStyles.outerRing, { transform: [{ rotate: spin }] }]}>
                <View style={visualStyles.ringDot1} />
                <View style={visualStyles.ringDot2} />
                <View style={visualStyles.ringDot3} />
            </Animated.View>
            <Animated.View style={[visualStyles.centerCircle, { transform: [{ scale: pulse }] }]}>
                <Target size={48} color="#fff" strokeWidth={1.5} />
            </Animated.View>
            <Animated.View style={[visualStyles.floatingIcon1, { transform: [{ translateY: float1 }] }]}>
                <Sparkles size={28} color="#34C759" />
            </Animated.View>
            <Animated.View style={[visualStyles.floatingIcon2, { transform: [{ translateY: float2 }] }]}>
                <Zap size={24} color="#FF9500" />
            </Animated.View>
        </Animated.View>
    );
}

const visualStyles = StyleSheet.create({
    wrapper: {
        width: 260,
        height: 260,
        alignItems: 'center',
        justifyContent: 'center',
    },
    outerRing: {
        position: 'absolute',
        width: 220,
        height: 220,
        borderRadius: 110,
        borderWidth: 1.5,
        borderColor: 'rgba(0,122,255,0.15)',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    ringDot1: {
        position: 'absolute',
        top: -5,
        left: '50%',
        marginLeft: -5,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#007AFF',
    },
    ringDot2: {
        position: 'absolute',
        bottom: 20,
        right: 10,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#34C759',
    },
    ringDot3: {
        position: 'absolute',
        bottom: 20,
        left: 10,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF9500',
    },
    centerCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#1c1c1e',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    floatingIcon1: {
        position: 'absolute',
        top: 20,
        right: 15,
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 20,
        shadowColor: '#34C759',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    floatingIcon2: {
        position: 'absolute',
        bottom: 30,
        left: 10,
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 16,
        shadowColor: '#FF9500',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
});

export default function GetStartedScreen() {
    const router = useRouter();
    const handleGetStarted = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push('/(onboarding)/notifications');
    };

    return (
        <View style={styles.container}>
            {/* Background Gradient */}
            <LinearGradient
                colors={['#F2F2F7', '#FFFFFF', '#E0F7FA']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.visualsContainer}>
                    <AnimatedVisual />
                </View>

                <View style={styles.contentContainer}>
                    <Text style={styles.title}>
                        Reach{'\n'}
                        <Text style={{ fontWeight: '400' }}>your</Text>{'\n'}
                        life{'\n'}
                        goals
                    </Text>

                    <View style={styles.bottomActions}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.getStartedButton,
                                pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 }
                            ]}
                            onPress={handleGetStarted}
                        >
                            <Text style={styles.getStartedText}>Get started</Text>
                            <ChevronRight size={20} color="white" />
                        </Pressable>

                        <Pressable onPress={() => router.push('/login')}>
                            <Text style={styles.signInText}>
                                Already have an account? <Text style={styles.signInLink}>Sign in</Text>
                            </Text>
                        </Pressable>

                        <View style={styles.disclaimerContainer}>
                            <Text style={styles.disclaimerText}>
                                By continuing you're accepting our{'\n'}
                            </Text>
                            <View style={styles.disclaimerLinks}>
                                <Pressable onPress={() => router.push('/privacy-policy')}>
                                    <Text style={[styles.disclaimerText, styles.disclaimerLink]}>Terms & Privacy Policy</Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    safeArea: {
        flex: 1,
    },
    visualsContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    contentContainer: {
        paddingHorizontal: 32,
        justifyContent: 'flex-end',
        paddingBottom: 40,
    },
    title: {
        fontSize: 64,
        fontFamily: Fonts.heading,
        fontWeight: '700',
        color: '#1c1c1e',
        lineHeight: 60,
        textTransform: 'lowercase',
        marginBottom: 24,
        letterSpacing: -2,
    },
    bottomActions: {
        gap: 16,
        alignItems: 'center',
    },
    getStartedButton: {
        backgroundColor: '#000',
        width: '100%',
        paddingVertical: 20,
        borderRadius: 32,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 5,
    },
    getStartedText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    signInText: {
        fontSize: 15,
        color: '#8e8e93',
        textAlign: 'center',
    },
    signInLink: {
        color: '#007AFF',
        fontWeight: '500',
    },
    disclaimerContainer: {
        alignItems: 'center',
    },
    disclaimerText: {
        textAlign: 'center',
        color: '#8e8e93',
        fontSize: 12,
        lineHeight: 18,
    },
    disclaimerLinks: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
    },
    disclaimerLink: {
        textDecorationLine: 'underline',
    },
});
