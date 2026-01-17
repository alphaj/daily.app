import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
    const router = useRouter();
    const { signIn } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);

    const isValidEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const canSignIn = isValidEmail(email) && password.length >= 8;

    const handleSignIn = async () => {
        if (!canSignIn) return;

        setIsLoading(true);
        const { error } = await signIn(email, password);
        setIsLoading(false);

        if (error) {
            Alert.alert('Sign In Failed', error.message);
            return;
        }

        // Auth state change will handle navigation
        router.replace('/');
    };

    const handleBack = () => {
        router.back();
    };

    const handleSignUp = () => {
        router.push('/(onboarding)/sign-up-email');
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <ChevronLeft size={28} color="#FFFFFF" strokeWidth={2} />
                    </TouchableOpacity>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    <Text style={styles.label}>WELCOME BACK</Text>
                    <Text style={styles.title}>Sign in</Text>

                    {/* Email Input */}
                    <View style={[
                        styles.inputContainer,
                        emailFocused && styles.inputContainerFocused,
                    ]}>
                        <TextInput
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Email"
                            placeholderTextColor="#666666"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            autoComplete="email"
                            onFocus={() => setEmailFocused(true)}
                            onBlur={() => setEmailFocused(false)}
                        />
                    </View>

                    {/* Password Input */}
                    <View style={[
                        styles.inputContainer,
                        passwordFocused && styles.inputContainerFocused,
                        { marginTop: 16 },
                    ]}>
                        <TextInput
                            style={styles.input}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Password"
                            placeholderTextColor="#666666"
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                            autoCorrect={false}
                            onFocus={() => setPasswordFocused(true)}
                            onBlur={() => setPasswordFocused(false)}
                        />
                        <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                            style={styles.eyeButton}
                        >
                            {showPassword ? (
                                <EyeOff size={22} color="#8E8E93" />
                            ) : (
                                <Eye size={22} color="#8E8E93" />
                            )}
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity onPress={handleSignUp} style={styles.signUpLink}>
                        <Text style={styles.signUpText}>
                            Don't have an account? <Text style={styles.signUpTextBold}>Sign up</Text>
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Sign In Button */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[
                            styles.signInButton,
                            !canSignIn && styles.signInButtonDisabled,
                        ]}
                        onPress={handleSignIn}
                        disabled={!canSignIn || isLoading}
                        activeOpacity={0.8}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#000000" />
                        ) : (
                            <Text style={[
                                styles.signInButtonText,
                                !canSignIn && styles.signInButtonTextDisabled,
                            ]}>
                                Sign In
                            </Text>
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
        backgroundColor: '#000000',
    },
    keyboardView: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 24,
    },
    backButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: -8,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
        letterSpacing: 1,
        marginBottom: 8,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 32,
        letterSpacing: -0.5,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 56,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    inputContainerFocused: {
        borderColor: '#3A3A3C',
    },
    input: {
        flex: 1,
        fontSize: 17,
        color: '#FFFFFF',
        height: '100%',
    },
    eyeButton: {
        padding: 4,
    },
    signUpLink: {
        marginTop: 24,
    },
    signUpText: {
        fontSize: 15,
        color: '#8E8E93',
    },
    signUpTextBold: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    buttonContainer: {
        paddingHorizontal: 24,
        paddingBottom: 16,
    },
    signInButton: {
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    signInButtonDisabled: {
        backgroundColor: '#3A3A3C',
    },
    signInButtonText: {
        color: '#000000',
        fontSize: 17,
        fontWeight: '600',
    },
    signInButtonTextDisabled: {
        color: '#8E8E93',
    },
});
