export type Mood = 'great' | 'good' | 'okay' | 'low' | 'rough';

export interface JournalEntry {
    id: string;
    date: string;           // YYYY-MM-DD format
    audioUri?: string;      // Local path to audio file
    transcript: string;     // Transcribed text from voice recording
    duration: number;       // Recording duration in seconds
    mood?: Mood;
    createdAt: string;      // ISO timestamp
    updatedAt: string;      // ISO timestamp
}
