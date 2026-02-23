import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
    WorkModeState,
    WorkModePreferences,
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

    const currentMode = preferences.currentMode;
    const isWorkMode = currentMode === 'work';
    const isLifeMode = currentMode === 'life';

    const shouldShowItem = useCallback((isWorkItem?: boolean): boolean => {
        if (currentMode === 'work') {
            return isWorkItem === true;
        }
        return isWorkItem !== true;
    }, [currentMode]);

    return {
        currentMode,
        isWorkMode,
        isLifeMode,
        isLoading: preferencesQuery.isLoading,
        toggleMode,
        setMode,
        shouldShowItem,
    };
});
