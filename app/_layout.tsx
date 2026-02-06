import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { HabitProvider } from "@/contexts/HabitContext";
import { TodoProvider } from "@/contexts/TodoContext";
import { NoteProvider } from "@/contexts/NoteContext";
import { InboxProvider } from "@/contexts/InboxContext";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { WorkModeProvider } from "@/contexts/WorkModeContext";
import { PreferencesProvider } from "@/contexts/PreferencesContext";

import { SupplementProvider } from "@/contexts/SupplementContext";
import { GroceryProvider } from "@/contexts/GroceryContext";
import { OnboardingProvider, useOnboarding } from "@/contexts/OnboardingContext";
import { LaterProvider } from "@/contexts/LaterContext";
import { CalendarEventProvider } from "@/contexts/CalendarEventContext";
import { JournalProvider } from "@/contexts/JournalContext";
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
      <Stack.Screen name="life" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      <Stack.Screen name="habits" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="inbox" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="menu" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="add-habit" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="add-todo" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="projects" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="add-project" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="project/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="habit-detail" options={{ headerShown: false, animation: 'slide_from_right' }} />

      <Stack.Screen name="add-supplement" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="edit-supplement" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="groceries" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="add-grocery" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="later" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="history" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="add-event" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="edit-habit" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="privacy-policy" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="journal" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="add-journal" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="settings-account" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="settings-membership" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="settings-notifications" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="settings-widgets" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="settings-health" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="settings-preferences" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="settings-help" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="redeem" options={{ presentation: "modal", headerShown: false }} />
    </Stack>
  );
}

function AppWrapper() {
  return (
    <JournalProvider>
      <CalendarEventProvider>
        <GroceryProvider>
          <SupplementProvider>
            <LaterProvider>
              <HabitProvider>
                <TodoProvider>
                  <NoteProvider>
                    <InboxProvider>
                      <ProjectProvider>
                        <WorkModeProvider>
                          <PreferencesProvider>
                          <OnboardingProvider>
                            <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
                              <RootLayoutNav />
                            </GestureHandlerRootView>
                          </OnboardingProvider>
                          </PreferencesProvider>
                        </WorkModeProvider>
                      </ProjectProvider>
                    </InboxProvider>
                  </NoteProvider>
                </TodoProvider>
              </HabitProvider>
            </LaterProvider>
          </SupplementProvider>
        </GroceryProvider>
      </CalendarEventProvider>
    </JournalProvider>
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
