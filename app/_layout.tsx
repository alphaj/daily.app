import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { HabitProvider } from "@/contexts/HabitContext";
import { TodoProvider } from "@/contexts/TodoContext";
import { NoteProvider } from "@/contexts/NoteContext";
import { InboxProvider } from "@/contexts/InboxContext";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { trpc, trpcClient } from "@/lib/trpc";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
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
