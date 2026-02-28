import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { fetchBuddyLastActive } from '@/lib/sync';
import { useAuth } from '@/contexts/AuthContext';

interface BuddyPresence {
  isOnline: boolean;
  lastActiveText: string | null;
}

const POLL_INTERVAL_MS = 60_000; // 1 minute

export function useBuddyPresence(partnerId: string | null, partnershipId: string | null): BuddyPresence {
  const { session, privacyMode } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [lastActiveText, setLastActiveText] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const userId = session?.user?.id;
  const isActive = !!partnerId && !!partnershipId;

  // ── Last-active polling ──────────────────────────────────────────
  const fetchLastActive = useCallback(async () => {
    if (!partnerId) return;

    const ts = await fetchBuddyLastActive(partnerId);
    if (ts) {
      setLastActiveText(formatDistanceToNow(new Date(ts), { addSuffix: true }));
    } else {
      setLastActiveText(null);
    }
  }, [partnerId]);

  // ── Presence channel ─────────────────────────────────────────────
  useEffect(() => {
    if (!partnershipId || !userId || !isActive) return;

    const channel = supabase.channel(`presence:${partnershipId}`, {
      config: { presence: { key: userId } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        // Check if partner's user_id exists in presence state
        const partnerPresent = partnerId ? !!state[partnerId] : false;
        setIsOnline(partnerPresent);
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        if (key === partnerId) {
          setIsOnline(false);
          // Re-fetch last active immediately when partner goes offline
          fetchLastActive();
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Only track if not in private/focus mode
          if (privacyMode === 'open') {
            await channel.track({ user_id: userId });
          }
        }
      });

    channelRef.current = channel;

    // AppState listener: track/untrack based on foreground state & privacy
    const handleAppState = async (state: AppStateStatus) => {
      if (!channelRef.current) return;

      if (state === 'active' && privacyMode === 'open') {
        await channelRef.current.track({ user_id: userId });
      } else if (state !== 'active') {
        await channelRef.current.untrack();
      }
    };

    const appStateSub = AppState.addEventListener('change', handleAppState);

    return () => {
      appStateSub.remove();
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [partnershipId, userId, partnerId, isActive, privacyMode, fetchLastActive]);

  // ── Privacy mode changes: untrack if entering private/focus ──────
  useEffect(() => {
    if (!channelRef.current || !userId) return;

    if (privacyMode !== 'open') {
      channelRef.current.untrack();
    } else if (AppState.currentState === 'active') {
      channelRef.current.track({ user_id: userId });
    }
  }, [privacyMode, userId]);

  // ── Polling interval for last-active ─────────────────────────────
  useEffect(() => {
    if (!partnerId || !isActive) return;

    // Initial fetch
    fetchLastActive();

    pollRef.current = setInterval(fetchLastActive, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [partnerId, isActive, fetchLastActive]);

  return { isOnline, lastActiveText };
}
