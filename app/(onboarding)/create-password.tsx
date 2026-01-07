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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';

export default function CreatePasswordScreen() {
    const router = useRouter();
    const { email } = useLocalSearchParams<{ email: string }>();
    const { signup } = useAuth();
    const { setEmail, nextStep } = useOnboarding();

    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreateAccount = async () => {
        if (!password || !email) return;
        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setIsLoading(true);
        setError(null);

        const result = await signup({ email, password });

        setIsLoading(false);

        if (result.success) {
            setEmail(email);
            nextStep();
            router.push('/(onboarding)/notifications');
        } else {
            setError(result.error || 'Failed to create account');
        }
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
                    <Text style={styles.title}>Create a{'\n'}password</Text>

                    {/* Password Input */}
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor="#C7C7CC"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={true}
                            autoFocus={true}
                            autoCapitalize="none"
                        />
                    </View>

                    {/* Error Message */}
                    {error && (
                        <Text style={styles.errorText}>{error}</Text>
                    )}
                </View>

                {/* Bottom Section */}
                <View style={styles.bottomContainer}>
                    <TouchableOpacity
                        style={[styles.createButton, !password && styles.createButtonDisabled]}
                        onPress={handleCreateAccount}
                        disabled={!password || isLoading}
                        activeOpacity={0.8}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.createButtonText}>Create account</Text>
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
        fontWeight: '900',
        color: '#000',
        lineHeight: 44,
        letterSpacing: -0.5,
        marginBottom: 32,
    },
    inputContainer: {
        marginTop: 8,
    },
    input: {
        fontSize: 28,
        fontWeight: '700',
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
    createButton: {
        backgroundColor: '#007AFF',
        borderRadius: 28,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    createButtonDisabled: {
        backgroundColor: '#E5E5EA',
    },
    createButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '700',
    },
});
