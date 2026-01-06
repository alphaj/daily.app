export type DumpItemType = 'thought' | 'idea' | 'link' | 'reminder' | 'task';

export interface BrainDumpItem {
    id: string;
    content: string;
    type: DumpItemType;
    createdAt: string;
    isPinned: boolean;
    isArchived: boolean;
    convertedToTaskId?: string;
    convertedToHabitId?: string;
}
