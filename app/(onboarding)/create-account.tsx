import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useGoBack } from '@/lib/useGoBack';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react-native';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Fonts } from '@/lib/typography';
import * as Haptics from '@/lib/haptics';

export default function CreateAccountScreen() {
  const router = useRouter();
  const goBack = useGoBack('/(onboarding)/get-started');
  const { state, setName, setEmail, previousStep, nextStep } = useOnboarding();

  const [localName, setLocalName] = useState(state.responses.name ?? '');
  const [localEmail, setLocalEmail] = useState(state.responses.email ?? '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const canContinue =
    localName.trim().length > 0 &&
    isValidEmail(localEmail) &&
    password.length >= 8;

  const handleContinue = () => {
    if (!canContinue) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setError('');

    // Save to onboarding context (password stored temporarily in state, not AsyncStorage)
    setName(localName.trim());
    setEmail(localEmail.trim().toLowerCase());

    // Pass password via route params to welcome screen (not persisted)
    nextStep();
    router.push({
      pathname: '/(onboarding)/welcome',
      params: { password },
    });
  };

  const handleBack = () => {
    previousStep();
    goBack();
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
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              style={styles.backButton}
              onPress={handleBack}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ChevronLeft size={28} color="#000" strokeWidth={1.5} />
            </Pressable>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: '90%' }]} />
            </View>
            <View style={{ width: 28 }} />
          </View>

          {/* Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>Create your{'\n'}account</Text>
            <Text style={styles.subtitle}>This lets you sync your data and connect with a partner</Text>

            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="What should we call you?"
                placeholderTextColor="#C7C7CC"
                value={localName}
                onChangeText={setLocalName}
                autoCapitalize="words"
                autoComplete="given-name"
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
              />
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                ref={emailRef}
                style={styles.textInput}
                placeholder="your@email.com"
                placeholderTextColor="#C7C7CC"
                value={localEmail}
                onChangeText={setLocalEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  ref={passwordRef}
                  style={styles.passwordInput}
                  placeholder="At least 8 characters"
                  placeholderTextColor="#C7C7CC"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="new-password"
                  returnKeyType="done"
                  onSubmitEditing={handleContinue}
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

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </ScrollView>

          {/* Continue Button */}
          <View style={styles.buttonContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.continueButton,
                !canContinue && styles.continueButtonDisabled,
                pressed && canContinue && { transform: [{ scale: 0.98 }], opacity: 0.9 },
              ]}
              onPress={handleContinue}
              disabled={!canContinue || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.continueButtonText}>Continue</Text>
              )}
            </Pressable>

            <Pressable onPress={() => router.replace('/login')}>
              <Text style={styles.loginText}>
                Already have an account? <Text style={styles.loginLink}>Sign in</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#000',
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
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
    lineHeight: 22,
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
    marginTop: 4,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 16,
    alignItems: 'center',
  },
  loginText: {
    fontSize: 15,
    color: '#8E8E93',
  },
  loginLink: {
    color: '#007AFF',
    fontWeight: '500',
  },
  continueButton: {
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
  continueButtonDisabled: {
    backgroundColor: '#E5E5EA',
    shadowOpacity: 0,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
