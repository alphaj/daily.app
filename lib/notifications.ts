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
                body: 'Take a moment to review your habits and plan your day.',
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

/**
 * Convert timeOfDay to hour (24-hour format)
 */
export function getHourFromTimeOfDay(timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'with_food'): number {
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
 * Schedule notifications for a habit on its scheduled days at its preferred time.
 * If no scheduledDays, schedules for every day. If no preferredTime, defaults to 9:00 AM.
 */
export async function scheduleHabitNotification(
    habitId: string,
    habitName: string,
    emoji: string,
    scheduledDays?: number[],
    preferredTime?: string
): Promise<string[]> {
    if (Platform.OS === 'web') {
        return [];
    }

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
        return [];
    }

    const notificationIds: string[] = [];
    // Parse preferredTime (HH:mm) or default to 9:00
    let hour = 9;
    let minute = 0;
    if (preferredTime) {
        const parts = preferredTime.split(':').map(Number);
        hour = parts[0] ?? 9;
        minute = parts[1] ?? 0;
    }

    // Days to schedule: all 7 if not specified, otherwise the given days
    // scheduledDays uses 0=Sunday..6=Saturday; expo-notifications weekday uses 1=Sunday..7=Saturday
    const days = scheduledDays && scheduledDays.length > 0
        ? scheduledDays
        : [0, 1, 2, 3, 4, 5, 6];

    try {
        for (const day of days) {
            const weekday = day + 1; // Convert 0-based to 1-based for expo-notifications
            const id = await Notifications.scheduleNotificationAsync({
                content: {
                    title: `${emoji || '⚡'} Time for ${habitName}`,
                    body: 'Keep your streak going!',
                    sound: true,
                    badge: 1,
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                    weekday,
                    hour,
                    minute,
                    repeats: true,
                },
            });
            notificationIds.push(id);
        }
        return notificationIds;
    } catch (error) {
        console.error('Error scheduling habit notification:', error);
        return [];
    }
}

/**
 * Cancel notifications for a habit
 */
export async function cancelHabitNotification(notificationIds: string[]): Promise<void> {
    if (Platform.OS === 'web' || !notificationIds || notificationIds.length === 0) {
        return;
    }

    try {
        for (const id of notificationIds) {
            await Notifications.cancelScheduledNotificationAsync(id);
        }
    } catch (error) {
        console.error('Error canceling habit notifications:', error);
    }
}

/**
 * Reschedule notifications for a habit (cancel old, schedule new)
 */
export async function rescheduleHabitNotification(
    oldNotificationIds: string[],
    habitId: string,
    habitName: string,
    emoji: string,
    scheduledDays?: number[],
    preferredTime?: string
): Promise<string[]> {
    await cancelHabitNotification(oldNotificationIds);
    return scheduleHabitNotification(habitId, habitName, emoji, scheduledDays, preferredTime);
}
