export interface UserPreferences {
    hapticsEnabled: boolean;
    startOfWeek: 'sunday' | 'monday';
    timeFormat: '12h' | '24h';
    dailyReminderEnabled: boolean;
    dailyReminderTime: string; // HH:mm format
}

export const DEFAULT_PREFERENCES: UserPreferences = {
    hapticsEnabled: true,
    startOfWeek: 'sunday',
    timeFormat: '12h',
    dailyReminderEnabled: false,
    dailyReminderTime: '09:00',
};
