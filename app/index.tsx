import { Redirect } from 'expo-router';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/contexts/AuthContext';
import { View } from 'react-native';

export default function Index() {
  const { state, isLoading: onboardingLoading } = useOnboarding();
  const { session, isLoading: authLoading } = useAuth();

  // Still loading — show nothing (splash screen is still visible)
  if (onboardingLoading || authLoading) return <View style={{ flex: 1 }} />;

  // Not ready — let useProtectedRoute in _layout handle the redirect
  if (!state.hasCompletedOnboarding || !session) return <View style={{ flex: 1 }} />;

  return <Redirect href="/history" />;
}
