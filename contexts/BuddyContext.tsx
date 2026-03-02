import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface BuddyStatus {
  partnership_id: string | null;
  status: 'none' | 'pending' | 'active' | 'dissolved' | 'declined';
  partner_name: string | null;
  partner_id: string | null;
  partner_avatar_url: string | null;
  is_inviter: boolean;
  created_at: string | null;
}

export interface SharingPreferences {
  share_todos: boolean;

  share_focus: boolean;
  share_inbox: boolean;
  share_notes: boolean;
  share_work_items: boolean;

}

interface BuddyContextType {
  /** All active + pending partnerships */
  partnerships: BuddyStatus[];
  /** Sharing prefs keyed by partnership_id */
  sharingPrefsMap: Record<string, SharingPreferences>;
  /** Only active partnerships */
  activeBuddies: BuddyStatus[];
  /** Only pending partnerships */
  pendingBuddies: BuddyStatus[];
  /** Whether any partnership is active */
  hasActiveBuddy: boolean;
  isLoading: boolean;
  getBuddy: (partnerId: string) => BuddyStatus | undefined;
  requestBuddy: (code: string) => Promise<{ error: string | null; partnerName: string | null }>;
  respondToBuddy: (partnershipId: string, accept: boolean) => Promise<{ error: string | null }>;
  dissolveBuddy: (partnershipId: string) => Promise<{ error: string | null }>;
  nudgePendingRequest: (partnershipId: string) => Promise<{ error: string | null }>;
  updateSharingPrefs: (partnershipId: string, prefs: Partial<SharingPreferences>) => Promise<{ error: string | null }>;
  refresh: () => Promise<void>;
}

const BuddyContext = createContext<BuddyContextType | undefined>(undefined);

