import { Platform } from 'react-native';
import type { HealthData, HealthWeekday } from '@/types/health';

// Only import HealthKit on iOS — it's a no-op elsewhere
let Healthkit: typeof import('@kingstinct/react-native-healthkit') | null = null;
if (Platform.OS === 'ios') {
    Healthkit = require('@kingstinct/react-native-healthkit');
}

/** Check whether HealthKit is available on this device (iOS only). */
export function isHealthKitAvailable(): boolean {
    return Platform.OS === 'ios' && Healthkit !== null;
}

/**
 * Request read access for the health data types we care about.
 * Returns true if authorization was granted (or had already been granted).
 */
export async function requestHealthPermissions(): Promise<boolean> {
    if (!Healthkit) return false;

    const {
        HKQuantityTypeIdentifier,
        HKCategoryTypeIdentifier,
        default: RNHealthkit,
    } = Healthkit;

    try {
        await RNHealthkit.requestAuthorization(
            [
                HKQuantityTypeIdentifier.stepCount,
                HKQuantityTypeIdentifier.distanceWalkingRunning,
                HKQuantityTypeIdentifier.activeEnergyBurned,
                HKQuantityTypeIdentifier.restingHeartRate,
                HKCategoryTypeIdentifier.sleepAnalysis,
            ],
        );
        return true;
    } catch {
        return false;
    }
}

/** Fetch today's aggregated health data. */
export async function fetchTodayHealthData(): Promise<HealthData> {
    const empty: HealthData = {
        steps: 0,
        distance: 0,
        activeEnergy: 0,
        restingHeartRate: null,
        sleepHours: null,
    };

    if (!Healthkit) return empty;

    const {
        HKQuantityTypeIdentifier,
        HKCategoryTypeIdentifier,
        HKStatisticsOptions,
        default: RNHealthkit,
    } = Healthkit;

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    try {
        const [steps, distance, energy] = await Promise.all([
            RNHealthkit.queryStatisticsForQuantity(
                HKQuantityTypeIdentifier.stepCount,
                [HKStatisticsOptions.cumulativeSum],
                startOfDay,
                now,
            ).then(r => r?.sumQuantity?.doubleValue ?? 0),
            RNHealthkit.queryStatisticsForQuantity(
                HKQuantityTypeIdentifier.distanceWalkingRunning,
                [HKStatisticsOptions.cumulativeSum],
                startOfDay,
                now,
            ).then(r => r?.sumQuantity?.doubleValue ?? 0),
            RNHealthkit.queryStatisticsForQuantity(
                HKQuantityTypeIdentifier.activeEnergyBurned,
                [HKStatisticsOptions.cumulativeSum],
                startOfDay,
                now,
            ).then(r => r?.sumQuantity?.doubleValue ?? 0),
        ]);

        // Resting heart rate — grab most recent sample
        let restingHeartRate: number | null = null;
        try {
            const hrSamples = await RNHealthkit.queryQuantitySamples(
                HKQuantityTypeIdentifier.restingHeartRate,
                { from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), to: now, limit: 1 },
            );
            if (hrSamples.length > 0) {
                restingHeartRate = Math.round(hrSamples[0].quantity);
            }
        } catch {
            // Heart rate data may not be available
        }

        // Sleep — look at last night's sleep samples
        let sleepHours: number | null = null;
        try {
            const sleepStart = new Date(startOfDay);
            sleepStart.setDate(sleepStart.getDate() - 1);
            sleepStart.setHours(18, 0, 0, 0); // 6pm yesterday

            const sleepSamples = await RNHealthkit.queryCategorySamples(
                HKCategoryTypeIdentifier.sleepAnalysis,
                { from: sleepStart, to: startOfDay },
            );

            if (sleepSamples.length > 0) {
                // Sum "asleep" sample durations (value > 0 means in-bed or asleep depending on source)
                let totalSleepMs = 0;
                for (const sample of sleepSamples) {
                    if (sample.value > 0) {
                        const sampleStart = new Date(sample.startDate).getTime();
                        const sampleEnd = new Date(sample.endDate).getTime();
                        totalSleepMs += sampleEnd - sampleStart;
                    }
                }
                if (totalSleepMs > 0) {
                    sleepHours = Math.round((totalSleepMs / (1000 * 60 * 60)) * 10) / 10;
                }
            }
        } catch {
            // Sleep data may not be available
        }

        return {
            steps: Math.round(steps),
            distance: Math.round(distance),
            activeEnergy: Math.round(energy),
            restingHeartRate,
            sleepHours,
        };
    } catch {
        return empty;
    }
}

/** Fetch step counts for each of the last 7 days. */
export async function fetchWeeklySteps(): Promise<HealthWeekday[]> {
    const result: HealthWeekday[] = [];

    if (!Healthkit) return result;

    const {
        HKQuantityTypeIdentifier,
        HKStatisticsOptions,
        default: RNHealthkit,
    } = Healthkit;

    const now = new Date();

    for (let i = 6; i >= 0; i--) {
        const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);

        const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;

        try {
            const stats = await RNHealthkit.queryStatisticsForQuantity(
                HKQuantityTypeIdentifier.stepCount,
                [HKStatisticsOptions.cumulativeSum],
                day,
                dayEnd,
            );
            result.push({ date: dateStr, steps: Math.round(stats?.sumQuantity?.doubleValue ?? 0) });
        } catch {
            result.push({ date: dateStr, steps: 0 });
        }
    }

    return result;
}
