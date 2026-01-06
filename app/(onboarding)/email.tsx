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
import { ChevronLeft, Eye, EyeOff } from 'lucide-react-native';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/contexts/AuthContext';

export default function EmailScreen() {
    const router = useRouter();
    const { state, setEmail, nextStep } = useOnboarding();
    const { signup } = useAuth();

    const [localEmail, setLocalEmail] = useState(state.responses.email);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);

    const isValidEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const isValidPassword = (pwd: string) => {
        return pwd.length >= 8;
    };

    const handleCreateAccount = async () => {
        if (!canContinue) return;

        setIsLoading(true);
        setError(null);

        const result = await signup({ email: localEmail, password });

        setIsLoading(false);

        if (result.success) {
            setEmail(localEmail);
            nextStep();
            router.push('/(onboarding)/notifications');
        } else {
            setError(result.error || 'Failed to create account');
        }
    };

    const handleLoginPress = () => {
        router.push('/(onboarding)/login');
    };

    const canContinue = isValidEmail(localEmail) && isValidPassword(password);

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
                    <Text style={styles.title}>Create your{'\n'}account</Text>

                    {/* Email Input */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Email</Text>
                        <TextInput
                            style={[
                                styles.input,
                                emailFocused && styles.inputFocused,
                            ]}
                            placeholder="you@example.com"
                            placeholderTextColor="#C7C7CC"
                            value={localEmail}
                            onChangeText={setLocalEmail}
                            onFocus={() => setEmailFocused(true)}
                            onBlur={() => setEmailFocused(false)}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            autoComplete="email"
                            textContentType="emailAddress"
                        />
                        <View
                            style={[
                                styles.inputUnderline,
                                emailFocused && styles.inputUnderlineFocused,
                            ]}
                        />
                    </View>

                    {/* Password Input */}
                    <View style={[styles.inputContainer, { marginTop: 24 }]}>
                        <Text style={styles.inputLabel}>Password</Text>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={[
                                    styles.input,
                                    styles.passwordInput,
                                    passwordFocused && styles.inputFocused,
                                ]}
                                placeholder="At least 8 characters"
                                placeholderTextColor="#C7C7CC"
                                value={password}
                                onChangeText={setPassword}
                                onFocus={() => setPasswordFocused(true)}
                                onBlur={() => setPasswordFocused(false)}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                                autoCorrect={false}
                                autoComplete="password-new"
                                textContentType="newPassword"
                            />
                            <TouchableOpacity
                                style={styles.eyeButton}
                                onPress={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff size={20} color="#8E8E93" />
                                ) : (
                                    <Eye size={20} color="#8E8E93" />
                                )}
                            </TouchableOpacity>
                        </View>
                        <View
                            style={[
                                styles.inputUnderline,
                                passwordFocused && styles.inputUnderlineFocused,
                            ]}
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
                        style={[styles.createButton, !canContinue && styles.createButtonDisabled]}
                        onPress={handleCreateAccount}
                        disabled={!canContinue || isLoading}
                        activeOpacity={0.8}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.createButtonText}>Create account</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.loginLink} onPress={handleLoginPress}>
                        <Text style={styles.loginLinkText}>
                            Already have an account? <Text style={styles.loginLinkBold}>Log in</Text>
                        </Text>
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
        fontWeight: '700',
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
    },
    input: {
        fontSize: 18,
        color: '#000',
        paddingVertical: 8,
        paddingHorizontal: 0,
    },
    inputFocused: {},
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    passwordInput: {
        flex: 1,
    },
    eyeButton: {
        padding: 8,
    },
    inputUnderline: {
        height: 1,
        backgroundColor: '#E5E5EA',
        marginTop: 4,
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
        fontWeight: '600',
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
