import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
    WorkModeState,
    WorkModePreferences,
    WorkModeSchedule,
} from '@/types/workmode';
import { DEFAULT_WORK_MODE_PREFERENCES } from '@/types/workmode';

const WORK_MODE_STORAGE_KEY = 'daily_work_mode';

export const [WorkModeProvider, useWorkMode] = createContextHook(() => {
    const queryClient = useQueryClient();
    const [preferences, setPreferences] = useState<WorkModePreferences>(DEFAULT_WORK_MODE_PREFERENCES);

    const preferencesQuery = useQuery({
        queryKey: ['workMode'],
        queryFn: async () => {
            const stored = await AsyncStorage.getItem(WORK_MODE_STORAGE_KEY);
            return stored ? JSON.parse(stored) : DEFAULT_WORK_MODE_PREFERENCES;
        },
    });

    useEffect(() => {
        if (preferencesQuery.data) {
            setPreferences(preferencesQuery.data);
        }
    }, [preferencesQuery.data]);

    const savePreferences = useCallback(async (newPreferences: WorkModePreferences) => {
        await AsyncStorage.setItem(WORK_MODE_STORAGE_KEY, JSON.stringify(newPreferences));
        queryClient.invalidateQueries({ queryKey: ['workMode'] });
    }, [queryClient]);

    const toggleMode = useCallback(async () => {
        const newMode: WorkModeState = preferences.currentMode === 'work' ? 'life' : 'work';
        const newPreferences: WorkModePreferences = {
            ...preferences,
            currentMode: newMode,
            lastModeChange: new Date().toISOString(),
        };
        setPreferences(newPreferences);
        await savePreferences(newPreferences);
        return newMode;
    }, [preferences, savePreferences]);

    const setMode = useCallback(async (mode: WorkModeState) => {
        if (mode === preferences.currentMode) return;
        const newPreferences: WorkModePreferences = {
            ...preferences,
            currentMode: mode,
            lastModeChange: new Date().toISOString(),
        };
        setPreferences(newPreferences);
        await savePreferences(newPreferences);
    }, [preferences, savePreferences]);

    const updateSchedule = useCallback(async (schedule: Partial<WorkModeSchedule>) => {
        const newPreferences: WorkModePreferences = {
            ...preferences,
            schedule: { ...preferences.schedule, ...schedule },
        };
        setPreferences(newPreferences);
        await savePreferences(newPreferences);
    }, [preferences, savePreferences]);

    const toggleScheduleEnabled = useCallback(async () => {
        const newPreferences: WorkModePreferences = {
            ...preferences,
            isScheduleEnabled: !preferences.isScheduleEnabled,
        };
        setPreferences(newPreferences);
        await savePreferences(newPreferences);
    }, [preferences, savePreferences]);

    // Check if we should be in work mode based on schedule
    const getScheduledMode = useCallback((): WorkModeState | null => {
        if (!preferences.isScheduleEnabled) return null;

        const now = new Date();
        const currentHour = now.getHours();
        const currentDay = now.getDay();

        const { workStartHour, workEndHour, workDays } = preferences.schedule;

        const isWorkDay = workDays.includes(currentDay);
        const isWorkHours = currentHour >= workStartHour && currentHour < workEndHour;

        if (isWorkDay && isWorkHours) {
            return 'work';
        }
        return 'life';
    }, [preferences]);

    // Auto-apply scheduled mode
    useEffect(() => {
        const scheduledMode = getScheduledMode();
        if (scheduledMode && scheduledMode !== preferences.currentMode) {
            setMode(scheduledMode);
        }
    }, [getScheduledMode, preferences.currentMode, setMode]);

    const currentMode = preferences.currentMode;
    const isWorkMode = currentMode === 'work';
    const isLifeMode = currentMode === 'life';

    // Check if an item should be shown based on current mode
    // Moved here to use the extracted currentMode value directly
    const shouldShowItem = useCallback((isWorkItem?: boolean): boolean => {
        // In work mode, show only work items
        if (currentMode === 'work') {
            return isWorkItem === true;
        }
        // In life mode, show items that are NOT work items (including undefined)
        return isWorkItem !== true;
    }, [currentMode]);

    return {
        currentMode,
        isWorkMode,
        isLifeMode,
        preferences,
        isLoading: preferencesQuery.isLoading,
        toggleMode,
        setMode,
        updateSchedule,
        toggleScheduleEnabled,
        shouldShowItem,
        getScheduledMode,
    };
});
