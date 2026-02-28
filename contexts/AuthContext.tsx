import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { registerPushToken } from '@/lib/notifications';
import { uploadAvatar as uploadAvatarLib, deleteAvatar as deleteAvatarLib, pickAvatar } from '@/lib/avatar';
import type { Session, User } from '@supabase/supabase-js';

export type PrivacyMode = 'open' | 'focus' | 'private';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  partner_code: string;
  onboarded_at: string;
  privacy_mode: PrivacyMode;
  avatar_url: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null; partnerCode: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  regeneratePartnerCode: () => Promise<{ error: string | null; partnerCode: string | null }>;
  privacyMode: PrivacyMode;
  setPrivacyMode: (mode: PrivacyMode) => Promise<{ error: string | null }>;
  uploadAvatar: (source: 'camera' | 'gallery') => Promise<{ error: string | null }>;
  removeAvatar: () => Promise<{ error: string | null }>;
  updateName: (name: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    }).catch(() => {
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // Profile might not exist yet (mid-signup)
        console.log('[auth] No profile yet:', error.message);
        setProfile(null);
      } else {
        setProfile(data as UserProfile);
        registerPushToken().catch(() => {});
      }
    } catch (err) {
      console.error('[auth] Failed to fetch profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
  ): Promise<{ error: string | null; partnerCode: string | null }> => {
    try {
      // 1. Create auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        return { error: authError.message, partnerCode: null };
      }

      if (!authData.user) {
        return { error: 'Signup failed — no user returned', partnerCode: null };
      }

      // 2. Create user profile with partner code
      const { data: profileData, error: profileError } = await supabase
        .rpc('create_user_profile', { user_name: name });

      if (profileError) {
        return { error: profileError.message, partnerCode: null };
      }

      const partnerCode = profileData?.[0]?.partner_code ?? null;

      // 3. Fetch full profile
      await fetchProfile(authData.user.id);

      return { error: null, partnerCode };
    } catch (err: any) {
      return { error: err.message ?? 'An unexpected error occurred', partnerCode: null };
    }
  };

  const signIn = async (
    email: string,
    password: string,
  ): Promise<{ error: string | null }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      // Set session immediately so navigation guards see it
      // before login.tsx calls router.replace('/')
      if (data.session) {
        setSession(data.session);
        await fetchProfile(data.session.user.id);
      }

      return { error: null };
    } catch (err: any) {
      return { error: err.message ?? 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (session?.user) {
      await fetchProfile(session.user.id);
    }
  };

  const setPrivacyMode = async (mode: PrivacyMode): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.rpc('set_privacy_mode', { mode });
      if (error) return { error: error.message };
      // Update local profile immediately
      setProfile(prev => prev ? { ...prev, privacy_mode: mode } : prev);
      return { error: null };
    } catch (err: any) {
      return { error: err.message ?? 'An unexpected error occurred' };
    }
  };

  const uploadAvatar = async (source: 'camera' | 'gallery'): Promise<{ error: string | null }> => {
    try {
      const uri = await pickAvatar(source);
      if (!uri) return { error: null }; // User cancelled

      const userId = session?.user?.id;
      if (!userId) return { error: 'Not signed in' };

      const publicUrl = await uploadAvatarLib(userId, uri);
      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : prev);
      return { error: null };
    } catch (err: any) {
      return { error: err.message ?? 'Failed to upload avatar' };
    }
  };

  const removeAvatar = async (): Promise<{ error: string | null }> => {
    try {
      const userId = session?.user?.id;
      if (!userId) return { error: 'Not signed in' };

      await deleteAvatarLib(userId);
      setProfile(prev => prev ? { ...prev, avatar_url: null } : prev);
      return { error: null };
    } catch (err: any) {
      return { error: err.message ?? 'Failed to remove avatar' };
    }
  };

  const updateName = async (name: string): Promise<{ error: string | null }> => {
    try {
      const userId = session?.user?.id;
      if (!userId) return { error: 'Not signed in' };

      const trimmed = name.trim();
      if (!trimmed) return { error: 'Name cannot be empty' };

      const { error } = await supabase
        .from('users')
        .update({ name: trimmed })
        .eq('id', userId);

      if (error) return { error: error.message };

      setProfile(prev => prev ? { ...prev, name: trimmed } : prev);
      return { error: null };
    } catch (err: any) {
      return { error: err.message ?? 'Failed to update name' };
    }
  };

  const regeneratePartnerCode = async (): Promise<{ error: string | null; partnerCode: string | null }> => {
    try {
      const { data, error } = await supabase.rpc('regenerate_partner_code');

      if (error) {
        return { error: error.message, partnerCode: null };
      }

      const newCode = data?.[0]?.partner_code ?? null;
      await refreshProfile();
      return { error: null, partnerCode: newCode };
    } catch (err: any) {
      return { error: err.message ?? 'An unexpected error occurred', partnerCode: null };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        isLoading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
        regeneratePartnerCode,
        privacyMode: profile?.privacy_mode ?? 'open',
        setPrivacyMode,
        uploadAvatar,
        removeAvatar,
        updateName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
