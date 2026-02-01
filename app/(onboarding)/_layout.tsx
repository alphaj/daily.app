import { Stack } from 'expo-router';

export default function OnboardingLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: 'fade',
                gestureEnabled: true,
                contentStyle: { backgroundColor: '#FFFFFF' },
            }}
        >
            <Stack.Screen name="get-started" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="loses-day" />
            <Stack.Screen name="falls-through" />
            <Stack.Screen name="feeling" />
            <Stack.Screen name="today-win" />
            <Stack.Screen name="welcome" />
            <Stack.Screen
                name="privacy-policy"
                options={{
                    presentation: 'modal',
                    headerShown: true,
                    headerTitle: 'Privacy Policy',
                    headerBackTitle: 'Back'
                }}
            />
        </Stack>
    );
}
