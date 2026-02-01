export interface SpendingCategory {
    id: string;
    name: string;
    emoji: string;
    color: string;
    budget: number; // Monthly budget limit
    isWork: boolean; // For Life/Work mode filtering
}

export interface Transaction {
    id: string;
    categoryId: string;
    amount: number;
    note?: string;
    timestamp: string; // ISO date string
    isWork: boolean;
}

export interface MonthlySnapshot {
    month: string; // Format: "YYYY-MM"
    income: number;
    totalSpent: number;
    byCategory: Record<string, number>; // categoryId -> amount spent
}

// Default categories
export const DEFAULT_CATEGORIES: SpendingCategory[] = [
    { id: 'food', name: 'Food & Drinks', emoji: '🍔', color: '#FF9500', budget: 500, isWork: false },
    { id: 'home', name: 'Home', emoji: '🏠', color: '#5856D6', budget: 1500, isWork: false },
    { id: 'transport', name: 'Transport', emoji: '🚗', color: '#34C759', budget: 300, isWork: false },
    { id: 'fun', name: 'Entertainment', emoji: '🎮', color: '#FF2D55', budget: 200, isWork: false },
    { id: 'health', name: 'Health', emoji: '💪', color: '#00C7BE', budget: 150, isWork: false },
    { id: 'tech', name: 'Tech & Subscriptions', emoji: '📱', color: '#007AFF', budget: 100, isWork: false },
    { id: 'work-expenses', name: 'Work Expenses', emoji: '💼', color: '#8E8E93', budget: 500, isWork: true },
    { id: 'education', name: 'Learning', emoji: '📚', color: '#AF52DE', budget: 100, isWork: true },
];

// Quick amount presets for fast entry
export const QUICK_AMOUNTS = [5, 10, 20, 50, 100];

// Helper to get current month key
export function getCurrentMonthKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Helper to format currency
export function formatCurrency(amount: number, locale = 'en-US', currency = 'USD'): string {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}
