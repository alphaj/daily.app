export interface Supplement {
    id: string;
    name: string;
    /** Emoji for visual identification (💊, 🩹, 🧴, etc.) */
    emoji?: string;
    /** Dosage info like "500mg" or "2 capsules" */
    dosage?: string;
    /** How often to take */
    frequency: 'daily' | 'twice_daily' | 'weekly' | 'as_needed';
    /** Preferred time to take */
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'with_food';
    /** Additional notes like "Take with food" */
    notes?: string;
    createdAt: string;
    /** Array of ISO date strings when taken */
    takenDates: string[];
    /** Consecutive days taken */
    currentStreak: number;
    /** Best streak achieved */
    bestStreak: number;
    /** Whether actively tracking (pause without deleting) */
    isActive: boolean;
    /** Notification IDs for scheduled reminders */
    notificationIds?: string[];
}

export interface SupplementStats {
    totalTaken: number;
    weeklyCompletionRate: number;
    currentWeekTaken: number;
    longestStreak: number;
}
