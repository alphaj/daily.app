export type WorkModeState = 'work' | 'life';

export interface WorkModeSchedule {
    /** Hour to switch to work mode (0-23) */
    workStartHour: number;
    /** Hour to switch to life mode (0-23) */
    workEndHour: number;
    /** Days of week work schedule applies (0-6, Sunday-Saturday) */
    workDays: number[];
}

export interface WorkModePreferences {
    /** Current mode */
    currentMode: WorkModeState;
    /** Whether auto-scheduling is enabled */
    isScheduleEnabled: boolean;
    /** Schedule configuration */
    schedule: WorkModeSchedule;
    /** Whether to show peek reminder when viewing work items in life mode */
    showPeekReminder: boolean;
    /** Last time mode was changed */
    lastModeChange: string;
}

export const DEFAULT_WORK_MODE_PREFERENCES: WorkModePreferences = {
    currentMode: 'life',
    isScheduleEnabled: false,
    schedule: {
        workStartHour: 9,
        workEndHour: 18,
        workDays: [1, 2, 3, 4, 5], // Monday-Friday
    },
    showPeekReminder: true,
    lastModeChange: new Date().toISOString(),
};

export const MODE_CONFIG: Record<WorkModeState, {
    label: string;
    emoji: string;
    color: string;
    backgroundColor: string;
    message: string;
}> = {
    work: {
        label: 'Work',
        emoji: '💼',
        color: '#5856D6',
        backgroundColor: 'rgba(88, 86, 214, 0.08)',
        message: 'Stay focused',
    },
    life: {
        label: 'Life',
        emoji: '🌿',
        color: '#5AC8FA',
        backgroundColor: 'rgba(90, 200, 250, 0.08)',
        message: 'Enjoy your time',
    },
};
