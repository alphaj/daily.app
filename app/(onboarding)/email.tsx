import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useOnboarding } from '@/contexts/OnboardingContext';

export default function EmailScreen() {
    const router = useRouter();
    const { state } = useOnboarding();

    const [email, setEmail] = useState(state.responses.email || '');
    const [isLoading, setIsLoading] = useState(false);

    // Simple email validation
    const isValidEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleContinue = () => {
        if (!isValidEmail(email)) return;

        setIsLoading(true);
        // Simulate check
        setTimeout(() => {
            setIsLoading(false);
            router.push({
                pathname: '/(onboarding)/create-password',
                params: { email }
            });
        }, 500);
    };


    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                {/* Back Button */}
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <ChevronLeft size={28} color="#000" strokeWidth={1.5} />
                </TouchableOpacity>

                {/* Content */}
                <View style={styles.content}>
                    <Text style={styles.title}>{"What's your\nemail?"}</Text>

                    {/* Email Input */}
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="you@example.com"
                            placeholderTextColor="#C7C7CC"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            autoComplete="email"
                            textContentType="emailAddress"
                            autoFocus={true}
                        />
                    </View>
                </View>

                {/* Bottom Section */}
                <View style={styles.bottomContainer}>
                    <TouchableOpacity
                        style={[styles.continueButton, !isValidEmail(email) && styles.continueButtonDisabled]}
                        onPress={handleContinue}
                        disabled={!isValidEmail(email) || isLoading}
                        activeOpacity={0.8}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.continueButtonText}>Continue</Text>
                        )}
                    </TouchableOpacity>

                    {/* Optional: Navigation to Login if user mistakenly clicked "Sign up" */}
                    {/* <TouchableOpacity style={styles.loginLink} onPress={handleLoginPress}>
                        <Text style={styles.loginLinkText}>
                            Already have an account? <Text style={styles.loginLinkBold}>Log in</Text>
                        </Text>
                    </TouchableOpacity> */}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    keyboardView: {
        flex: 1,
    },
    backButton: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        alignSelf: 'flex-start',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
        marginTop: -60,
    },
    title: {
        fontSize: 36,
        fontWeight: '900', // Bold matches design
        color: '#000',
        lineHeight: 44,
        letterSpacing: -0.5,
        marginBottom: 32,
    },
    inputContainer: {
        marginTop: 8,
    },
    input: {
        fontSize: 28, // Large input
        fontWeight: '700',
        color: '#000',
        paddingVertical: 8,
        paddingHorizontal: 0,
    },
    bottomContainer: {
        paddingHorizontal: 24,
        paddingBottom: 16,
    },
    continueButton: {
        backgroundColor: '#007AFF',
        borderRadius: 28,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    continueButtonDisabled: {
        backgroundColor: '#E5E5EA',
    },
    continueButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '700',
    },
    loginLink: {
        marginTop: 16,
        alignItems: 'center',
    },
    loginLinkText: {
        fontSize: 15,
        color: '#8E8E93',
    },
    loginLinkBold: {
        color: '#007AFF',
        fontWeight: '600',
    },
});
