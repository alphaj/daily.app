import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { TodoProvider } from "@/contexts/TodoContext";
import { NoteProvider } from "@/contexts/NoteContext";
import { InboxProvider } from "@/contexts/InboxContext";
import { WorkModeProvider } from "@/contexts/WorkModeContext";
import { PreferencesProvider } from "@/contexts/PreferencesContext";
import { OnboardingProvider, useOnboarding } from "@/contexts/OnboardingContext";
import { LaterProvider } from "@/contexts/LaterContext";
import { CalendarEventProvider } from "@/contexts/CalendarEventContext";
import { FocusProvider } from "@/contexts/FocusContext";

import { trpc, trpcClient } from "@/lib/trpc";

SplashScreen.preventAutoHideAsync();
SystemUI.setBackgroundColorAsync('#F2F2F7');

const queryClient = new QueryClient();

function useProtectedRoute() {
  const segments = useSegments();
  const router = useRouter();
  const { state, isLoading } = useOnboarding();

  useEffect(() => {
    if (isLoading) return;

    const inOnboarding = segments[0] === "(onboarding)";

    if (!state.hasCompletedOnboarding && !inOnboarding) {
      router.replace("/(onboarding)/get-started");
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
      <Stack.Screen name="index" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="flow" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      <Stack.Screen name="inbox" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="menu" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="add-todo" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="later" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="history" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="add-event" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="edit-todo" options={{ presentation: "modal", headerShown: false }} />

      <Stack.Screen name="privacy-policy" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="settings-notifications" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="settings-preferences" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="settings-help" options={{ headerShown: false, animation: 'slide_from_right' }} />
    </Stack>
  );
}

function AppWrapper() {
  return (
    <CalendarEventProvider>
      <FocusProvider>
        <LaterProvider>
          <TodoProvider>
            <NoteProvider>
              <InboxProvider>
                <WorkModeProvider>
                  <PreferencesProvider>
                    <OnboardingProvider>
                      <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
                        <RootLayoutNav />
                      </GestureHandlerRootView>
                    </OnboardingProvider>
                  </PreferencesProvider>
                </WorkModeProvider>
              </InboxProvider>
            </NoteProvider>
          </TodoProvider>
        </LaterProvider>
      </FocusProvider>
    </CalendarEventProvider>
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
