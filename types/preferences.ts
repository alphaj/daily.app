export interface UserPreferences {
    theme: 'auto' | 'light' | 'dark';
    hapticsEnabled: boolean;
    startOfWeek: 'sunday' | 'monday';
    timeFormat: '12h' | '24h';
    dailyReminderEnabled: boolean;
    dailyReminderTime: string; // HH:mm format
    habitRemindersEnabled: boolean;
    supplementRemindersEnabled: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
    theme: 'auto',
    hapticsEnabled: true,
    startOfWeek: 'sunday',
    timeFormat: '12h',
    dailyReminderEnabled: false,
    dailyReminderTime: '09:00',
    habitRemindersEnabled: true,
    supplementRemindersEnabled: true,
};
