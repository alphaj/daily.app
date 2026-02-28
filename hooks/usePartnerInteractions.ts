import { useEffect, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { usePartnership } from '@/contexts/PartnershipContext';
import {
  sendReaction as syncSendReaction,
  sendNudge as syncSendNudge,
  pullInteractions,
  pullReactionsOnMyTasks,
  markInteractionsRead,
} from '@/lib/sync';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/lib/toast';
import type { PartnerInteraction } from '@/types/interaction';

function sendPushNotification(recipientId: string, title: string, body: string) {
  supabase.functions.invoke('send-push-notification', {
    body: { recipient_id: recipientId, title, body },
  }).catch((err) => {
    console.log('[interactions] Push notification failed (non-blocking):', err);
  });
}

export function usePartnerInteractions(partnerId?: string | null) {
  const { session, profile } = useAuth();
  const { hasActivePartnership, getPartnership } = usePartnership();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;
  const isActive = !!userId && hasActivePartnership;

  // When scoped to a specific partner, use scoped query keys
  const scopeKey = partnerId ?? 'all';

  // Unread interactions sent TO me (optionally filtered by partner)
  const { data: interactions = [] } = useQuery<PartnerInteraction[]>({
    queryKey: ['partner-interactions', scopeKey],
    queryFn: async () => {
      const all = await pullInteractions(userId!);
      if (partnerId) {
        return all.filter((i) => i.sender_id === partnerId);
      }
      return all;
    },
    enabled: isActive,
    staleTime: 30_000,
  });

  // Reactions on MY completed tasks (from partner)
  const { data: myTaskReactions = [] } = useQuery<PartnerInteraction[]>({
    queryKey: ['my-task-reactions', scopeKey],
    queryFn: async () => {
      const all = await pullReactionsOnMyTasks(userId!);
      if (partnerId) {
        return all.filter((i) => i.sender_id === partnerId);
      }
      return all;
    },
    enabled: isActive,
    staleTime: 30_000,
  });

  // Reactions I've sent on partner's tasks
  const { data: sentReactionsRaw = [] } = useQuery<PartnerInteraction[]>({
    queryKey: ['sent-reactions', scopeKey],
    queryFn: async () => {
      if (!userId) return [];
      let query = supabase
        .from('partner_interactions')
        .select('*')
        .eq('sender_id', userId)
        .eq('type', 'reaction')
        .order('created_at', { ascending: false });
      if (partnerId) {
        query = query.eq('receiver_id', partnerId);
      }
      const { data, error } = await query;
      if (error) return [];
      return (data ?? []) as PartnerInteraction[];
    },
    enabled: isActive,
    staleTime: 30_000,
  });

  // Map: todoId → emoji (reactions on my tasks)
  const reactionsOnMyTasks = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of myTaskReactions) {
      if (r.target_todo_id && !map.has(r.target_todo_id)) {
        map.set(r.target_todo_id, r.emoji);
      }
    }
    return map;
  }, [myTaskReactions]);

  // Map: todoId → emoji (reactions I've sent)
  const sentReactions = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of sentReactionsRaw) {
      if (r.target_todo_id && !map.has(r.target_todo_id)) {
        map.set(r.target_todo_id, r.emoji);
      }
    }
    return map;
  }, [sentReactionsRaw]);

  const nudges = useMemo(
    () => interactions.filter((i) => i.type === 'nudge'),
    [interactions],
  );

  const unreadCount = interactions.length;

  // Realtime: listen for new interactions sent to me
  useEffect(() => {
    if (!userId || !isActive) return;

    const channel = supabase
      .channel(`partner-interactions-realtime-${scopeKey}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'partner_interactions',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as PartnerInteraction;

          // If scoped to a partner, only show toast for that partner
          if (partnerId && row.sender_id !== partnerId) return;

          const partner = getPartnership(row.sender_id);
          const partnerName = partner?.partner_name ?? 'Partner';

          if (row.type === 'reaction') {
            showToast({
              emoji: row.emoji,
              title: partnerName,
              message: 'reacted to your task',
            });
          } else if (row.type === 'nudge') {
            showToast({
              emoji: row.emoji,
              title: partnerName,
              message: row.message ?? '',
            });
          }

          queryClient.invalidateQueries({ queryKey: ['partner-interactions'] });
          queryClient.invalidateQueries({ queryKey: ['my-task-reactions'] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, isActive, partnerId, scopeKey, getPartnership, queryClient]);

  // Mutations
  const senderName = profile?.name ?? 'Your partner';

  const sendReactionMutation = useMutation({
    mutationFn: ({ todoId, emoji }: { todoId: string; emoji: string }) =>
      syncSendReaction(todoId, emoji, partnerId ?? undefined),
    onSuccess: (_result, { emoji }) => {
      queryClient.invalidateQueries({ queryKey: ['sent-reactions'] });
      if (partnerId) {
        sendPushNotification(partnerId, `${emoji} ${senderName}`, 'reacted to your task');
      }
    },
  });

  const sendNudgeMutation = useMutation({
    mutationFn: ({ emoji, message }: { emoji: string; message: string }) =>
      syncSendNudge(emoji, message, partnerId ?? undefined),
    onSuccess: (result, { emoji, message }) => {
      if (result.error) {
        showToast({ emoji: '⚠️', title: 'Nudge failed', message: result.error });
      } else {
        showToast({ emoji, title: 'Sent!', message: 'Nudge delivered' });
        if (partnerId) {
          sendPushNotification(partnerId, `${emoji} ${senderName}`, message);
        }
      }
    },
    onError: () => {
      showToast({ emoji: '⚠️', title: 'Nudge failed', message: 'Check your connection' });
    },
  });

  const sendReaction = useCallback(
    (todoId: string, emoji: string) => sendReactionMutation.mutate({ todoId, emoji }),
    [sendReactionMutation],
  );

  const sendNudge = useCallback(
    (emoji: string, message: string) => sendNudgeMutation.mutate({ emoji, message }),
    [sendNudgeMutation],
  );

  const markAllRead = useCallback(async () => {
    const ids = interactions.map((i) => i.id);
    if (ids.length === 0) return;
    await markInteractionsRead(ids);
    queryClient.invalidateQueries({ queryKey: ['partner-interactions'] });
  }, [interactions, queryClient]);

  return {
    sendReaction,
    sendNudge,
    unreadCount,
    reactionsOnMyTasks,
    sentReactions,
    nudges,
    markAllRead,
  };
}
