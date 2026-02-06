import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserPreferences } from '@/types/preferences';
import { DEFAULT_PREFERENCES } from '@/types/preferences';

const STORAGE_KEY = 'daily_preferences';

export const [PreferencesProvider, usePreferences] = createContextHook(() => {
    const queryClient = useQueryClient();
    const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);

    const preferencesQuery = useQuery({
        queryKey: ['preferences'],
        queryFn: async () => {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            return stored ? { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) } : DEFAULT_PREFERENCES;
        },
    });

    useEffect(() => {
        if (preferencesQuery.data) {
            setPreferences(preferencesQuery.data);
        }
    }, [preferencesQuery.data]);

    const updatePreferences = useCallback(async (partial: Partial<UserPreferences>) => {
        const newPreferences = { ...preferences, ...partial };
        setPreferences(newPreferences);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences));
        queryClient.invalidateQueries({ queryKey: ['preferences'] });
    }, [preferences, queryClient]);

    const resetPreferences = useCallback(async () => {
        setPreferences(DEFAULT_PREFERENCES);
        await AsyncStorage.removeItem(STORAGE_KEY);
        queryClient.invalidateQueries({ queryKey: ['preferences'] });
    }, [queryClient]);

    return {
        preferences,
        isLoading: preferencesQuery.isLoading,
        updatePreferences,
        resetPreferences,
    };
});
