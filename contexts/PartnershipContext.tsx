import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface PartnershipStatus {
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
  share_events: boolean;
  share_focus: boolean;
  share_inbox: boolean;
  share_notes: boolean;
  share_work_items: boolean;
  share_later: boolean;
}

interface PartnershipContextType {
  /** All active + pending partnerships */
  partnerships: PartnershipStatus[];
  /** Sharing prefs keyed by partnership_id */
  sharingPrefsMap: Record<string, SharingPreferences>;
  /** Only active partnerships */
  activePartners: PartnershipStatus[];
  /** Only pending partnerships */
  pendingPartners: PartnershipStatus[];
  /** Whether any partnership is active */
  hasActivePartnership: boolean;
  isLoading: boolean;
  getPartnership: (partnerId: string) => PartnershipStatus | undefined;
  requestPartnership: (code: string) => Promise<{ error: string | null; partnerName: string | null }>;
  respondToPartnership: (partnershipId: string, accept: boolean) => Promise<{ error: string | null }>;
  dissolvePartnership: (partnershipId: string) => Promise<{ error: string | null }>;
  updateSharingPrefs: (partnershipId: string, prefs: Partial<SharingPreferences>) => Promise<{ error: string | null }>;
  refresh: () => Promise<void>;
}

const PartnershipContext = createContext<PartnershipContextType | undefined>(undefined);

export function PartnershipProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [partnerships, setPartnerships] = useState<PartnershipStatus[]>([]);
  const [sharingPrefsMap, setSharingPrefsMap] = useState<Record<string, SharingPreferences>>({});
  const [isLoading, setIsLoading] = useState(true);

  const activePartners = useMemo(
    () => partnerships.filter((p) => p.status === 'active'),
    [partnerships],
  );

  const pendingPartners = useMemo(
    () => partnerships.filter((p) => p.status === 'pending'),
    [partnerships],
  );

  const hasActivePartnership = activePartners.length > 0;

  const getPartnership = useCallback(
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

      const result = (data ?? []) as PartnershipStatus[];
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
              share_events: row.share_events,
              share_focus: row.share_focus,
              share_inbox: row.share_inbox,
              share_notes: row.share_notes,
              share_work_items: row.share_work_items,
              share_later: row.share_later,
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
      .channel('partnership-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'partnerships',
        },
        (payload) => {
          const row = payload.new as any;
          // Only care about partnerships involving us
          if (row.inviter_id === session.user.id || row.invitee_id === session.user.id) {
            fetchStatus();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, fetchStatus]);

  const requestPartnership = async (code: string): Promise<{ error: string | null; partnerName: string | null }> => {
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
      return { error: null, partnerName: result.partner_name };
    } catch (err: any) {
      return { error: err.message ?? 'An unexpected error occurred', partnerName: null };
    }
  };

  const respondToPartnership = async (partnershipId: string, accept: boolean): Promise<{ error: string | null }> => {
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

  const dissolvePartnership = async (partnershipId: string): Promise<{ error: string | null }> => {
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
    <PartnershipContext.Provider
      value={{
        partnerships,
        sharingPrefsMap,
        activePartners,
        pendingPartners,
        hasActivePartnership,
        isLoading,
        getPartnership,
        requestPartnership,
        respondToPartnership,
        dissolvePartnership,
        updateSharingPrefs,
        refresh: fetchStatus,
      }}
    >
      {children}
    </PartnershipContext.Provider>
  );
}

export function usePartnership() {
  const context = useContext(PartnershipContext);
  if (context === undefined) {
    throw new Error('usePartnership must be used within a PartnershipProvider');
  }
  return context;
}
