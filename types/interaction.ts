export type InteractionType = 'reaction' | 'nudge';

export type ReactionEmoji = '🔥' | '👏' | '❤️' | '⭐';

export interface BuddyInteraction {
  id: string;
  partnership_id: string;
  sender_id: string;
  receiver_id: string;
  type: InteractionType;
  emoji: string;
  message: string | null;
  target_todo_id: string | null;
  target_todo_user_id: string | null;
  status: 'pending' | 'delivered' | 'read';
  created_at: string;
  delivered_at: string | null;
  read_at: string | null;
}

export const REACTION_EMOJIS: { emoji: ReactionEmoji; label: string }[] = [
  { emoji: '🔥', label: 'Fire' },
  { emoji: '👏', label: 'Clap' },
  { emoji: '❤️', label: 'Heart' },
  { emoji: '⭐', label: 'Star' },
];

export const NUDGE_TEMPLATES: { emoji: string; message: string }[] = [
  { emoji: '💭', message: 'Thinking of you' },
  { emoji: '💪', message: 'You got this!' },
  { emoji: '🥰', message: 'So proud of you' },
];
