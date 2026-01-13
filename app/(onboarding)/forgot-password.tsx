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
import { trpcClient } from '@/lib/trpc';

export default function ForgotPasswordScreen() {
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isValidEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleContinue = async () => {
        if (!isValidEmail(email)) return;

        setIsLoading(true);
        setError(null);

        try {
            const result = await trpcClient.auth.requestPasswordReset.mutate({
                email: email.toLowerCase().trim(),
            });

            console.log('[forgot-password] reset requested:', result);

            router.push({
                pathname: '/(onboarding)/reset-password',
                params: { email: email.toLowerCase().trim() }
            });
        } catch (err: any) {
            console.error('[forgot-password] error:', err);
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <ChevronLeft size={28} color="#000" strokeWidth={1.5} />
                </TouchableOpacity>

                <View style={styles.content}>
                    <Text style={styles.title}>{"Reset your\npassword"}</Text>
                    <Text style={styles.subtitle}>
                        Enter your email and we will send you a code to reset your password.
                    </Text>

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

                    {error && (
                        <Text style={styles.errorText}>{error}</Text>
                    )}
                </View>

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
                            <Text style={styles.continueButtonText}>Send Code</Text>
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
        fontWeight: '900' as const,
        color: '#000',
        lineHeight: 44,
        letterSpacing: -0.5,
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: '#8E8E93',
        lineHeight: 22,
        marginBottom: 32,
    },
    inputContainer: {
        marginTop: 8,
    },
    input: {
        fontSize: 28,
        fontWeight: '700' as const,
        color: '#000',
        paddingVertical: 8,
        paddingHorizontal: 0,
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
        fontWeight: '700' as const,
    },
});
