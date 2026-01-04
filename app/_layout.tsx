import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { HabitProvider } from "@/contexts/HabitContext";
import { TodoProvider } from "@/contexts/TodoContext";
import { NoteProvider } from "@/contexts/NoteContext";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="habits" options={{ headerShown: false, animation: 'none' }} />
      <Stack.Screen name="todos" options={{ headerShown: false, animation: 'none' }} />
      <Stack.Screen name="menu" options={{ headerShown: false }} />
      <Stack.Screen name="add-habit" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="add-todo" options={{ presentation: "modal", headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <HabitProvider>
        <TodoProvider>
          <NoteProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <RootLayoutNav />
            </GestureHandlerRootView>
          </NoteProvider>
        </TodoProvider>
      </HabitProvider>
    </QueryClientProvider>
  );
}
