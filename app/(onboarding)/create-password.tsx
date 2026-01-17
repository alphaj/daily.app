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
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Check, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys to clear on new sign-up
const STORAGE_KEYS_TO_CLEAR = [
    'daily_projects',
    'daily_todos',
    'daily_habits',
    'inbox_items',
    'inbox_migration_done',
    '@daily_onboarding',
];

async function clearLocalData() {
    try {
        await AsyncStorage.multiRemove(STORAGE_KEYS_TO_CLEAR);
        console.log('[CreatePassword] Cleared local data for new user');
    } catch (error) {
        console.error('[CreatePassword] Failed to clear local data:', error);
    }
}

export default function CreatePasswordScreen() {
    const router = useRouter();
    const { email } = useLocalSearchParams<{ email: string }>();
    const { signUp } = useAuth();

    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const checkmarkAnim = useRef(new Animated.Value(0)).current;

    const isValidPassword = password.length >= 8;
    const canContinue = isValidPassword && agreedToTerms;

    useEffect(() => {
        Animated.timing(checkmarkAnim, {
            toValue: isValidPassword ? 1 : 0,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [isValidPassword]);

    const handleContinue = async () => {
        if (!canContinue || !email) return;

        setIsLoading(true);

        // Clear any existing local data before creating new account
        await clearLocalData();

        const { error } = await signUp(email, password);
        setIsLoading(false);

        if (error) {
            Alert.alert('Sign Up Failed', error.message);
            return;
        }

        // Navigate to onboarding flow
        router.replace('/(onboarding)/notifications');
    };

    const handleBack = () => {
        router.back();
    };

    const openPrivacyPolicy = () => {
        router.push('/privacy-policy');
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
                    <Text style={styles.title}>Create a password</Text>

                    <View style={[
                        styles.inputContainer,
                        isFocused && styles.inputContainerFocused,
                    ]}>
                        <TextInput
                            style={styles.input}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="At least 8 characters"
                            placeholderTextColor="#666666"
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                            autoCorrect={false}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
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
                </View>

                {/* Terms Checkbox & Continue Button */}
                <View style={styles.bottomContainer}>
                    <TouchableOpacity
                        style={styles.termsContainer}
                        onPress={() => setAgreedToTerms(!agreedToTerms)}
                        activeOpacity={0.7}
                    >
                        <View style={[
                            styles.checkbox,
                            agreedToTerms && styles.checkboxChecked,
                        ]}>
                            {agreedToTerms && (
                                <Check size={14} color="#FFFFFF" strokeWidth={3} />
                            )}
                        </View>
                        <Text style={styles.termsText}>
                            I agree to the{' '}
                            <Text style={styles.termsLink} onPress={openPrivacyPolicy}>
                                Privacy Policy
                            </Text>
                            {' & '}
                            <Text style={styles.termsLink} onPress={openPrivacyPolicy}>
                                Terms of Service
                            </Text>
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.continueButton,
                            !canContinue && styles.continueButtonDisabled,
                        ]}
                        onPress={handleContinue}
                        disabled={!canContinue || isLoading}
                        activeOpacity={0.8}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#000000" />
                        ) : (
                            <Text style={[
                                styles.continueButtonText,
                                !canContinue && styles.continueButtonTextDisabled,
                            ]}>
                                Continue
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
        marginRight: 8,
    },
    checkmarkContainer: {
        marginLeft: 4,
    },
    bottomContainer: {
        paddingHorizontal: 24,
        paddingBottom: 16,
    },
    termsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#3A3A3C',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    checkboxChecked: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    termsText: {
        fontSize: 14,
        color: '#8E8E93',
        flex: 1,
    },
    termsLink: {
        color: '#FFFFFF',
        textDecorationLine: 'underline',
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
