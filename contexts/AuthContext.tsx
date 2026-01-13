import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { User, AuthState, LoginCredentials, SignupCredentials } from '@/types/auth';
import { trpcClient } from '@/lib/trpc';

const TOKEN_KEY = 'daily_auth_token';
const USER_KEY = 'daily_auth_user';

const ALL_STORAGE_KEYS = [
  'daily_habits',
  'daily_todos',
  'daily_notes',
  'daily_projects',
  'inbox_items',
  'brain_dump_items',
  'later_items',
  '@daily_onboarding',
  'inbox_migration_done',
];

interface AuthContextType extends AuthState {
  signup: (credentials: SignupCredentials) => Promise<{ success: boolean; error?: string }>;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function getSecureItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function setSecureItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function deleteSecureItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const clearAuth = useCallback(async () => {
    await Promise.all([
      deleteSecureItem(TOKEN_KEY),
      deleteSecureItem(USER_KEY),
    ]);
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const loadStoredAuth = useCallback(async () => {
    try {
      const [token, userJson] = await Promise.all([
        getSecureItem(TOKEN_KEY),
        getSecureItem(USER_KEY),
      ]);

      if (token && userJson) {
        console.log('[auth] found stored token, verifying...');
        
        try {
          const result = await trpcClient.auth.verifyToken.mutate({ token });
          
          if (result.valid && result.user) {
            console.log('[auth] token verified for user:', result.user.email);
            setState({
              user: result.user,
              token,
              isAuthenticated: true,
              isLoading: false,
            });
            return;
          } else {
            console.log('[auth] token invalid, clearing auth');
            await clearAuth();
            return;
          }
        } catch {
          console.log('[auth] token verification failed, using cached user');
          const user = JSON.parse(userJson) as User;
          setState({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
          return;
        }
      }
    } catch (error) {
      console.error('[auth] Failed to load auth:', error);
    }

    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, [clearAuth]);

  useEffect(() => {
    loadStoredAuth();
  }, [loadStoredAuth]);

  const saveAuth = async (user: User, token: string) => {
    await Promise.all([
      setSecureItem(TOKEN_KEY, token),
      setSecureItem(USER_KEY, JSON.stringify(user)),
    ]);
    setState({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const signup = async (credentials: SignupCredentials): Promise<{ success: boolean; error?: string }> => {
    const normalizedEmail = credentials.email.toLowerCase().trim();
    console.log('[auth] signup start', { email: normalizedEmail });
    
    try {
      const result = await trpcClient.auth.signup.mutate({
        email: normalizedEmail,
        password: credentials.password,
      });

      console.log('[auth] signup success', { userId: result.user.id, email: result.user.email });
      await saveAuth(result.user, result.token);
      return { success: true };
    } catch (error: any) {
      console.log('[auth] signup error:', error.message);
      const message = error.message || 'Signup failed. Please try again.';
      return { success: false, error: message };
    }
  };

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    console.log('[auth] login start', { email: credentials.email });
    
    try {
      const result = await trpcClient.auth.login.mutate({
        email: credentials.email.toLowerCase().trim(),
        password: credentials.password,
      });

      console.log('[auth] login success', { userId: result.user.id, email: result.user.email });
      await saveAuth(result.user, result.token);
      return { success: true };
    } catch (error: any) {
      console.log('[auth] login error:', error.message);
      const message = error.message || 'Login failed. Please try again.';
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    console.log('[auth] logging out');
    await clearAuth();
  };

  const deleteAccount = async () => {
    try {
      const token = state.token;
      if (token) {
        await trpcClient.auth.deleteAccount.mutate({ token });
      }

      await Promise.all(
        ALL_STORAGE_KEYS.map(key => AsyncStorage.removeItem(key))
      );

      await clearAuth();
      console.log('[auth] account deleted successfully');
    } catch (error) {
      console.error('[auth] deleteAccount error:', error);
      throw error;
    }
  };

  const refreshAuth = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    await loadStoredAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signup,
        login,
        logout,
        deleteAccount,
        refreshAuth,
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