export function BuddyProvider({ children }: { children: ReactNode }) {
  const { session, profile } = useAuth();
  const [partnerships, setPartnerships] = useState<BuddyStatus[]>([]);
  const [sharingPrefsMap, setSharingPrefsMap] = useState<Record<string, SharingPreferences>>({});
  const [isLoading, setIsLoading] = useState(true);

  const activeBuddies = useMemo(
    () => partnerships.filter((p) => p.status === 'active'),
    [partnerships],
  );

  const pendingBuddies = useMemo(
    () => partnerships.filter((p) => p.status === 'pending'),
    [partnerships],
  );

  const hasActiveBuddy = activeBuddies.length > 0;

  const getBuddy = useCallback(
    (partnerId: string) => partnerships.find((p) => p.partner_id === partnerId),
    [partnerships],
  );

  const fetchStatus = useCallback(async () => {
    if (!session) {
      setPartnerships([]);
      setSharingPrefsMap({});
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('get_all_partnerships');

      if (error) {
        console.error('[partnership] Failed to fetch status:', error.message);
        setIsLoading(false);
        return;
      }

      const result = (data ?? []) as BuddyStatus[];
      setPartnerships(result);

      // Fetch sharing preferences for all active partnerships
      const activeOnes = result.filter((p) => p.status === 'active' && p.partnership_id);
      if (activeOnes.length > 0) {
        const partnershipIds = activeOnes.map((p) => p.partnership_id!);
        const { data: prefs } = await supabase
          .from('sharing_preferences')
          .select('*')
          .eq('user_id', session.user.id)
          .in('partnership_id', partnershipIds);

        if (prefs) {
          const map: Record<string, SharingPreferences> = {};
          for (const row of prefs) {
            map[row.partnership_id] = {
              share_todos: row.share_todos,

              share_focus: row.share_focus,
              share_inbox: row.share_inbox,
              share_notes: row.share_notes,
              share_work_items: row.share_work_items,


            };
          }
          setSharingPrefsMap(map);
        }
      } else {
        setSharingPrefsMap({});
      }
    } catch (err) {
      console.error('[partnership] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  // Fetch on mount and when session changes
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Subscribe to realtime partnership changes
  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel('buddy-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'partnerships',
        },
        (payload) => {
          // On DELETE, payload.new is empty — use payload.old instead
          const row = (payload.eventType === 'DELETE' ? payload.old : payload.new) as any;
          // Only care about partnerships involving us
          if (row?.inviter_id === session.user.id || row?.invitee_id === session.user.id) {
            fetchStatus();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, fetchStatus]);

  const requestBuddy = async (code: string): Promise<{ error: string | null; partnerName: string | null }> => {
    try {
      const { data, error } = await supabase.rpc('request_partnership', {
        partner_code_input: code.toUpperCase(),
      });

      if (error) {
        return { error: error.message, partnerName: null };
      }

      const result = data as any;
      if (result.error) {
        return { error: result.error, partnerName: null };
      }

      await fetchStatus();

      // Send push notification to the invitee
      if (result.partnership_id) {
        const { data: partnershipRow } = await supabase
          .from('partnerships')
          .select('invitee_id')
          .eq('id', result.partnership_id)
          .single();

        if (partnershipRow?.invitee_id) {
          supabase.functions.invoke('send-push-notification', {
            body: {
              recipient_id: partnershipRow.invitee_id,
              title: 'Partner Request',
              body: `${profile?.name ?? 'Someone'} wants to partner with you on Daily!`,
            },
          }).catch(() => {});
        }
      }

      return { error: null, partnerName: result.partner_name };
    } catch (err: any) {
      return { error: err.message ?? 'An unexpected error occurred', partnerName: null };
    }
  };

  const respondToBuddy = async (partnershipId: string, accept: boolean): Promise<{ error: string | null }> => {
    try {
      const { data, error } = await supabase.rpc('respond_to_partnership', {
        partnership_id_input: partnershipId,
        accept,
      });

      if (error) {
        return { error: error.message };
      }

      const result = data as any;
      if (result.error) {
        return { error: result.error };
      }

      await fetchStatus();
      return { error: null };
    } catch (err: any) {
      return { error: err.message ?? 'An unexpected error occurred' };
    }
  };

  const dissolveBuddy = async (partnershipId: string): Promise<{ error: string | null }> => {
    try {
      const { data, error } = await supabase.rpc('dissolve_partnership', {
        partnership_id_input: partnershipId,
      });

      if (error) {
        return { error: error.message };
      }

      const result = data as any;
      if (result.error) {
        return { error: result.error };
      }

      await fetchStatus();
      return { error: null };
    } catch (err: any) {
      return { error: err.message ?? 'An unexpected error occurred' };
    }
  };

  const nudgePendingRequest = async (partnershipId: string): Promise<{ error: string | null }> => {
    try {
      const key = `nudge_last_${partnershipId}`;
      const lastNudge = await AsyncStorage.getItem(key);
      if (lastNudge && Date.now() - parseInt(lastNudge, 10) < 24 * 60 * 60 * 1000) {
        return { error: 'already_nudged' };
      }

      const { data: row } = await supabase
        .from('partnerships')
        .select('invitee_id')
        .eq('id', partnershipId)
        .single();

      if (!row?.invitee_id) {
        return { error: 'Partnership not found' };
      }

      await supabase.functions.invoke('send-push-notification', {
        body: {
          recipient_id: row.invitee_id,
          title: 'Reminder',
          body: `${profile?.name ?? 'Someone'} is waiting for your response on Daily!`,
        },
      });

      await AsyncStorage.setItem(key, Date.now().toString());
      return { error: null };
    } catch (err: any) {
      return { error: err.message ?? 'Failed to send nudge' };
    }
  };

  const updateSharingPrefs = async (partnershipId: string, prefs: Partial<SharingPreferences>): Promise<{ error: string | null }> => {
    if (!session) {
      return { error: 'No session' };
    }

    try {
      const { error } = await supabase
        .from('sharing_preferences')
        .update({ ...prefs, updated_at: new Date().toISOString() })
        .eq('user_id', session.user.id)
        .eq('partnership_id', partnershipId);

      if (error) {
        return { error: error.message };
      }

      setSharingPrefsMap((prev) => ({
        ...prev,
        [partnershipId]: { ...prev[partnershipId], ...prefs } as SharingPreferences,
      }));
      return { error: null };
    } catch (err: any) {
      return { error: err.message ?? 'An unexpected error occurred' };
    }
  };

  return (
    <BuddyContext.Provider
      value={{
        partnerships,
        sharingPrefsMap,
        activeBuddies,
        pendingBuddies,
        hasActiveBuddy,
        isLoading,
        getBuddy,
        requestBuddy,
        respondToBuddy,
        dissolveBuddy,
        nudgePendingRequest,
        updateSharingPrefs,
        refresh: fetchStatus,
      }}
    >
      {children}
    </BuddyContext.Provider>
  );
}

export function useBuddy() {
  const context = useContext(BuddyContext);
  if (context === undefined) {
    throw new Error('useBuddy must be used within a BuddyProvider');
  }
  return context;
}
