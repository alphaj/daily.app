export interface HealthData {
    /** Steps taken today */
    steps: number;
    /** Distance walked/run today in meters */
    distance: number;
    /** Active energy burned today in kilocalories */
    activeEnergy: number;
    /** Resting heart rate in BPM (most recent) */
    restingHeartRate: number | null;
    /** Most recent sleep duration in hours (last night) */
    sleepHours: number | null;
}

export interface HealthWeekday {
    /** Date string YYYY-MM-DD */
    date: string;
    /** Steps for this day */
    steps: number;
}

export interface HealthPermissionStatus {
    /** Whether the user has been asked for permissions */
    hasPrompted: boolean;
    /** Whether we have at least some read access */
    isAuthorized: boolean;
}
