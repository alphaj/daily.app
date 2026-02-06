import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useState, useEffect, useMemo } from 'react';
import type { HealthData, HealthWeekday } from '@/types/health';
import {
    isHealthKitAvailable,
    requestHealthPermissions,
    fetchTodayHealthData,
    fetchWeeklySteps,
} from '@/lib/healthkit';

export const [HealthProvider, useHealth] = createContextHook(() => {
    const [isAvailable] = useState(() => isHealthKitAvailable());
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [todayData, setTodayData] = useState<HealthData>({
        steps: 0,
        distance: 0,
        activeEnergy: 0,
        restingHeartRate: null,
        sleepHours: null,
    });
    const [weeklySteps, setWeeklySteps] = useState<HealthWeekday[]>([]);

    const authorize = useCallback(async () => {
        if (!isAvailable) return false;
        const granted = await requestHealthPermissions();
        setIsAuthorized(granted);
        return granted;
    }, [isAvailable]);

    const refresh = useCallback(async () => {
        if (!isAvailable || !isAuthorized) return;
        setIsLoading(true);
        try {
            const [today, weekly] = await Promise.all([
                fetchTodayHealthData(),
                fetchWeeklySteps(),
            ]);
            setTodayData(today);
            setWeeklySteps(weekly);
        } finally {
            setIsLoading(false);
        }
    }, [isAvailable, isAuthorized]);

    // Auto-refresh when authorized
    useEffect(() => {
        if (isAuthorized) {
            refresh();
        }
    }, [isAuthorized, refresh]);

    const formattedDistance = useMemo(() => {
        if (todayData.distance >= 1000) {
            return `${(todayData.distance / 1000).toFixed(1)} km`;
        }
        return `${todayData.distance} m`;
    }, [todayData.distance]);

    return {
        isAvailable,
        isAuthorized,
        isLoading,
        todayData,
        weeklySteps,
        formattedDistance,
        authorize,
        refresh,
    };
});
