import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DAILY_REMINDER_KEY = 'daily_daily_reminder_notification_id';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

/**
 * Request notification permissions from the user
 */
export async function requestNotificationPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') return false;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    return finalStatus === 'granted';
}

/**
 * Schedule a daily reminder notification at a given time (HH:mm)
 */
export async function scheduleDailyReminder(time: string): Promise<string> {
    if (Platform.OS === 'web') return '';

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return '';

    // Cancel existing daily reminder first
    await cancelDailyReminder();

    const [hour, minute] = time.split(':').map(Number);

    try {
        const id = await Notifications.scheduleNotificationAsync({
            content: {
                title: 'Daily Check-in',
                body: 'Take a moment to plan your day.',
                sound: true,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                hour,
                minute,
                repeats: true,
            },
        });
        await AsyncStorage.setItem(DAILY_REMINDER_KEY, id);
        return id;
    } catch (error) {
        console.error('Error scheduling daily reminder:', error);
        return '';
    }
}

/**
 * Cancel the daily reminder notification
 */
export async function cancelDailyReminder(): Promise<void> {
    if (Platform.OS === 'web') return;

    try {
        const id = await AsyncStorage.getItem(DAILY_REMINDER_KEY);
        if (id) {
            await Notifications.cancelScheduledNotificationAsync(id);
            await AsyncStorage.removeItem(DAILY_REMINDER_KEY);
        }
    } catch (error) {
        console.error('Error canceling daily reminder:', error);
    }
}

