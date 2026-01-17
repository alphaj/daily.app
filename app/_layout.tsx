import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { HabitProvider } from "@/contexts/HabitContext";
import { TodoProvider } from "@/contexts/TodoContext";
import { NoteProvider } from "@/contexts/NoteContext";
import { InboxProvider } from "@/contexts/InboxContext";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { trpc, trpcClient } from "@/lib/trpc";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();
import AsyncStorage from "@react-native-async-storage/async-storage";

function useProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [hasCheckedOnboarding, setHasCheckedOnboarding] = React.useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = React.useState(false);

  // Check onboarding status
  React.useEffect(() => {
    AsyncStorage.getItem('@daily_onboarding').then((value) => {
      if (value) {
        const parsed = JSON.parse(value);
        setHasCompletedOnboarding(parsed.hasCompletedOnboarding ?? false);
      }
      setHasCheckedOnboarding(true);
    });
  }, []);

  useEffect(() => {
    if (isLoading || !hasCheckedOnboarding) return;

    const inOnboarding = segments[0] === "(onboarding)";
    const authScreens = ["sign-up-email", "create-password", "login"];
    const inAuthScreen = authScreens.includes(segments[1] as string);

    if (!isAuthenticated && !inOnboarding) {
      // Not authenticated and not in onboarding → go to sign-up
      router.replace("/(onboarding)/sign-up-email");
    } else if (isAuthenticated && !hasCompletedOnboarding && !inOnboarding) {
      // Authenticated but hasn't completed onboarding → go to onboarding
      router.replace("/(onboarding)/notifications");
    } else if (isAuthenticated && hasCompletedOnboarding && inOnboarding) {
      // Authenticated and completed onboarding but still in onboarding → go to dashboard
      router.replace("/");
    } else if (isAuthenticated && inAuthScreen) {
      // Authenticated but on auth screens → skip to onboarding or dashboard
      if (hasCompletedOnboarding) {
        router.replace("/");
      } else {
        router.replace("/(onboarding)/notifications");
      }
    }
  }, [isAuthenticated, isLoading, segments, hasCheckedOnboarding, hasCompletedOnboarding]);
}

function RootLayoutNav() {
  useProtectedRoute();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      <Stack.Screen name="habits" options={{ headerShown: false, animation: 'none' }} />
      <Stack.Screen name="inbox" options={{ headerShown: false, animation: 'none' }} />
      <Stack.Screen name="menu" options={{ headerShown: false }} />
      <Stack.Screen name="add-habit" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="add-todo" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="projects" options={{ headerShown: false }} />
      <Stack.Screen name="add-project" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="project/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="privacy-policy" options={{ headerShown: false }} />
    </Stack>
  );
}

function AppWrapper() {
  return (
    <AuthProvider>
      <HabitProvider>
        <TodoProvider>
          <NoteProvider>
            <InboxProvider>
              <ProjectProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <RootLayoutNav />
                </GestureHandlerRootView>
              </ProjectProvider>
            </InboxProvider>
          </NoteProvider>
        </TodoProvider>
      </HabitProvider>
    </AuthProvider>
  );
}

export default function RootLayout() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AppWrapper />
      </QueryClientProvider>
    </trpc.Provider>
  );
}
