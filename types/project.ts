export interface ProjectTask {
  id: string;
  title: string;
  completed: boolean;
  order: number;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  type: 'project' | 'goal';
  deadline?: string;
  tasks: ProjectTask[];
  createdAt: string;
  completedAt?: string;
}

export const PROJECT_COLORS = [
  '#FF6B6B', // Coral red
  '#4ECDC4', // Teal
  '#45B7D1', // Sky blue
  '#96CEB4', // Sage green
  '#FFEAA7', // Soft yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Gold
  '#BB8FCE', // Lavender
  '#85C1E9', // Light blue
  '#FFBE98', // Peach
  '#F8B4D9', // Rose pink
  '#A8B5E0', // Periwinkle
  '#E8A0B5', // Dusty rose
  '#7FDBDA', // Turquoise
  '#C9A0DC', // Wisteria
  '#FFD180', // Light orange
  '#A5D6A7', // Light green
  '#90CAF9', // Soft blue
  '#FFAB91', // Salmon
  '#CE93D8', // Orchid
] as const;

export const PROJECT_ICONS = [
  '🚀', '🎯', '💡', '📚', '🏆', '🎨', '💪', '🌟', '🔥', '⚡',
  '🎬', '📱', '💻', '🏠', '✈️', '🎵', '📷', '🛠️', '🌱', '💎',
  '🎁', '🧠', '❤️', '🌈',
] as const;
