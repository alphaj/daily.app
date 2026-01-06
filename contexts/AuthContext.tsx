import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { User, AuthState, LoginCredentials, SignupCredentials, AuthResponse } from '@/types/auth';
import { trpc } from '@/lib/trpc';

const TOKEN_KEY = 'daily_auth_token';
const USER_KEY = 'daily_auth_user';

interface AuthContextType extends AuthState {
    signup: (credentials: SignupCredentials) => Promise<{ success: boolean; error?: string }>;
    login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cross-platform secure storage
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

    const signupMutation = trpc.auth.signup.useMutation();
    const loginMutation = trpc.auth.login.useMutation();
    const verifyMutation = trpc.auth.verifyToken.useMutation();

    useEffect(() => {
        loadStoredAuth();
    }, []);

    const loadStoredAuth = async () => {
        try {
            const [token, userJson] = await Promise.all([
                getSecureItem(TOKEN_KEY),
                getSecureItem(USER_KEY),
            ]);

            if (token && userJson) {
                const user = JSON.parse(userJson) as User;

                // Verify token is still valid
                try {
                    const result = await verifyMutation.mutateAsync({ token });
                    if (result.valid) {
                        setState({
                            user,
                            token,
                            isAuthenticated: true,
                            isLoading: false,
                        });
                        return;
                    }
                } catch (error) {
                    // Token invalid, clear storage
                    await clearAuth();
                }
            }
        } catch (error) {
            console.error('Failed to load auth:', error);
        }

        setState(prev => ({ ...prev, isLoading: false }));
    };

    const clearAuth = async () => {
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
    };

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
        try {
            const result = await signupMutation.mutateAsync(credentials);
            await saveAuth(result.user, result.token);
            return { success: true };
        } catch (error: any) {
            const message = error.message || 'Signup failed';
            return { success: false, error: message };
        }
    };

    const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
        try {
            const result = await loginMutation.mutateAsync(credentials);
            await saveAuth(result.user, result.token);
            return { success: true };
        } catch (error: any) {
            const message = error.message || 'Login failed';
            return { success: false, error: message };
        }
    };

    const logout = async () => {
        await clearAuth();
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
