import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Fonts } from '@/lib/typography';
import * as Haptics from '@/lib/haptics';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { completeOnboarding } = useOnboarding();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0;

  const handleLogin = async () => {
    if (!canSubmit || isLoading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    setError('');

    const { error: signInError } = await signIn(email.trim().toLowerCase(), password);

    if (signInError) {
      setError(signInError);
      setIsLoading(false);
      return;
    }

    // Ensure onboarding is marked complete for users who signed in
    // without going through the full onboarding flow
    await completeOnboarding();

    router.replace('/');
  };

  const handleNewUser = () => {
    router.replace('/(onboarding)/get-started');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F2F2F7', '#FFFFFF', '#E0F7FA']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            {/* Greeting icon */}
            <View style={styles.iconCircle}>
              <Text style={styles.iconEmoji}>👋</Text>
            </View>

            <Text style={styles.title}>Welcome{'\n'}back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.textInput}
                placeholder="your@email.com"
                placeholderTextColor="#C7C7CC"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
              />
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter your password"
                  placeholderTextColor="#C7C7CC"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="current-password"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <Pressable
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#8E8E93" />
                  ) : (
                    <Eye size={20} color="#8E8E93" />
                  )}
                </Pressable>
              </View>
            </View>

          </View>

          <View style={styles.buttonContainer}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <Pressable
              style={({ pressed }) => [
                styles.loginButton,
                !canSubmit && styles.loginButtonDisabled,
                pressed && canSubmit && { transform: [{ scale: 0.98 }], opacity: 0.9 },
              ]}
              onPress={handleLogin}
              disabled={!canSubmit || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Sign in</Text>
              )}
            </Pressable>

            <Pressable onPress={handleNewUser}>
              <Text style={styles.newUserText}>
                Don't have an account? <Text style={styles.newUserLink}>Get started</Text>
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F0F7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconEmoji: {
    fontSize: 32,
  },
  title: {
    fontSize: 40,
    fontFamily: Fonts.heading,
    fontWeight: '700',
    color: '#1c1c1e',
    lineHeight: 46,
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 17,
    color: '#8E8E93',
    marginBottom: 36,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3C3C43',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    fontSize: 17,
    color: '#000',
    backgroundColor: '#F5F5F7',
    borderRadius: 14,
    padding: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
    borderRadius: 14,
  },
  passwordInput: {
    flex: 1,
    fontSize: 17,
    color: '#000',
    padding: 16,
  },
  eyeButton: {
    paddingHorizontal: 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    textAlign: 'center',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 24,
    gap: 16,
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: '#000',
    borderRadius: 32,
    paddingVertical: 20,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 5,
  },
  loginButtonDisabled: {
    backgroundColor: '#E5E5EA',
    shadowOpacity: 0,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  newUserText: {
    fontSize: 15,
    color: '#8E8E93',
  },
  newUserLink: {
    color: '#007AFF',
    fontWeight: '500',
  },
});
