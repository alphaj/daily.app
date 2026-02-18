import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ChevronRight } from 'lucide-react-native';
import LottieView from 'lottie-react-native';
import { Fonts } from '@/lib/typography';
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
                    <LottieView
                        source={require('../../assets/animations/get-started.lottie')}
                        style={styles.lottieAnimation}
                        autoPlay
                        loop
                    />
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
    lottieAnimation: {
        width: 280,
        height: 280,
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
