import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import type { WaterEntry, WaterSettings, DailyWaterLog } from '@/types/water';

const WATER_STORAGE_KEY = 'daily_water_log';
const WATER_SETTINGS_KEY = 'daily_water_settings';

// Default settings
const DEFAULT_SETTINGS: WaterSettings = {
    dailyGoal: 2000, // 2 liters
    glassSize: 250, // 250ml glass
    bottleSize: 500, // 500ml bottle
};

function getToday(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function generateId(): string {
    return Crypto.randomUUID();
}

export const [WaterProvider, useWater] = createContextHook(() => {
    const queryClient = useQueryClient();
    const [todayLog, setTodayLog] = useState<DailyWaterLog>({
        date: getToday(),
        entries: [],
        totalMl: 0,
    });
    const [settings, setSettings] = useState<WaterSettings>(DEFAULT_SETTINGS);

    // Load today's log
    const logQuery = useQuery({
        queryKey: ['water', 'log'],
        queryFn: async () => {
            const stored = await AsyncStorage.getItem(WATER_STORAGE_KEY);
            if (stored) {
                const logs: Record<string, DailyWaterLog> = JSON.parse(stored);
                const today = getToday();
                if (logs[today]) {
                    return logs[today];
                }
            }
            return { date: getToday(), entries: [], totalMl: 0 };
        },
    });

    // Load settings
    const settingsQuery = useQuery({
        queryKey: ['water', 'settings'],
        queryFn: async () => {
            const stored = await AsyncStorage.getItem(WATER_SETTINGS_KEY);
            if (stored) {
                return JSON.parse(stored) as WaterSettings;
            }
            return DEFAULT_SETTINGS;
        },
    });

    useEffect(() => {
        if (logQuery.data) {
            // Check if date matches today, otherwise reset
            const today = getToday();
            if (logQuery.data.date === today) {
                setTodayLog(logQuery.data);
            } else {
                setTodayLog({ date: today, entries: [], totalMl: 0 });
            }
        }
    }, [logQuery.data]);

    useEffect(() => {
        if (settingsQuery.data) {
            setSettings(settingsQuery.data);
        }
    }, [settingsQuery.data]);

    const saveLog = useCallback(async (log: DailyWaterLog) => {
        // Get all logs and update today's
        const stored = await AsyncStorage.getItem(WATER_STORAGE_KEY);
        const logs: Record<string, DailyWaterLog> = stored ? JSON.parse(stored) : {};
        logs[log.date] = log;

        // Keep only last 30 days of logs
        const dates = Object.keys(logs).sort().reverse();
        const trimmedLogs: Record<string, DailyWaterLog> = {};
        dates.slice(0, 30).forEach(date => {
            trimmedLogs[date] = logs[date];
        });

        await AsyncStorage.setItem(WATER_STORAGE_KEY, JSON.stringify(trimmedLogs));
        queryClient.invalidateQueries({ queryKey: ['water', 'log'] });
    }, [queryClient]);

    const saveSettings = useCallback(async (newSettings: WaterSettings) => {
        await AsyncStorage.setItem(WATER_SETTINGS_KEY, JSON.stringify(newSettings));
        setSettings(newSettings);
        queryClient.invalidateQueries({ queryKey: ['water', 'settings'] });
    }, [queryClient]);

    const addWater = useCallback(async (type: 'glass' | 'bottle' | 'custom', customAmount?: number) => {
        let amount: number;
        if (type === 'glass') {
            amount = settings.glassSize;
        } else if (type === 'bottle') {
            amount = settings.bottleSize;
        } else {
            amount = customAmount || 250;
        }

        const entry: WaterEntry = {
            id: generateId(),
            amount,
            type,
            timestamp: new Date().toISOString(),
        };

        const newLog: DailyWaterLog = {
            ...todayLog,
            entries: [...todayLog.entries, entry],
            totalMl: todayLog.totalMl + amount,
        };

        setTodayLog(newLog);
        await saveLog(newLog);

        // Return true if goal was just reached
        const wasUnderGoal = todayLog.totalMl < settings.dailyGoal;
        const nowAtGoal = newLog.totalMl >= settings.dailyGoal;
        return wasUnderGoal && nowAtGoal;
    }, [todayLog, settings, saveLog]);

    const undoLast = useCallback(async () => {
        if (todayLog.entries.length === 0) return;

        const lastEntry = todayLog.entries[todayLog.entries.length - 1];
        const newLog: DailyWaterLog = {
            ...todayLog,
            entries: todayLog.entries.slice(0, -1),
            totalMl: todayLog.totalMl - lastEntry.amount,
        };

        setTodayLog(newLog);
        await saveLog(newLog);
    }, [todayLog, saveLog]);

    const updateGoal = useCallback(async (newGoal: number) => {
        await saveSettings({ ...settings, dailyGoal: newGoal });
    }, [settings, saveSettings]);

    const stats = useMemo(() => {
        const progress = settings.dailyGoal > 0
            ? Math.min(todayLog.totalMl / settings.dailyGoal, 1)
            : 0;
        const remaining = Math.max(settings.dailyGoal - todayLog.totalMl, 0);
        const glassesCount = Math.floor(todayLog.totalMl / settings.glassSize);
        const glassesGoal = Math.ceil(settings.dailyGoal / settings.glassSize);

        return {
            total: todayLog.totalMl,
            goal: settings.dailyGoal,
            progress,
            remaining,
            glassesCount,
            glassesGoal,
            isComplete: todayLog.totalMl >= settings.dailyGoal,
        };
    }, [todayLog, settings]);

    return {
        todayLog,
        settings,
        stats,
        isLoading: logQuery.isLoading || settingsQuery.isLoading,
        addWater,
        undoLast,
        updateGoal,
    };
});
