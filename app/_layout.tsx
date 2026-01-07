import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { HabitProvider } from "@/contexts/HabitContext";
import { TodoProvider } from "@/contexts/TodoContext";
import { NoteProvider } from "@/contexts/NoteContext";
import { BrainDumpProvider } from "@/contexts/BrainDumpContext";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { LaterProvider } from "@/contexts/LaterContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { trpc, trpcClient } from "@/lib/trpc";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    const inOnboarding = segments[0] === '(onboarding)';

    if (!isAuthenticated && !inOnboarding) {
      // User not authenticated, redirect to signup
      router.replace('/(onboarding)/splash');
    } else if (isAuthenticated && inOnboarding) {
      // User is authenticated but in onboarding, redirect to home
      router.replace('/');
    }
  }, [isLoading, isAuthenticated, segments, router]);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) {
    return null; // Splash screen is still showing
  }

  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="habits" options={{ headerShown: false, animation: 'none' }} />
      <Stack.Screen name="brain-dump" options={{ headerShown: false }} />
      <Stack.Screen name="menu" options={{ headerShown: false }} />
      <Stack.Screen name="add-habit" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="add-todo" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="projects" options={{ headerShown: false }} />
      <Stack.Screen name="add-project" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="project/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="later" options={{ headerShown: false, animation: 'none' }} />
      <Stack.Screen
        name="paywall"
        options={{
          presentation: 'modal',
          headerShown: false,
          gestureEnabled: true,
        }}
      />
    </Stack>
  );
}

function AuthWrapper() {
  return (
    <AuthProvider>
      <HabitProvider>
        <TodoProvider>
          <NoteProvider>
            <BrainDumpProvider>
              <ProjectProvider>
                <LaterProvider>
                  <GestureHandlerRootView style={{ flex: 1 }}>
                    <RootLayoutNav />
                  </GestureHandlerRootView>
                </LaterProvider>
              </ProjectProvider>
            </BrainDumpProvider>
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
        <AuthWrapper />
      </QueryClientProvider>
    </trpc.Provider>
  );
}
