import 'react-native-url-polyfill/auto';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import React, { useEffect, useRef, Component, type ReactNode } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";
import { TodoProvider } from "@/contexts/TodoContext";
import { NoteProvider } from "@/contexts/NoteContext";
import { InboxProvider } from "@/contexts/InboxContext";
import { WorkModeProvider } from "@/contexts/WorkModeContext";
import { PreferencesProvider } from "@/contexts/PreferencesContext";
import { OnboardingProvider, useOnboarding } from "@/contexts/OnboardingContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { BuddyProvider } from "@/contexts/BuddyContext";
import { SyncProvider } from "@/contexts/SyncContext";


import { FocusProvider } from "@/contexts/FocusContext";
import { ToastHost } from "@/components/InAppToast";


SplashScreen.preventAutoHideAsync();
SystemUI.setBackgroundColorAsync('#F2F2F7');

const queryClient = new QueryClient();

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary]', error);
    // Hide splash so the recovery screen is visible
    SplashScreen.hideAsync().catch(() => {});
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.emoji}>:(</Text>
          <Text style={errorStyles.title}>Something went wrong</Text>
          <Text style={errorStyles.subtitle}>The app ran into an unexpected error.</Text>
          <Pressable
            style={errorStyles.button}
            onPress={() => this.setState({ hasError: false })}
          >
            <Text style={errorStyles.buttonText}>Try Again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7', justifyContent: 'center', alignItems: 'center', padding: 32 },
  emoji: { fontSize: 48, marginBottom: 16, color: '#8E8E93' },
  title: { fontSize: 22, fontWeight: '700', color: '#1c1c1e', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#8E8E93', textAlign: 'center', marginBottom: 32 },
  button: { backgroundColor: '#000', borderRadius: 28, paddingVertical: 16, paddingHorizontal: 40 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});

function useProtectedRoute() {
  const segments = useSegments();
  const router = useRouter();
  const { state, isLoading: onboardingLoading, completeOnboarding } = useOnboarding();
  const { session, isLoading: authLoading } = useAuth();
  const recoveryTriggered = useRef(false);

  useEffect(() => {
    if (onboardingLoading || authLoading) return;

    const inOnboarding = segments[0] === "(onboarding)";
    const inLogin = segments[0] === "login";

    if (session && !state.hasCompletedOnboarding && !inOnboarding && !inLogin) {
      // Session exists but onboarding state was lost (e.g. app deleted + reinstalled
      // clears AsyncStorage but Keychain preserves the Supabase session).
      // Auto-complete onboarding — the state update triggers a re-render which
      // causes index.tsx to render <Redirect href="/history" />.
      if (!recoveryTriggered.current) {
        recoveryTriggered.current = true;
        completeOnboarding();
      }
      return;
    }

    if (session && state.hasCompletedOnboarding && (inOnboarding || inLogin)) {
      // Fully onboarded + authenticated user still on onboarding/login — send to home
      router.replace("/");
    } else if (!session && !inOnboarding && !inLogin) {
      if (!state.hasCompletedOnboarding) {
        // New user — send to onboarding
        router.replace("/(onboarding)/get-started");
      } else {
        // Completed onboarding but no session — send to login
        router.replace("/login");
      }
    }
  }, [segments, state.hasCompletedOnboarding, session, onboardingLoading, authLoading, router, completeOnboarding]);
}

const SPLASH_TIMEOUT_MS = 5000;

function RootLayoutNav() {
  useProtectedRoute();
  const { isLoading: onboardingLoading } = useOnboarding();
  const { isLoading: authLoading } = useAuth();

  // Normal splash hide: both contexts have finished loading
  useEffect(() => {
    if (!onboardingLoading && !authLoading) {
      SplashScreen.hideAsync();
    }
  }, [onboardingLoading, authLoading]);

  // Safety timeout: if loading takes too long, hide splash anyway to avoid
  // permanently stuck screen (e.g. SecureStore or AsyncStorage hanging)
  useEffect(() => {
    const timer = setTimeout(() => {
      SplashScreen.hideAsync();
    }, SPLASH_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Stack screenOptions={{ headerBackTitle: "Back", contentStyle: { backgroundColor: '#F2F2F7' } }}>
      <Stack.Screen name="index" options={{ headerShown: false, animation: 'none' }} />
      <Stack.Screen name="flow" options={{ headerShown: false, animation: 'fade', animationDuration: 100 }} />
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="inbox" options={{ headerShown: false, animation: 'fade', animationDuration: 100 }} />
      <Stack.Screen name="menu" options={{ headerShown: false, animation: 'fade', animationDuration: 100 }} />
      <Stack.Screen name="add-todo" options={{ presentation: "modal", headerShown: false }} />

      <Stack.Screen name="history" options={{ headerShown: false, animation: 'fade', animationDuration: 100 }} />
      <Stack.Screen name="schedule" options={{ headerShown: false, animation: 'fade', animationDuration: 100 }} />

      <Stack.Screen name="edit-todo" options={{ presentation: "modal", headerShown: false }} />

      <Stack.Screen name="buddy" options={{ headerShown: false, animation: 'fade', animationDuration: 100 }} />
      <Stack.Screen name="buddy-detail" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="buddy-settings" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="privacy-policy" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="settings-notifications" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="settings-preferences" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="settings-help" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="incomplete" options={{ headerShown: false, animation: 'slide_from_right' }} />
    </Stack>
  );
}

function AppWrapper() {
  return (
    <AuthProvider>
      <BuddyProvider>
      <SyncProvider>
        <FocusProvider>
            <TodoProvider>
              <NoteProvider>
                <InboxProvider>
                  <WorkModeProvider>
                    <PreferencesProvider>
                      <OnboardingProvider>
                        <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
                          <SafeAreaProvider initialMetrics={initialWindowMetrics}>
                            <StatusBar style="dark" />
                            <RootLayoutNav />
                            <ToastHost />
                          </SafeAreaProvider>
                        </GestureHandlerRootView>
                      </OnboardingProvider>
                    </PreferencesProvider>
                  </WorkModeProvider>
                </InboxProvider>
              </NoteProvider>
            </TodoProvider>
        </FocusProvider>
    </SyncProvider>
    </BuddyProvider>
    </AuthProvider>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppWrapper />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
