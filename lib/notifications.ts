import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

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
 * Convert timeOfDay to hour (24-hour format)
 */
function getHourFromTimeOfDay(timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'with_food'): number {
    switch (timeOfDay) {
        case 'morning':
            return 8; // 8 AM
        case 'afternoon':
            return 14; // 2 PM
        case 'evening':
            return 19; // 7 PM
        case 'with_food':
            return 12; // Noon (assume lunch)
        default:
            return 9; // Default to 9 AM
    }
}

/**
 * Schedule a daily notification for a supplement
 */
export async function scheduleSupplementNotification(
    supplementId: string,
    supplementName: string,
    emoji: string,
    frequency: 'daily' | 'twice_daily' | 'weekly' | 'as_needed',
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'with_food'
): Promise<string[]> {
    if (Platform.OS === 'web' || frequency === 'as_needed') {
        return [];
    }

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
        return [];
    }

    const notificationIds: string[] = [];

    try {
        if (frequency === 'daily') {
            const hour = getHourFromTimeOfDay(timeOfDay);
            const id = await Notifications.scheduleNotificationAsync({
                content: {
                    title: `${emoji} Time for ${supplementName}`,
                    body: 'Don\'t forget to take your supplement!',
                    sound: true,
                    badge: 1,
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                    hour,
                    minute: 0,
                    repeats: true,
                },
            });
            notificationIds.push(id);
        } else if (frequency === 'twice_daily') {
            // Schedule morning
            const morningId = await Notifications.scheduleNotificationAsync({
                content: {
                    title: `${emoji} Time for ${supplementName}`,
                    body: 'Morning dose reminder',
                    sound: true,
                    badge: 1,
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                    hour: 8,
                    minute: 0,
                    repeats: true,
                },
            });
            notificationIds.push(morningId);

            // Schedule evening
            const eveningId = await Notifications.scheduleNotificationAsync({
                content: {
                    title: `${emoji} Time for ${supplementName}`,
                    body: 'Evening dose reminder',
                    sound: true,
                    badge: 1,
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                    hour: 19,
                    minute: 0,
                    repeats: true,
                },
            });
            notificationIds.push(eveningId);
        } else if (frequency === 'weekly') {
            const hour = getHourFromTimeOfDay(timeOfDay);
            // Schedule for Monday (weekday: 2)
            const id = await Notifications.scheduleNotificationAsync({
                content: {
                    title: `${emoji} Time for ${supplementName}`,
                    body: 'Weekly supplement reminder',
                    sound: true,
                    badge: 1,
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                    weekday: 2, // Monday
                    hour,
                    minute: 0,
                    repeats: true,
                },
            });
            notificationIds.push(id);
        }

        return notificationIds;
    } catch (error) {
        console.error('Error scheduling notification:', error);
        return [];
    }
}

/**
 * Cancel notifications for a supplement
 */
export async function cancelSupplementNotifications(notificationIds: string[]): Promise<void> {
    if (Platform.OS === 'web' || !notificationIds || notificationIds.length === 0) {
        return;
    }

    try {
        for (const id of notificationIds) {
            await Notifications.cancelScheduledNotificationAsync(id);
        }
    } catch (error) {
        console.error('Error canceling notifications:', error);
    }
}

/**
 * Reschedule notifications for a supplement (cancel old, schedule new)
 */
export async function rescheduleSupplementNotification(
    oldNotificationIds: string[],
    supplementId: string,
    supplementName: string,
    emoji: string,
    frequency: 'daily' | 'twice_daily' | 'weekly' | 'as_needed',
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'with_food'
): Promise<string[]> {
    await cancelSupplementNotifications(oldNotificationIds);
    return scheduleSupplementNotification(supplementId, supplementName, emoji, frequency, timeOfDay);
}

/**
 * Schedule notifications for a habit
 * TODO: Implement full habit notification logic based on scheduled days
 */
export async function scheduleHabitNotification(
    habitId: string,
    habitName: string,
    emoji: string,
    scheduledDays?: number[]
): Promise<string[]> {
    // Placeholder to prevent crash
    return [];
}

/**
 * Cancel notifications for a habit
 */
export async function cancelHabitNotification(notificationIds: string[]): Promise<void> {
    if (Platform.OS === 'web' || !notificationIds || notificationIds.length === 0) {
        return;
    }
    // Placeholder
}

/**
 * Reschedule notifications for a habit
 */
export async function rescheduleHabitNotification(
    oldNotificationIds: string[],
    habitId: string,
    habitName: string,
    emoji: string,
    scheduledDays?: number[]
): Promise<string[]> {
    // Placeholder
    return [];
}
