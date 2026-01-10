export type InboxItemType = 'thought' | 'idea' | 'task' | 'reminder' | 'someday';

export type InboxArea = 'personal' | 'work' | 'health' | 'learning' | 'finance' | 'social' | 'home' | 'other';

export interface InboxItem {
    id: string;
    content: string;
    note?: string;
    type: InboxItemType;
    area?: InboxArea;
    createdAt: string;
    isPinned: boolean;
    isArchived: boolean;
    archivedAt?: string;
    order?: number;
    // Migration tracking
    convertedToTaskId?: string;
    convertedToHabitId?: string;
}

export const TYPE_CONFIG: Record<InboxItemType, { icon: string; color: string; label: string }> = {
    thought: { icon: 'MessageCircle', color: '#8E8E93', label: 'Thought' },
    idea: { icon: 'Lightbulb', color: '#FFCC00', label: 'Idea' },
    task: { icon: 'CheckCircle2', color: '#34C759', label: 'Task' },
    reminder: { icon: 'Bell', color: '#FF9500', label: 'Reminder' },
    someday: { icon: 'Clock', color: '#5856D6', label: 'Someday' },
};

export const AREA_CONFIG: Record<InboxArea, { label: string; emoji: string; color: string }> = {
    personal: { label: 'Personal', emoji: '✨', color: '#AF52DE' },
    work: { label: 'Work', emoji: '💼', color: '#007AFF' },
    health: { label: 'Health', emoji: '💪', color: '#34C759' },
    learning: { label: 'Learning', emoji: '📚', color: '#FF9500' },
    finance: { label: 'Finance', emoji: '💰', color: '#30D158' },
    social: { label: 'Social', emoji: '👥', color: '#FF2D55' },
    home: { label: 'Home', emoji: '🏠', color: '#5856D6' },
    other: { label: 'Other', emoji: '📌', color: '#8E8E93' },
};
