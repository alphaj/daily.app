export type WorkModeState = 'work' | 'life';

export interface WorkModePreferences {
    currentMode: WorkModeState;
    lastModeChange: string;
}

export const DEFAULT_WORK_MODE_PREFERENCES: WorkModePreferences = {
    currentMode: 'life',
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
