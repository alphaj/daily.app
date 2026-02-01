import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wallet, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';

import { AmbientBackground } from '@/components/AmbientBackground';
import { BottomNavBar } from '@/components/BottomNavBar';
import {
    FlowVisualization,
    CategoryCard,
    QuickSpendModal,
    EditBudgetModal,
    TransactionRow,
} from '@/components/MoneyFlow';
import { useSpending } from '@/contexts/SpendingContext';
import { SpendingCategory, formatCurrency, Transaction } from '@/types/spending';

export default function MoneyScreen() {
    const {
        categories,
        monthlyIncome,
        setMonthlyIncome,
        transactions,
        deleteTransaction,
    } = useSpending();

    const [selectedCategory, setSelectedCategory] = useState<SpendingCategory | null>(null);
    const [showSpendModal, setShowSpendModal] = useState(false);
    const [showEditBudgetModal, setShowEditBudgetModal] = useState(false);
    const [editingIncome, setEditingIncome] = useState(false);
    const [incomeInput, setIncomeInput] = useState(monthlyIncome.toString());
    const [showAllTransactions, setShowAllTransactions] = useState(false);

    // Show all categories
    const filteredCategories = categories;

    // Get recent transactions
    const recentTransactions = showAllTransactions
        ? transactions.slice(0, 20)
        : transactions.slice(0, 5);

    const handleCategoryPress = (category: SpendingCategory) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedCategory(category);
        setShowSpendModal(true);
    };

    const handleCategoryLongPress = (category: SpendingCategory) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSelectedCategory(category);
        setShowEditBudgetModal(true);
    };

    const handleIncomeEdit = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setIncomeInput(monthlyIncome.toString());
        setEditingIncome(true);
    };

    const handleIncomeSave = () => {
        const newIncome = parseFloat(incomeInput);
        if (!isNaN(newIncome) && newIncome > 0) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setMonthlyIncome(newIncome);
        }
        setEditingIncome(false);
    };

    const handleDeleteTransaction = (id: string) => {
        deleteTransaction(id);
    };

    const currentMonth = format(new Date(), 'MMMM yyyy');

    return (
        <View style={{ flex: 1 }}>
            <AmbientBackground />
            <SafeAreaView style={styles.container} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Wallet size={24} color="#000" strokeWidth={2} />
                        <Text style={styles.headerTitle}>Money</Text>
                    </View>
                    <Pressable
                        style={styles.monthBadge}
                        onPress={handleIncomeEdit}
                    >
                        <Text style={styles.monthText}>{currentMonth}</Text>
                    </Pressable>
                </View>

                <ScrollView
                    style={styles.content}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 120 }}
                >
                    {/* Flow Visualization Hero */}
                    <FlowVisualization onIncomeLongPress={handleIncomeEdit} />

                    {/* Income Editor Modal (inline) */}
                    {editingIncome && (
                        <View style={styles.incomeEditor}>
                            <Text style={styles.incomeEditorLabel}>Monthly Income</Text>
                            <View style={styles.incomeInputRow}>
                                <Text style={styles.currencySymbol}>$</Text>
                                <TextInput
                                    style={styles.incomeInput}
                                    value={incomeInput}
                                    onChangeText={setIncomeInput}
                                    keyboardType="decimal-pad"
                                    autoFocus
                                    selectTextOnFocus
                                />
                                <Pressable style={styles.saveButton} onPress={handleIncomeSave}>
                                    <Text style={styles.saveButtonText}>Save</Text>
                                </Pressable>
                            </View>
                        </View>
                    )}

                    {/* Categories Grid */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Budgets</Text>
                            <Text style={styles.sectionSubtitle}>Hold to edit</Text>
                        </View>

                        <View style={styles.categoriesGrid}>
                            {filteredCategories.map((category) => (
                                <CategoryCard
                                    key={category.id}
                                    categoryId={category.id}
                                    name={category.name}
                                    emoji={category.emoji}
                                    color={category.color}
                                    budget={category.budget}
                                    onPress={() => handleCategoryPress(category)}
                                    onLongPress={() => handleCategoryLongPress(category)}
                                />
                            ))}
                        </View>
                    </View>

                    {/* Recent Activity */}
                    {transactions.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Recent</Text>
                                <Text style={styles.sectionSubtitle}>Swipe to delete</Text>
                            </View>
                            <View style={styles.transactionsList}>
                                {recentTransactions.map((transaction) => {
                                    const category = categories.find(c => c.id === transaction.categoryId);
                                    return (
                                        <TransactionRow
                                            key={transaction.id}
                                            transaction={transaction}
                                            category={category}
                                            onDelete={handleDeleteTransaction}
                                        />
                                    );
                                })}
                            </View>

                            {transactions.length > 5 && (
                                <Pressable
                                    style={styles.showMoreButton}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setShowAllTransactions(!showAllTransactions);
                                    }}
                                >
                                    <Text style={styles.showMoreText}>
                                        {showAllTransactions ? 'Show less' : `Show all (${transactions.length})`}
                                    </Text>
                                    <ChevronRight
                                        size={16}
                                        color="#007AFF"
                                        style={{
                                            transform: [{ rotate: showAllTransactions ? '-90deg' : '90deg' }]
                                        }}
                                    />
                                </Pressable>
                            )}
                        </View>
                    )}

                    {/* Empty state */}
                    {transactions.length === 0 && (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyEmoji}>💸</Text>
                            <Text style={styles.emptyTitle}>No expenses yet</Text>
                            <Text style={styles.emptySubtitle}>
                                Tap a budget category above to add your first expense
                            </Text>
                        </View>
                    )}
                </ScrollView>

                {/* Bottom Navigation */}
                <BottomNavBar />

                {/* Quick Spend Modal */}
                <QuickSpendModal
                    visible={showSpendModal}
                    category={selectedCategory}
                    onClose={() => {
                        setShowSpendModal(false);
                        setSelectedCategory(null);
                    }}
                />

                {/* Edit Budget Modal */}
                <EditBudgetModal
                    visible={showEditBudgetModal}
                    category={selectedCategory}
                    onClose={() => {
                        setShowEditBudgetModal(false);
                        setSelectedCategory(null);
                    }}
                />
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#000',
        letterSpacing: -0.5,
    },
    monthBadge: {
        backgroundColor: '#F2F2F7',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
    },
    monthText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8E8E93',
    },
    content: {
        flex: 1,
    },
    incomeEditor: {
        marginHorizontal: 20,
        marginBottom: 20,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    incomeEditorLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
        marginBottom: 10,
    },
    incomeInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    currencySymbol: {
        fontSize: 24,
        fontWeight: '700',
        color: '#8E8E93',
    },
    incomeInput: {
        flex: 1,
        fontSize: 28,
        fontWeight: '700',
        color: '#000',
    },
    saveButton: {
        backgroundColor: '#34C759',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
    },
    saveButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
    section: {
        paddingHorizontal: 20,
        marginTop: 8,
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 14,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#000',
        letterSpacing: -0.4,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: '#8E8E93',
    },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    transactionsList: {
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    showMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 4,
    },
    showMoreText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#007AFF',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 40,
    },
    emptyEmoji: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#000',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 15,
        color: '#8E8E93',
        textAlign: 'center',
        lineHeight: 22,
    },
});
