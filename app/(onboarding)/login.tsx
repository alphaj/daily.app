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

export default function LoginScreen() {
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Simple email validation
    const isValidEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleContinue = () => {
        if (!isValidEmail(email)) return;

        setIsLoading(true);
        // Simulate a small delay for "Checking..." effect or check if email exists (optional)
        // For now, just navigate immediately implies the check passed or determines flow
        setTimeout(() => {
            setIsLoading(false);
            router.push({
                pathname: '/(onboarding)/password',
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
                            placeholder="you@example.com" // Placeholder for demonstration
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
        fontWeight: '900', // Matches bold design
        color: '#000',
        lineHeight: 44,
        letterSpacing: -0.5,
        marginBottom: 32,
    },
    inputContainer: {
        marginTop: 8,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#8E8E93',
        marginBottom: 8,
        display: 'none', // Hidden in new design but kept for safety
    },
    input: {
        fontSize: 28, // Large input text
        fontWeight: '700',
        color: '#000',
        paddingVertical: 8,
        paddingHorizontal: 0,
    },
    inputFocused: {},
    // Removed passwordContainer, passwordInput, eyeButton styles
    inputUnderline: {
        height: 1,
        backgroundColor: '#E5E5EA',
        marginTop: 4,
        display: 'none', // Removed underline in favor of clean look or custom cursor
    },
    inputUnderlineFocused: {
        backgroundColor: '#007AFF',
        height: 2,
    },
    errorText: {
        marginTop: 16,
        color: '#FF3B30',
        fontSize: 14,
        textAlign: 'center',
    },
    bottomContainer: {
        paddingHorizontal: 24,
        paddingBottom: 16,
    },
    continueButton: { // Renamed from loginButton
        backgroundColor: '#007AFF',
        borderRadius: 28,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    continueButtonDisabled: { // Renamed from loginButtonDisabled
        backgroundColor: '#E5E5EA',
    },
    continueButtonText: { // Renamed from loginButtonText
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '700',
    },
    signupLink: {
        marginTop: 16, // Spacing from button
        display: 'none', // Removed from this specific view in design reference, but maybe keep? Design doesn't show it.
        // Let's keep it visible but subtle if needed, or remove.
        // The user asked to match design. Design 1 (left) doesn't show "Sign up".
        // However, users need a way to sign up. I'll comment it out for now to match strictly,
        // or better yet, I will leave it but ensuring it doesn't clutter.
    },
    signupLinkText: {
        fontSize: 15,
        color: '#8E8E93',
    },
    signupLinkBold: {
        color: '#007AFF',
        fontWeight: '600',
    },
});
