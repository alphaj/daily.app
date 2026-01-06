export type LaterArea = 'personal' | 'work' | 'health' | 'learning' | 'finance' | 'social' | 'home' | 'other';

export interface LaterItem {
  id: string;
  title: string;
  note?: string;
  area: LaterArea;
  createdAt: string;
  archivedAt?: string;
  order?: number;
}

export const AREA_CONFIG: Record<LaterArea, { label: string; emoji: string; color: string }> = {
  personal: { label: 'Personal', emoji: '✨', color: '#AF52DE' },
  work: { label: 'Work', emoji: '💼', color: '#007AFF' },
  health: { label: 'Health', emoji: '💪', color: '#34C759' },
  learning: { label: 'Learning', emoji: '📚', color: '#FF9500' },
  finance: { label: 'Finance', emoji: '💰', color: '#30D158' },
  social: { label: 'Social', emoji: '👥', color: '#FF2D55' },
  home: { label: 'Home', emoji: '🏠', color: '#5856D6' },
  other: { label: 'Other', emoji: '📌', color: '#8E8E93' },
};
