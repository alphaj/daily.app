import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    SpendingCategory,
    Transaction,
    MonthlySnapshot,
    DEFAULT_CATEGORIES,
    getCurrentMonthKey,
} from '@/types/spending';

const STORAGE_KEYS = {
    CATEGORIES: 'spending_categories',
    TRANSACTIONS: 'spending_transactions',
    MONTHLY_INCOME: 'spending_monthly_income',
};

interface SpendingContextType {
    // Categories
    categories: SpendingCategory[];
    updateCategory: (id: string, updates: Partial<SpendingCategory>) => void;

    // Transactions
    transactions: Transaction[];
    addTransaction: (categoryId: string, amount: number, note?: string, isWork?: boolean) => void;
    updateTransaction: (id: string, updates: Partial<Transaction>) => void;
    deleteTransaction: (id: string) => void;

    // Income
    monthlyIncome: number;
    setMonthlyIncome: (amount: number) => void;

    // Computed values
    getSpentInCategory: (categoryId: string) => number;
    getTotalSpent: () => number;
    getRemainingBudget: (categoryId: string) => number;
    getBudgetPercentage: (categoryId: string) => number;
    getTransactionsForCategory: (categoryId: string) => Transaction[];

    // Loading state
    isLoading: boolean;
}

const SpendingContext = createContext<SpendingContextType | undefined>(undefined);

export function SpendingProvider({ children }: { children: React.ReactNode }) {
    const [categories, setCategories] = useState<SpendingCategory[]>(DEFAULT_CATEGORIES);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [monthlyIncome, setMonthlyIncomeState] = useState<number>(5000);
    const [isLoading, setIsLoading] = useState(true);

    // Load data from storage on mount
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [categoriesData, transactionsData, incomeData] = await Promise.all([
                AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES),
                AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS),
                AsyncStorage.getItem(STORAGE_KEYS.MONTHLY_INCOME),
            ]);

            if (categoriesData) {
                setCategories(JSON.parse(categoriesData));
            }
            if (transactionsData) {
                setTransactions(JSON.parse(transactionsData));
            }
            if (incomeData) {
                setMonthlyIncomeState(JSON.parse(incomeData));
            }
        } catch (error) {
            console.error('Failed to load spending data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Save transactions whenever they change
    useEffect(() => {
        if (!isLoading) {
            AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
        }
    }, [transactions, isLoading]);

    // Save categories whenever they change
    useEffect(() => {
        if (!isLoading) {
            AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
        }
    }, [categories, isLoading]);

    // Save income whenever it changes
    useEffect(() => {
        if (!isLoading) {
            AsyncStorage.setItem(STORAGE_KEYS.MONTHLY_INCOME, JSON.stringify(monthlyIncome));
        }
    }, [monthlyIncome, isLoading]);

    const addTransaction = useCallback((
        categoryId: string,
        amount: number,
        note?: string,
        isWork?: boolean
    ) => {
        const category = categories.find(c => c.id === categoryId);
        const newTransaction: Transaction = {
            id: Date.now().toString(),
            categoryId,
            amount,
            note,
            timestamp: new Date().toISOString(),
            isWork: isWork ?? category?.isWork ?? false,
        };
        setTransactions(prev => [newTransaction, ...prev]);
    }, [categories]);

    const deleteTransaction = useCallback((id: string) => {
        setTransactions(prev => prev.filter(t => t.id !== id));
    }, []);

    const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
        setTransactions(prev => prev.map(t =>
            t.id === id ? { ...t, ...updates } : t
        ));
    }, []);

    const updateCategory = useCallback((id: string, updates: Partial<SpendingCategory>) => {
        setCategories(prev => prev.map(c =>
            c.id === id ? { ...c, ...updates } : c
        ));
    }, []);

    const setMonthlyIncome = useCallback((amount: number) => {
        setMonthlyIncomeState(amount);
    }, []);

    // Get transactions for current month only
    const getCurrentMonthTransactions = useCallback(() => {
        const currentMonth = getCurrentMonthKey();
        return transactions.filter(t => t.timestamp.startsWith(currentMonth));
    }, [transactions]);

    const getSpentInCategory = useCallback((categoryId: string) => {
        return getCurrentMonthTransactions()
            .filter(t => t.categoryId === categoryId)
            .reduce((sum, t) => sum + t.amount, 0);
    }, [getCurrentMonthTransactions]);

    const getTotalSpent = useCallback(() => {
        return getCurrentMonthTransactions()
            .reduce((sum, t) => sum + t.amount, 0);
    }, [getCurrentMonthTransactions]);

    const getRemainingBudget = useCallback((categoryId: string) => {
        const category = categories.find(c => c.id === categoryId);
        if (!category) return 0;
        return Math.max(0, category.budget - getSpentInCategory(categoryId));
    }, [categories, getSpentInCategory]);

    const getBudgetPercentage = useCallback((categoryId: string) => {
        const category = categories.find(c => c.id === categoryId);
        if (!category || category.budget === 0) return 0;
        const spent = getSpentInCategory(categoryId);
        return Math.min(100, (spent / category.budget) * 100);
    }, [categories, getSpentInCategory]);

    const getTransactionsForCategory = useCallback((categoryId: string) => {
        return getCurrentMonthTransactions()
            .filter(t => t.categoryId === categoryId)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [getCurrentMonthTransactions]);

    return (
        <SpendingContext.Provider
            value={{
                categories,
                updateCategory,
                transactions,
                addTransaction,
                updateTransaction,
                deleteTransaction,
                monthlyIncome,
                setMonthlyIncome,
                getSpentInCategory,
                getTotalSpent,
                getRemainingBudget,
                getBudgetPercentage,
                getTransactionsForCategory,
                isLoading,
            }}
        >
            {children}
        </SpendingContext.Provider>
    );
}

export function useSpending() {
    const context = useContext(SpendingContext);
    if (context === undefined) {
        throw new Error('useSpending must be used within a SpendingProvider');
    }
    return context;
}
