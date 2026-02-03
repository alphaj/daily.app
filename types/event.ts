export interface CalendarEvent {
    id: string;
    title: string;
    date: string;           // YYYY-MM-DD format
    startTime?: string;     // HH:mm (optional for all-day events)
    endTime?: string;       // HH:mm
    isAllDay: boolean;
    color: string;          // hex color code
    notes?: string;
    createdAt: string;      // ISO date string
}

export const EVENT_COLORS = [
    '#FF3B30', // Red
    '#FF9500', // Orange
    '#FFCC00', // Yellow
    '#34C759', // Green
    '#007AFF', // Blue
    '#5856D6', // Purple
    '#AF52DE', // Magenta
    '#FF2D55', // Pink
    '#8E8E93', // Gray
] as const;

export type EventColor = typeof EVENT_COLORS[number];
