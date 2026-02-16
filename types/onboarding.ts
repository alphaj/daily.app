export type LosesDayAt = 'morning' | 'afternoon' | 'evening' | 'sleep';
export type FallsThrough = 'later' | 'annoying' | 'no-home' | 'promises';
export type CurrentFeeling = 'overwhelmed' | 'scattered' | 'stuck' | 'hopeful';

export interface OnboardingResponses {
    name: string;
    email: string;
    notificationsEnabled: boolean;
    losesDayAt: LosesDayAt | null;
    fallsThrough: FallsThrough[];
    currentFeeling: CurrentFeeling | null;
    todayWin: string;
}

export interface OnboardingState {
    hasCompletedOnboarding: boolean;
    currentStep: number;
    responses: OnboardingResponses;
}

export const ONBOARDING_STEPS = [
    'get-started',
    'notifications',
    'loses-day',
    'falls-through',
    'feeling',
    'today-win',
    'welcome'
] as const;

export type OnboardingStep = typeof ONBOARDING_STEPS[number];

export const defaultOnboardingResponses: OnboardingResponses = {
    name: '',
    email: '',
    notificationsEnabled: false,
    losesDayAt: null,
    fallsThrough: [],
    currentFeeling: null,
    todayWin: '',
};
