import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { User, AuthState, LoginCredentials, SignupCredentials } from '@/types/auth';

const TOKEN_KEY = 'daily_auth_token';
const USER_KEY = 'daily_auth_user';
const USERS_DB_KEY = 'daily_users_db';

interface StoredUser {
    id: string;
    email: string;
    passwordHash: string;
    createdAt: string;
}

// All storage keys used in the app
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

async function hashPassword(password: string): Promise<string> {
    const str = password.trim() + 'daily-app-salt';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    const result = Math.abs(hash).toString(16);
    console.log('[auth] hash generated for password length:', password.length, 'hash:', result);
    return result;
}

function generateToken(): string {
    return `token_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
}

function generateId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function getUsersDb(): Promise<StoredUser[]> {
    try {
        const data = await AsyncStorage.getItem(USERS_DB_KEY);
        const users = data ? JSON.parse(data) : [];
        console.log('[auth] getUsersDb - found', users.length, 'users:', users.map((u: StoredUser) => u.email));
        return users;
    } catch (error) {
        console.error('[auth] getUsersDb error:', error);
        return [];
    }
}

async function saveUsersDb(users: StoredUser[]): Promise<void> {
    await AsyncStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
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
                const user = JSON.parse(userJson) as User;
                console.log('[auth] loaded stored auth for user:', user.email);
                setState({
                    user,
                    token,
                    isAuthenticated: true,
                    isLoading: false,
                });
                return;
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
    }, []);

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
            const users = await getUsersDb();

            const existingUser = users.find(u => u.email.toLowerCase().trim() === normalizedEmail);
            if (existingUser) {
                console.log('[auth] signup failed - email already registered');
                return { success: false, error: 'Email already registered' };
            }

            const passwordHash = await hashPassword(credentials.password);
            const id = generateId();
            const createdAt = new Date().toISOString();

            const newUser: StoredUser = { id, email: normalizedEmail, passwordHash, createdAt };
            users.push(newUser);
            await saveUsersDb(users);

            console.log('[auth] saved user with hash:', passwordHash);

            const token = generateToken();
            const user: User = { id, email: normalizedEmail, createdAt };

            console.log('[auth] signup success', { userId: id, email: normalizedEmail });
            await saveAuth(user, token);
            return { success: true };
        } catch (error: any) {
            console.log('[auth] signup error:', error);
            return { success: false, error: 'Signup failed. Please try again.' };
        }
    };

    const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
        console.log('[auth] login start', { email: credentials.email });
        try {
            const users = await getUsersDb();
            const normalizedEmail = credentials.email.toLowerCase().trim();

            const storedUser = users.find(u => u.email.toLowerCase().trim() === normalizedEmail);
            if (!storedUser) {
                console.log('[auth] login failed - user not found for email:', normalizedEmail);
                console.log('[auth] available emails:', users.map(u => u.email.toLowerCase()));
                return { success: false, error: 'Invalid email or password' };
            }

            console.log('[auth] found user, comparing passwords...');
            console.log('[auth] stored hash:', storedUser.passwordHash);

            const passwordHash = await hashPassword(credentials.password);
            console.log('[auth] input hash:', passwordHash);

            if (passwordHash !== storedUser.passwordHash) {
                console.log('[auth] login failed - password mismatch');
                return { success: false, error: 'Invalid email or password' };
            }

            const token = generateToken();
            const user: User = { id: storedUser.id, email: storedUser.email, createdAt: storedUser.createdAt };

            console.log('[auth] login success', { userId: user.id, email: user.email });
            await saveAuth(user, token);
            return { success: true };
        } catch (error: any) {
            console.log('[auth] login error:', error);
            return { success: false, error: 'Login failed. Please try again.' };
        }
    };

    const logout = async () => {
        await clearAuth();
    };

    const deleteAccount = async () => {
        try {
            // Get current user to remove from users db
            const currentUser = state.user;
            if (currentUser) {
                const users = await getUsersDb();
                const updatedUsers = users.filter(u => u.id !== currentUser.id);
                await saveUsersDb(updatedUsers);
            }

            // Clear all app data
            await Promise.all(
                ALL_STORAGE_KEYS.map(key => AsyncStorage.removeItem(key))
            );

            // Clear auth tokens
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
