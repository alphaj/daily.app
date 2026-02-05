export interface WaterEntry {
    id: string;
    amount: number; // in ml
    type: 'glass' | 'bottle' | 'custom';
    timestamp: string; // ISO string
}

export interface WaterSettings {
    dailyGoal: number; // in ml (default: 2000ml / 8 glasses)
    glassSize: number; // default: 250ml
    bottleSize: number; // default: 500ml
}

export interface DailyWaterLog {
    date: string; // YYYY-MM-DD
    entries: WaterEntry[];
    totalMl: number;
}
