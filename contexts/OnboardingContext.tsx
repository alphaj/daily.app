import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    OnboardingState,
    OnboardingResponses,
    LosesDayAt,
    FallsThrough,
    CurrentFeeling,
    ONBOARDING_STEPS,
    defaultOnboardingResponses,
} from '@/types/onboarding';

const STORAGE_KEY = '@daily_onboarding';

interface OnboardingContextType {
    state: OnboardingState;
    isLoading: boolean;
    // Navigation
    nextStep: () => void;
    previousStep: () => void;
    goToStep: (step: number) => void;
    // Setters
    setEmail: (email: string) => void;
    setNotificationsEnabled: (enabled: boolean) => void;
    setLosesDayAt: (value: LosesDayAt) => void;
    setFallsThrough: (values: FallsThrough[]) => void;
    toggleFallsThrough: (value: FallsThrough) => void;
    setCurrentFeeling: (feeling: CurrentFeeling) => void;
    setTodayWin: (win: string) => void;
    // Actions
    completeOnboarding: () => Promise<void>;
    resetOnboarding: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const defaultState: OnboardingState = {
    hasCompletedOnboarding: false,
    currentStep: 0,
    responses: defaultOnboardingResponses,
};

export function OnboardingProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<OnboardingState>(defaultState);
    const [isLoading, setIsLoading] = useState(true);

    // Load onboarding state from AsyncStorage on mount
    useEffect(() => {
        loadState();
    }, []);

    const loadState = async () => {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored) as OnboardingState;
                setState(parsed);
            }
        } catch (error) {
            console.error('Failed to load onboarding state:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const saveState = async (newState: OnboardingState) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        } catch (error) {
            console.error('Failed to save onboarding state:', error);
        }
    };

    const updateState = (updates: Partial<OnboardingState>) => {
        setState(prev => {
            const newState = { ...prev, ...updates };
            saveState(newState);
            return newState;
        });
    };

    const updateResponses = (updates: Partial<OnboardingResponses>) => {
        setState(prev => {
            const newState = {
                ...prev,
                responses: { ...prev.responses, ...updates },
            };
            saveState(newState);
            return newState;
        });
    };

    // Navigation
    const nextStep = () => {
        if (state.currentStep < ONBOARDING_STEPS.length - 1) {
            updateState({ currentStep: state.currentStep + 1 });
        }
    };

    const previousStep = () => {
        if (state.currentStep > 0) {
            updateState({ currentStep: state.currentStep - 1 });
        }
    };

    const goToStep = (step: number) => {
        if (step >= 0 && step < ONBOARDING_STEPS.length) {
            updateState({ currentStep: step });
        }
    };

    // Setters
    const setEmail = (email: string) => updateResponses({ email });
    const setNotificationsEnabled = (enabled: boolean) => updateResponses({ notificationsEnabled: enabled });
    const setLosesDayAt = (value: LosesDayAt) => updateResponses({ losesDayAt: value });
    const setFallsThrough = (values: FallsThrough[]) => updateResponses({ fallsThrough: values });
    const toggleFallsThrough = (value: FallsThrough) => {
        const current = state.responses.fallsThrough;
        const updated = current.includes(value)
            ? current.filter(v => v !== value)
            : [...current, value];
        updateResponses({ fallsThrough: updated });
    };
    const setCurrentFeeling = (feeling: CurrentFeeling) => updateResponses({ currentFeeling: feeling });
    const setTodayWin = (win: string) => updateResponses({ todayWin: win });

    // Actions
    const completeOnboarding = async () => {
        const newState = { ...state, hasCompletedOnboarding: true };
        setState(newState);
        await saveState(newState);
    };

    const resetOnboarding = async () => {
        setState(defaultState);
        await AsyncStorage.removeItem(STORAGE_KEY);
    };

    return (
        <OnboardingContext.Provider
            value={{
                state,
                isLoading,
                nextStep,
                previousStep,
                goToStep,
                setEmail,
                setNotificationsEnabled,
                setLosesDayAt,
                setFallsThrough,
                toggleFallsThrough,
                setCurrentFeeling,
                setTodayWin,
                completeOnboarding,
                resetOnboarding,
            }}
        >
            {children}
        </OnboardingContext.Provider>
    );
}

export function useOnboarding() {
    const context = useContext(OnboardingContext);
    if (context === undefined) {
        throw new Error('useOnboarding must be used within an OnboardingProvider');
    }
    return context;
}
