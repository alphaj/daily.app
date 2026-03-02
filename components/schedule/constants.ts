import type { TimeOfDay } from '@/types/todo';

export const HOUR_HEIGHT = 80;
export const START_HOUR = 6;
export const END_HOUR = 23; // 11 PM
export const TOTAL_HOURS = END_HOUR - START_HOUR; // 17
export const GRID_HEIGHT = TOTAL_HOURS * HOUR_HEIGHT; // 1360

export const SNAP_MINUTES = 15;
export const SNAP_HEIGHT = HOUR_HEIGHT / (60 / SNAP_MINUTES); // 20px

export const LEFT_GUTTER = 56;
export const DEFAULT_DURATION = 30; // minutes

export const TIME_OF_DAY_DEFAULTS: Record<TimeOfDay, string> = {
  morning: '09:00',
  afternoon: '13:00',
  evening: '18:00',
  anytime: '09:00',
};

export const BLOCK_ACCENT_COLORS: Record<TimeOfDay, string> = {
  morning: '#FFCC00',
  afternoon: '#FF9500',
  evening: '#5856D6',
  anytime: '#8E8E93',
};

export const BLOCK_BG_COLORS: Record<TimeOfDay, string> = {
  morning: 'rgba(255,204,0,0.10)',
  afternoon: 'rgba(255,149,0,0.10)',
  evening: 'rgba(88,86,214,0.10)',
  anytime: 'rgba(120,120,128,0.06)',
};
