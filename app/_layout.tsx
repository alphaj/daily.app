import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { HabitProvider } from "@/contexts/HabitContext";
import { TodoProvider } from "@/contexts/TodoContext";
import { NoteProvider } from "@/contexts/NoteContext";
import { InboxProvider } from "@/contexts/InboxContext";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { OnboardingProvider, useOnboarding } from "@/contexts/OnboardingContext";
import { trpc, trpcClient } from "@/lib/trpc";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function useProtectedRoute() {
  const segments = useSegments();
  const router = useRouter();
  const { state, isLoading } = useOnboarding();

  useEffect(() => {
    if (isLoading) return;

    const inOnboarding = segments[0] === "(onboarding)";

    if (!state.hasCompletedOnboarding && !inOnboarding) {
      router.replace("/(onboarding)/welcome");
    } else if (state.hasCompletedOnboarding && inOnboarding) {
      router.replace("/");
    }
  }, [segments, state.hasCompletedOnboarding, isLoading, router]);
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
      <Stack.Screen name="habit-detail" options={{ headerShown: false }} />
      <Stack.Screen name="privacy-policy" options={{ headerShown: false }} />
    </Stack>
  );
}

function AppWrapper() {
  return (
    <HabitProvider>
      <TodoProvider>
        <NoteProvider>
          <InboxProvider>
            <ProjectProvider>
              <OnboardingProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <RootLayoutNav />
                </GestureHandlerRootView>
              </OnboardingProvider>
            </ProjectProvider>
          </InboxProvider>
        </NoteProvider>
      </TodoProvider>
    </HabitProvider>
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
