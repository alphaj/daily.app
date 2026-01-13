import React, { useState, useRef } from 'react';
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
import { ChevronLeft, Eye, EyeOff, Check } from 'lucide-react-native';
import { trpcClient } from '@/lib/trpc';
import { useAuth } from '@/contexts/AuthContext';

type Step = 'code' | 'password';

export default function ResetPasswordScreen() {
    const router = useRouter();
    const { email } = useLocalSearchParams<{ email: string }>();
    const { login } = useAuth();

    const [step, setStep] = useState<Step>('code');
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const inputRefs = useRef<(TextInput | null)[]>([]);

    const fullCode = code.join('');
    const isCodeComplete = fullCode.length === 6;
    const isPasswordValid = newPassword.length >= 8;
    const doPasswordsMatch = newPassword === confirmPassword;
    const canResetPassword = isPasswordValid && doPasswordsMatch;

    const handleCodeChange = (text: string, index: number) => {
        if (text.length > 1) {
            const chars = text.split('').slice(0, 6);
            const newCode = [...code];
            chars.forEach((char, i) => {
                if (index + i < 6) {
                    newCode[index + i] = char;
                }
            });
            setCode(newCode);
            const nextIndex = Math.min(index + chars.length, 5);
            inputRefs.current[nextIndex]?.focus();
            return;
        }

        const newCode = [...code];
        newCode[index] = text;
        setCode(newCode);

        if (text && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleCodeKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerifyCode = async () => {
        if (!isCodeComplete || !email) return;

        setIsLoading(true);
        setError(null);

        try {
            await trpcClient.auth.verifyResetCode.mutate({
                email,
                code: fullCode,
            });

            console.log('[reset-password] code verified');
            setStep('password');
        } catch (err: any) {
            console.error('[reset-password] verify error:', err);
            setError(err.message || 'Invalid code. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!canResetPassword || !email) return;

        setIsLoading(true);
        setError(null);

        try {
            const result = await trpcClient.auth.resetPassword.mutate({
                email,
                code: fullCode,
                newPassword,
            });

            console.log('[reset-password] password reset successful');

            if (result.user && result.token) {
                await login({ email, password: newPassword });
                router.replace('/');
            } else {
                router.replace('/(onboarding)/login');
            }
        } catch (err: any) {
            console.error('[reset-password] reset error:', err);
            setError(err.message || 'Failed to reset password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (!email) return;

        setIsLoading(true);
        setError(null);

        try {
            await trpcClient.auth.requestPasswordReset.mutate({ email });
            setCode(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } catch {
            setError('Failed to resend code. Please try again.');
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
                    {step === 'code' ? (
                        <>
                            <Text style={styles.title}>{"Enter the\ncode"}</Text>
                            <Text style={styles.subtitle}>
                                We sent a 6-digit code to {email}
                            </Text>

                            <View style={styles.codeContainer}>
                                {code.map((digit, index) => (
                                    <TextInput
                                        key={index}
                                        ref={(ref) => { inputRefs.current[index] = ref; }}
                                        style={[
                                            styles.codeInput,
                                            digit && styles.codeInputFilled
                                        ]}
                                        value={digit}
                                        onChangeText={(text) => handleCodeChange(text, index)}
                                        onKeyPress={(e) => handleCodeKeyPress(e, index)}
                                        keyboardType="number-pad"
                                        maxLength={6}
                                        autoFocus={index === 0}
                                        selectTextOnFocus
                                    />
                                ))}
                            </View>

                            <TouchableOpacity 
                                style={styles.resendButton} 
                                onPress={handleResendCode}
                                disabled={isLoading}
                            >
                                <Text style={styles.resendText}>Did not receive code? Resend</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <Text style={styles.title}>{"Create new\npassword"}</Text>
                            <Text style={styles.subtitle}>
                                Your password must be at least 8 characters.
                            </Text>

                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.passwordInput}
                                    placeholder="New password"
                                    placeholderTextColor="#C7C7CC"
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    secureTextEntry={!showPassword}
                                    autoFocus
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity
                                    style={styles.eyeButton}
                                    onPress={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff size={22} color="#8E8E93" />
                                    ) : (
                                        <Eye size={22} color="#8E8E93" />
                                    )}
                                </TouchableOpacity>
                            </View>

                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.passwordInput}
                                    placeholder="Confirm password"
                                    placeholderTextColor="#C7C7CC"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                />
                                {confirmPassword.length > 0 && doPasswordsMatch && (
                                    <View style={styles.checkIcon}>
                                        <Check size={20} color="#34C759" />
                                    </View>
                                )}
                            </View>

                            {confirmPassword.length > 0 && !doPasswordsMatch && (
                                <Text style={styles.mismatchText}>Passwords do not match</Text>
                            )}
                        </>
                    )}

                    {error && (
                        <Text style={styles.errorText}>{error}</Text>
                    )}
                </View>

                <View style={styles.bottomContainer}>
                    {step === 'code' ? (
                        <TouchableOpacity
                            style={[styles.continueButton, !isCodeComplete && styles.continueButtonDisabled]}
                            onPress={handleVerifyCode}
                            disabled={!isCodeComplete || isLoading}
                            activeOpacity={0.8}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.continueButtonText}>Verify Code</Text>
                            )}
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.continueButton, !canResetPassword && styles.continueButtonDisabled]}
                            onPress={handleResetPassword}
                            disabled={!canResetPassword || isLoading}
                            activeOpacity={0.8}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.continueButtonText}>Reset Password</Text>
                            )}
                        </TouchableOpacity>
                    )}
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
    codeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
    },
    codeInput: {
        flex: 1,
        height: 56,
        borderWidth: 1.5,
        borderColor: '#E5E5EA',
        borderRadius: 12,
        fontSize: 24,
        fontWeight: '700' as const,
        textAlign: 'center',
        color: '#000',
        backgroundColor: '#F9F9F9',
    },
    codeInputFilled: {
        borderColor: '#007AFF',
        backgroundColor: '#FFF',
    },
    resendButton: {
        marginTop: 24,
        alignSelf: 'center',
    },
    resendText: {
        fontSize: 15,
        color: '#007AFF',
        fontWeight: '600' as const,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
        marginBottom: 16,
    },
    passwordInput: {
        flex: 1,
        fontSize: 20,
        fontWeight: '600' as const,
        color: '#000',
        paddingVertical: 16,
    },
    eyeButton: {
        padding: 8,
    },
    checkIcon: {
        padding: 8,
    },
    mismatchText: {
        color: '#FF3B30',
        fontSize: 14,
        marginTop: -8,
        marginBottom: 16,
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
