import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Check } from 'lucide-react-native';

export default function SignUpEmailScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const checkmarkAnim = useRef(new Animated.Value(0)).current;

    const isValidEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const isValid = isValidEmail(email);

    useEffect(() => {
        Animated.timing(checkmarkAnim, {
            toValue: isValid ? 1 : 0,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [isValid]);

    const handleContinue = () => {
        if (isValid) {
            router.push({
                pathname: '/(onboarding)/create-password',
                params: { email },
            });
        }
    };

    const handleBack = () => {
        router.back();
    };

    const handleSignIn = () => {
        router.push('/(onboarding)/login');
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
                    <Text style={styles.label}>SIGN UP</Text>
                    <Text style={styles.title}>What is your email?</Text>

                    <View style={[
                        styles.inputContainer,
                        isFocused && styles.inputContainerFocused,
                    ]}>
                        <TextInput
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="email@example.com"
                            placeholderTextColor="#666666"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            autoComplete="email"
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                        />
                        <Animated.View
                            style={[
                                styles.checkmarkContainer,
                                {
                                    opacity: checkmarkAnim,
                                    transform: [{ scale: checkmarkAnim }],
                                },
                            ]}
                        >
                            <Check size={24} color="#34C759" strokeWidth={3} />
                        </Animated.View>
                    </View>

                    <TouchableOpacity onPress={handleSignIn} style={styles.signInLink}>
                        <Text style={styles.signInText}>
                            Already have an account? <Text style={styles.signInTextBold}>Sign in</Text>
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Continue Button */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[
                            styles.continueButton,
                            !isValid && styles.continueButtonDisabled,
                        ]}
                        onPress={handleContinue}
                        disabled={!isValid}
                        activeOpacity={0.8}
                    >
                        <Text style={[
                            styles.continueButtonText,
                            !isValid && styles.continueButtonTextDisabled,
                        ]}>
                            Continue
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
    checkmarkContainer: {
        marginLeft: 12,
    },
    signInLink: {
        marginTop: 24,
    },
    signInText: {
        fontSize: 15,
        color: '#8E8E93',
    },
    signInTextBold: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    buttonContainer: {
        paddingHorizontal: 24,
        paddingBottom: 16,
    },
    continueButton: {
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    continueButtonDisabled: {
        backgroundColor: '#3A3A3C',
    },
    continueButtonText: {
        color: '#000000',
        fontSize: 17,
        fontWeight: '600',
    },
    continueButtonTextDisabled: {
        color: '#8E8E93',
    },
});
