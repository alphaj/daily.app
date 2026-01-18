import { Stack } from 'expo-router';

export default function OnboardingLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                gestureEnabled: true,
                contentStyle: { backgroundColor: '#000000' },
            }}
        >
            <Stack.Screen name="get-started" />
            <Stack.Screen name="sign-up-email" />
            <Stack.Screen name="create-password" />
            <Stack.Screen name="login" />
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
