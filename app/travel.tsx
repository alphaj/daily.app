import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Alert,
    LayoutAnimation,
    UIManager,
    Platform,
    TextInput,
    Share as RNShare,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
    ChevronLeft, ChevronRight, Plus, ChevronDown, ChevronUp,
    Plane, MapPin, Share2, Check, Copy, Bookmark, DollarSign,
    ClipboardList,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { AmbientBackground } from '@/components/AmbientBackground';
import { BottomNavBar } from '@/components/BottomNavBar';
import { PackingItemCard } from '@/components/PackingItemCard';
import { PackingQuickAdd } from '@/components/PackingQuickAdd';
import SwipeableRow from '@/components/SwipeableRow';
import { useTravel } from '@/contexts/TravelContext';
import type { Trip, PackingCategory, ExpenseCategory } from '@/types/travel';
import {
    PACKING_CATEGORY_CONFIG,
    EXPENSE_CATEGORY_CONFIG,
} from '@/types/travel';
import { differenceInDays, parseISO, isToday, isTomorrow } from 'date-fns';

if (
    Platform.OS === 'android' &&
    UIManager.setLayoutAnimationEnabledExperimental
) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const layoutAnim = () =>
    LayoutAnimation.configureNext(
        LayoutAnimation.create(200, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity)
    );

// --- Helpers ---

function getTripCountdownText(trip: Trip): string | null {
    if (!trip.startDate || !trip.endDate) {
        if (trip.startDate) {
            const start = parseISO(trip.startDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (isToday(start)) return 'Departing today';
            if (isTomorrow(start)) return 'Tomorrow';
            const diff = differenceInDays(start, today);
            if (diff < 0) return null;
            return `${diff} days away`;
        }
        return null;
    }

    const start = parseISO(trip.startDate);
    const end = parseISO(trip.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (today >= start && today <= end) return 'Traveling now';
    if (isToday(start)) return 'Departing today';
    if (isTomorrow(start)) return 'Tomorrow';

    const diff = differenceInDays(start, today);
    if (diff < 0) return null;
    return `${diff} days away`;
}

function formatShareText(trip: Trip, expenseTotal: number): string {
    const lines: string[] = [];
    lines.push(`✈️ ${trip.name}`);
    if (trip.destination) lines.push(`📍 ${trip.destination}`);
    lines.push('');

    // Checklist
    const checklist = trip.checklist || [];
    if (checklist.length > 0) {
        lines.push('📋 Pre-trip Checklist');
        checklist.forEach(c => {
            lines.push(`  ${c.completed ? '✅' : '⬜'} ${c.text}`);
        });
        lines.push('');
    }

    // Packing items by category
    const grouped: Partial<Record<PackingCategory, typeof trip.items>> = {};
    trip.items.forEach(item => {
        if (!grouped[item.category]) grouped[item.category] = [];
        grouped[item.category]!.push(item);
    });
    const categories = Object.entries(grouped).sort(([a], [b]) =>
        PACKING_CATEGORY_CONFIG[a as PackingCategory].order - PACKING_CATEGORY_CONFIG[b as PackingCategory].order
    ) as [PackingCategory, typeof trip.items][];

    if (categories.length > 0) {
        lines.push('🧳 Packing List');
        categories.forEach(([cat, items]) => {
            lines.push(`  ${PACKING_CATEGORY_CONFIG[cat].label}:`);
            items.forEach(i => {
                const qty = i.quantity > 1 ? ` x${i.quantity}` : '';
                lines.push(`    ${i.packed ? '✅' : '⬜'} ${i.name}${qty}`);
            });
        });
        lines.push('');
    }

    // Budget
    if (expenseTotal > 0) {
        lines.push(`💰 Budget Total: $${expenseTotal.toFixed(2)}`);
    }

    return lines.join('\n');
}

const EXPENSE_CATEGORIES = Object.entries(EXPENSE_CATEGORY_CONFIG) as [ExpenseCategory, typeof EXPENSE_CATEGORY_CONFIG[ExpenseCategory]][];

// --- Trip List View ---

function TripCard({
    trip,
    progress,
    onPress,
    isLast,
}: {
    trip: Trip;
    progress: number;
    onPress: () => void;
    isLast: boolean;
}) {
    const statusLabel = trip.status === 'traveling' ? 'Traveling' : 'Packing';
    const statusColor = trip.status === 'traveling' ? '#FF9500' : '#007AFF';
    const packedCount = trip.items.filter(i => i.packed).length;
    const countdown = getTripCountdownText(trip);

    return (
        <Pressable
            style={({ pressed }) => [
                styles.tripCard,
                pressed && { opacity: 0.7 },
            ]}
            onPress={() => {
                Haptics.selectionAsync();
                onPress();
            }}
        >
            <View style={[styles.tripIconContainer, { backgroundColor: statusColor + '12' }]}>
                <Plane size={20} color={statusColor} strokeWidth={2} />
            </View>

            <View style={styles.tripContent}>
                <View style={styles.tripTitleRow}>
                    <Text style={styles.tripName} numberOfLines={1}>{trip.name}</Text>
                    {trip.destination ? (
                        <View style={styles.destRow}>
                            <MapPin size={11} color="#8E8E93" strokeWidth={2} />
                            <Text style={styles.tripDest} numberOfLines={1}>{trip.destination}</Text>
                        </View>
                    ) : null}
                    {countdown ? (
                        <Text style={styles.countdownText}>{countdown}</Text>
                    ) : null}
                </View>

                <View style={styles.tripProgressRow}>
                    <View style={styles.progressBarContainer}>
                        <View
                            style={[
                                styles.progressBarFill,
                                {
                                    width: `${Math.min(progress, 100)}%`,
                                    backgroundColor: statusColor,
                                },
                            ]}
                        />
                    </View>
                    <Text style={styles.tripProgressText}>
                        {packedCount}/{trip.items.length}
                    </Text>
                </View>
            </View>

            <View style={styles.tripRight}>
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
                    <Text style={[styles.statusBadgeText, { color: statusColor }]}>{statusLabel}</Text>
                </View>
                <ChevronRight size={16} color="#C7C7CC" strokeWidth={2} />
            </View>

            {!isLast && <View style={styles.tripSeparator} />}
        </Pressable>
    );
}

function CompletedTripRow({
    trip,
    onPress,
    isLast,
}: {
    trip: Trip;
    onPress: () => void;
    isLast: boolean;
}) {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.tripCard,
                pressed && { opacity: 0.7 },
            ]}
            onPress={() => {
                Haptics.selectionAsync();
                onPress();
            }}
        >
            <View style={[styles.tripIconContainer, { backgroundColor: 'rgba(60,60,67,0.05)' }]}>
                <Plane size={20} color="#8E8E93" strokeWidth={2} />
            </View>

            <View style={styles.tripContent}>
                <Text style={[styles.tripName, { color: '#8E8E93' }]} numberOfLines={1}>
                    {trip.name}
                </Text>
                {trip.destination ? (
                    <Text style={styles.tripDest} numberOfLines={1}>{trip.destination}</Text>
                ) : null}
            </View>

            <ChevronRight size={16} color="#C7C7CC" strokeWidth={2} />

            {!isLast && <View style={styles.tripSeparator} />}
        </Pressable>
    );
}

// --- Main Screen ---

export default function TravelScreen() {
    const router = useRouter();
    const {
        activeTrips,
        completedTrips,
        getTripProgress,
        getItemsByCategory,
        toggleItemPacked,
        deleteItemFromTrip,
        addItemToTrip,
        updateTrip,
        deleteTrip,
        duplicateTrip,
        addChecklistItem,
        toggleChecklistItem,
        deleteChecklistItem,
        addExpense,
        deleteExpense,
        getTripExpenseTotal,
        saveAsTemplate,
    } = useTravel();

    const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
    const [showCompleted, setShowCompleted] = useState(false);
    const [collapsedCategories, setCollapsedCategories] = useState<Set<PackingCategory>>(new Set());
    const [checklistInput, setChecklistInput] = useState('');
    const [budgetExpanded, setBudgetExpanded] = useState(false);
    const [checklistExpanded, setChecklistExpanded] = useState(true);
    const [showChecklistCompleted, setShowChecklistCompleted] = useState(false);
    const [expenseDesc, setExpenseDesc] = useState('');
    const [expenseAmount, setExpenseAmount] = useState('');
    const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('other');

    const selectedTrip = useMemo(() => {
        if (!selectedTripId) return null;
        return [...activeTrips, ...completedTrips].find(t => t.id === selectedTripId) ?? null;
    }, [selectedTripId, activeTrips, completedTrips]);

    const itemsByCategory = useMemo(() => {
        if (!selectedTrip) return [];
        return getItemsByCategory(selectedTrip);
    }, [selectedTrip, getItemsByCategory]);

    const progress = selectedTrip ? getTripProgress(selectedTrip) : 0;
    const expenseTotal = selectedTrip ? getTripExpenseTotal(selectedTrip) : 0;


    const handleSelectTrip = useCallback((id: string) => {
        setSelectedTripId(id);
        setCollapsedCategories(new Set());
        setChecklistInput('');
        setShowChecklistCompleted(false);
        setExpenseDesc('');
        setExpenseAmount('');
        setExpenseCategory('other');
    }, []);

    const handleBack = useCallback(() => {
        if (selectedTripId) {
            setSelectedTripId(null);
        } else {
            router.back();
        }
    }, [selectedTripId, router]);

    const handleToggleItem = useCallback((itemId: string) => {
        if (!selectedTripId) return;
        layoutAnim();
        toggleItemPacked(selectedTripId, itemId);
    }, [selectedTripId, toggleItemPacked]);

    const handleDeleteItem = useCallback((itemId: string) => {
        if (!selectedTripId) return;
        deleteItemFromTrip(selectedTripId, itemId);
    }, [selectedTripId, deleteItemFromTrip]);

    const handleQuickAdd = useCallback((name: string, category: PackingCategory) => {
        if (!selectedTripId) return;
        addItemToTrip(selectedTripId, name, category);
    }, [selectedTripId, addItemToTrip]);

    const handleStatusAction = useCallback(() => {
        if (!selectedTrip) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        if (selectedTrip.status === 'packing') {
            updateTrip(selectedTrip.id, { status: 'traveling' });
        } else if (selectedTrip.status === 'traveling') {
            updateTrip(selectedTrip.id, { status: 'completed' });
            setSelectedTripId(null);
        }
    }, [selectedTrip, updateTrip]);

    const handleDeleteTrip = useCallback(() => {
        if (!selectedTrip) return;
        Alert.alert(
            'Delete Trip',
            `Are you sure you want to delete "${selectedTrip.name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        deleteTrip(selectedTrip.id);
                        setSelectedTripId(null);
                    },
                },
            ]
        );
    }, [selectedTrip, deleteTrip]);

    const handleToggleCategory = useCallback((category: PackingCategory) => {
        layoutAnim();
        Haptics.selectionAsync();
        setCollapsedCategories(prev => {
            const next = new Set(prev);
            if (next.has(category)) next.delete(category);
            else next.add(category);
            return next;
        });
    }, []);

    const handleShare = useCallback(async () => {
        if (!selectedTrip) return;
        const text = formatShareText(selectedTrip, expenseTotal);
        await RNShare.share({ message: text });
    }, [selectedTrip, expenseTotal]);

    const handleAddChecklistItem = useCallback((text: string) => {
        if (!selectedTripId || !text.trim()) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        addChecklistItem(selectedTripId, text.trim());
    }, [selectedTripId, addChecklistItem]);

    const handleChecklistSubmit = useCallback(() => {
        handleAddChecklistItem(checklistInput);
        setChecklistInput('');
    }, [checklistInput, handleAddChecklistItem]);

    const handleToggleChecklistItem = useCallback((itemId: string) => {
        if (!selectedTripId) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        toggleChecklistItem(selectedTripId, itemId);
    }, [selectedTripId, toggleChecklistItem]);

    const handleDeleteChecklistItem = useCallback((itemId: string) => {
        if (!selectedTripId) return;
        deleteChecklistItem(selectedTripId, itemId);
    }, [selectedTripId, deleteChecklistItem]);

    const handleAddExpense = useCallback(() => {
        if (!selectedTripId || !expenseDesc.trim() || !expenseAmount.trim()) return;
        const amount = parseFloat(expenseAmount);
        if (isNaN(amount) || amount <= 0) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        addExpense(selectedTripId, expenseDesc.trim(), amount, expenseCategory);
        setExpenseDesc('');
        setExpenseAmount('');
        setExpenseCategory('other');
    }, [selectedTripId, expenseDesc, expenseAmount, expenseCategory, addExpense]);

    const handleDeleteExpense = useCallback((expenseId: string) => {
        if (!selectedTripId) return;
        deleteExpense(selectedTripId, expenseId);
    }, [selectedTripId, deleteExpense]);

    const handleSaveAsTemplate = useCallback(() => {
        if (!selectedTrip) return;
        Alert.alert(
            'Save as Template',
            `Save "${selectedTrip.name}" as a reusable template?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Save',
                    onPress: async () => {
                        await saveAsTemplate(selectedTrip.id);
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        Alert.alert('Saved', 'Template saved! Use it when creating new trips.');
                    },
                },
            ]
        );
    }, [selectedTrip, saveAsTemplate]);

    const handleDuplicateTrip = useCallback(async () => {
        if (!selectedTrip) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const newTrip = await duplicateTrip(selectedTrip.id);
        if (newTrip) {
            setSelectedTripId(newTrip.id);
        }
    }, [selectedTrip, duplicateTrip]);

    // --- Trip Detail View ---
    if (selectedTrip) {
        const statusActionLabel =
            selectedTrip.status === 'packing' ? 'Mark as Traveling' :
            selectedTrip.status === 'traveling' ? 'Complete Trip' : null;

        const countdown = getTripCountdownText(selectedTrip);
        const checklist = selectedTrip.checklist || [];
        const expenses = selectedTrip.expenses || [];
        const packedCount = selectedTrip.items.filter(i => i.packed).length;
        const totalItems = selectedTrip.items.length;
        const checklistDone = checklist.filter(c => c.completed).length;
        return (
            <View style={styles.container}>
                <AmbientBackground />
                <SafeAreaView style={styles.safeArea} edges={['top']}>
                    {/* Nav bar */}
                    <View style={styles.detailNav}>
                        <Pressable style={styles.backButton} onPress={handleBack} hitSlop={10}>
                            <ChevronLeft size={24} color="#000" strokeWidth={1.5} />
                        </Pressable>
                        <View style={{ flex: 1 }} />
                        <Pressable
                            style={styles.navTextButton}
                            onPress={() => router.push({ pathname: '/add-trip', params: { id: selectedTrip.id } })}
                            hitSlop={8}
                        >
                            <Text style={styles.navTextButtonLabel}>Edit</Text>
                        </Pressable>
                    </View>

                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.detailScrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Hero Card */}
                        <View style={styles.heroCard}>
                            <Text style={styles.heroTitle} numberOfLines={2}>{selectedTrip.name}</Text>
                            {selectedTrip.destination ? (
                                <View style={styles.heroDestRow}>
                                    <MapPin size={13} color="#8E8E93" strokeWidth={2} />
                                    <Text style={styles.heroDestText}>{selectedTrip.destination}</Text>
                                </View>
                            ) : null}

                            {/* Progress */}
                            {totalItems > 0 && (
                                <View style={styles.heroProgressWrap}>
                                    <View style={styles.heroProgressBar}>
                                        <View
                                            style={[
                                                styles.heroProgressFill,
                                                { width: `${Math.min(progress, 100)}%` },
                                            ]}
                                        />
                                    </View>
                                    <View style={styles.heroStatsRow}>
                                        <Text style={styles.heroStatsText}>
                                            {packedCount} of {totalItems} packed
                                        </Text>
                                        <Text style={styles.heroStatsPercent}>{progress}%</Text>
                                    </View>
                                </View>
                            )}

                            {/* Countdown badge */}
                            {countdown ? (
                                <View style={styles.heroBadge}>
                                    <Plane size={12} color="#FF9500" strokeWidth={2.5} />
                                    <Text style={styles.heroBadgeText}>{countdown}</Text>
                                </View>
                            ) : null}
                        </View>

                        {/* Status action */}
                        {statusActionLabel && (
                            <Pressable
                                style={({ pressed }) => [
                                    styles.statusButton,
                                    pressed && { opacity: 0.7 },
                                ]}
                                onPress={handleStatusAction}
                            >
                                <Text style={styles.statusButtonText}>{statusActionLabel}</Text>
                            </Pressable>
                        )}

                        {/* --- CHECKLIST --- */}
                        <View style={styles.groupedSection}>
                            <Pressable
                                style={styles.groupedSectionHeader}
                                onPress={() => {
                                    layoutAnim();
                                    Haptics.selectionAsync();
                                    setChecklistExpanded(!checklistExpanded);
                                }}
                            >
                                <Text style={styles.groupedSectionLabel}>Checklist</Text>
                                {checklist.length > 0 && (
                                    <Text style={styles.groupedSectionCount}>
                                        {checklistDone}/{checklist.length}
                                    </Text>
                                )}
                                {checklistExpanded
                                    ? <ChevronUp size={14} color="#C7C7CC" strokeWidth={2} />
                                    : <ChevronDown size={14} color="#C7C7CC" strokeWidth={2} />
                                }
                            </Pressable>

                            {checklistExpanded && (() => {
                                const pending = checklist.filter(c => !c.completed);
                                const completed = checklist.filter(c => c.completed);
                                return (
                                    <View style={styles.groupedCard}>
                                        {/* Pending items */}
                                        {pending.map((item, idx) => (
                                            <SwipeableRow key={item.id} onDelete={() => handleDeleteChecklistItem(item.id)}>
                                                <Pressable
                                                    style={styles.checklistRow}
                                                    onPress={() => handleToggleChecklistItem(item.id)}
                                                >
                                                    <View style={styles.checklistUnchecked} />
                                                    <Text style={styles.checklistText}>{item.text}</Text>
                                                    {idx < pending.length - 1 && <View style={styles.inCardSep} />}
                                                </Pressable>
                                            </SwipeableRow>
                                        ))}

                                        {/* Inline add */}
                                        {pending.length > 0 && <View style={styles.inCardSepFull} />}
                                        <View style={styles.checklistAddRow}>
                                            <View style={styles.checklistAddCircle}>
                                                <Plus size={11} color="#C7C7CC" strokeWidth={2.5} />
                                            </View>
                                            <TextInput
                                                style={styles.checklistAddInput}
                                                placeholder="Add a task..."
                                                placeholderTextColor="#C7C7CC"
                                                value={checklistInput}
                                                onChangeText={setChecklistInput}
                                                onSubmitEditing={handleChecklistSubmit}
                                                returnKeyType="done"
                                                blurOnSubmit={false}
                                            />
                                        </View>

                                        {/* Completed toggle */}
                                        {completed.length > 0 && (
                                            <>
                                                <View style={styles.inCardSepFull} />
                                                <Pressable
                                                    style={styles.completedToggleRow}
                                                    onPress={() => {
                                                        layoutAnim();
                                                        Haptics.selectionAsync();
                                                        setShowChecklistCompleted(!showChecklistCompleted);
                                                    }}
                                                >
                                                    <Text style={styles.completedToggleText}>
                                                        {completed.length} completed
                                                    </Text>
                                                    {showChecklistCompleted
                                                        ? <ChevronUp size={13} color="#8E8E93" strokeWidth={2} />
                                                        : <ChevronDown size={13} color="#8E8E93" strokeWidth={2} />
                                                    }
                                                </Pressable>
                                                {showChecklistCompleted && completed.map((item, idx) => (
                                                    <SwipeableRow key={item.id} onDelete={() => handleDeleteChecklistItem(item.id)}>
                                                        <Pressable
                                                            style={styles.checklistRow}
                                                            onPress={() => handleToggleChecklistItem(item.id)}
                                                        >
                                                            <View style={styles.checklistChecked}>
                                                                <Check size={12} color="#fff" strokeWidth={3} />
                                                            </View>
                                                            <Text style={[styles.checklistText, styles.checklistTextDone]}>
                                                                {item.text}
                                                            </Text>
                                                            {idx < completed.length - 1 && <View style={styles.inCardSep} />}
                                                        </Pressable>
                                                    </SwipeableRow>
                                                ))}
                                            </>
                                        )}
                                    </View>
                                );
                            })()}

                        </View>

                        {/* --- PACKING LIST --- */}
                        <View style={styles.groupedSection}>
                            <Text style={[styles.groupedSectionLabel, { marginBottom: 10 }]}>Packing</Text>

                            {itemsByCategory.map(([category, items]) => {
                                const config = PACKING_CATEGORY_CONFIG[category];
                                const isCollapsed = collapsedCategories.has(category);
                                const catPacked = items.filter(i => i.packed).length;
                                return (
                                    <View key={category} style={styles.packingCategoryWrap}>
                                        <Pressable
                                            style={styles.categoryHeader}
                                            onPress={() => handleToggleCategory(category)}
                                        >
                                            <View style={[styles.categoryDot, { backgroundColor: config.color }]} />
                                            <Text style={styles.categoryLabel}>{config.label}</Text>
                                            <Text style={styles.categoryCount}>
                                                {catPacked}/{items.length}
                                            </Text>
                                            {isCollapsed
                                                ? <ChevronDown size={14} color="#C7C7CC" strokeWidth={2} />
                                                : <ChevronUp size={14} color="#C7C7CC" strokeWidth={2} />
                                            }
                                        </Pressable>
                                        {!isCollapsed && (
                                            <View style={styles.itemsList}>
                                                {items.map((item, idx) => (
                                                    <PackingItemCard
                                                        key={item.id}
                                                        item={item}
                                                        onToggle={handleToggleItem}
                                                        onDelete={handleDeleteItem}
                                                        isFirst={idx === 0}
                                                        isLast={idx === items.length - 1}
                                                    />
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                );
                            })}

                            {/* Quick add inline at bottom of packing section */}
                            <PackingQuickAdd onAddItem={handleQuickAdd} />

                        </View>

                        {/* --- BUDGET --- */}
                        <View style={styles.groupedSection}>
                            <Pressable
                                style={styles.groupedSectionHeader}
                                onPress={() => {
                                    layoutAnim();
                                    Haptics.selectionAsync();
                                    setBudgetExpanded(!budgetExpanded);
                                }}
                            >
                                <Text style={styles.groupedSectionLabel}>Budget</Text>
                                <Text style={styles.budgetTotalLabel}>
                                    ${expenseTotal.toFixed(2)}
                                </Text>
                                {budgetExpanded
                                    ? <ChevronUp size={14} color="#C7C7CC" strokeWidth={2} />
                                    : <ChevronDown size={14} color="#C7C7CC" strokeWidth={2} />
                                }
                            </Pressable>

                            {budgetExpanded && (
                                <View style={styles.groupedCard}>
                                    {expenses.map((expense, idx) => {
                                        const catConfig = EXPENSE_CATEGORY_CONFIG[expense.category];
                                        return (
                                            <SwipeableRow key={expense.id} onDelete={() => handleDeleteExpense(expense.id)}>
                                                <View style={styles.expenseRow}>
                                                    <View style={[styles.expenseDot, { backgroundColor: catConfig.color }]} />
                                                    <Text style={styles.expenseDesc} numberOfLines={1}>{expense.description}</Text>
                                                    <Text style={styles.expenseCat}>{catConfig.label}</Text>
                                                    <Text style={styles.expenseAmt}>${expense.amount.toFixed(2)}</Text>
                                                </View>
                                                {idx < expenses.length - 1 && <View style={styles.inCardSep} />}
                                            </SwipeableRow>
                                        );
                                    })}
                                    {expenses.length > 0 && <View style={styles.inCardSepFull} />}
                                    {/* Add expense inline */}
                                    <View style={styles.expenseAddWrap}>
                                        <View style={styles.expenseInputRow}>
                                            <TextInput
                                                style={[styles.expenseInput, { flex: 1 }]}
                                                placeholder="Description"
                                                placeholderTextColor="#C7C7CC"
                                                value={expenseDesc}
                                                onChangeText={setExpenseDesc}
                                            />
                                            <TextInput
                                                style={[styles.expenseInput, { width: 80 }]}
                                                placeholder="$0"
                                                placeholderTextColor="#C7C7CC"
                                                value={expenseAmount}
                                                onChangeText={setExpenseAmount}
                                                keyboardType="decimal-pad"
                                            />
                                        </View>
                                        <ScrollView
                                            horizontal
                                            showsHorizontalScrollIndicator={false}
                                            contentContainerStyle={styles.expenseCatRow}
                                            keyboardShouldPersistTaps="always"
                                        >
                                            {EXPENSE_CATEGORIES.map(([cat, config]) => (
                                                <Pressable
                                                    key={cat}
                                                    style={[
                                                        styles.expenseCatChip,
                                                        expenseCategory === cat && { backgroundColor: config.color + '15', borderColor: config.color },
                                                    ]}
                                                    onPress={() => setExpenseCategory(cat)}
                                                >
                                                    <Text style={[
                                                        styles.expenseCatChipText,
                                                        expenseCategory === cat && { color: config.color, fontWeight: '600' },
                                                    ]}>{config.label}</Text>
                                                </Pressable>
                                            ))}
                                        </ScrollView>
                                        {expenseDesc.trim() && expenseAmount.trim() && (
                                            <Pressable
                                                style={({ pressed }) => [
                                                    styles.addExpenseButton,
                                                    pressed && { opacity: 0.7 },
                                                ]}
                                                onPress={handleAddExpense}
                                            >
                                                <Text style={styles.addExpenseButtonText}>Add</Text>
                                            </Pressable>
                                        )}
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* --- ACTIONS --- */}
                        <View style={styles.groupedSection}>
                            <Text style={[styles.groupedSectionLabel, { marginBottom: 10 }]}>Actions</Text>
                            <View style={styles.groupedCard}>
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.actionRow,
                                        pressed && { backgroundColor: 'rgba(0,0,0,0.03)' },
                                    ]}
                                    onPress={handleShare}
                                >
                                    <Share2 size={17} color="#007AFF" strokeWidth={2} />
                                    <Text style={styles.actionRowText}>Share</Text>
                                    <ChevronRight size={15} color="#C7C7CC" strokeWidth={2} />
                                </Pressable>
                                <View style={styles.inCardSep} />
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.actionRow,
                                        pressed && { backgroundColor: 'rgba(0,0,0,0.03)' },
                                    ]}
                                    onPress={handleSaveAsTemplate}
                                >
                                    <Bookmark size={17} color="#007AFF" strokeWidth={2} />
                                    <Text style={styles.actionRowText}>Save as Template</Text>
                                    <ChevronRight size={15} color="#C7C7CC" strokeWidth={2} />
                                </Pressable>
                                <View style={styles.inCardSep} />
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.actionRow,
                                        pressed && { backgroundColor: 'rgba(0,0,0,0.03)' },
                                    ]}
                                    onPress={handleDuplicateTrip}
                                >
                                    <Copy size={17} color="#007AFF" strokeWidth={2} />
                                    <Text style={styles.actionRowText}>Duplicate Trip</Text>
                                    <ChevronRight size={15} color="#C7C7CC" strokeWidth={2} />
                                </Pressable>
                                <View style={styles.inCardSep} />
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.actionRow,
                                        pressed && { backgroundColor: 'rgba(0,0,0,0.03)' },
                                    ]}
                                    onPress={handleDeleteTrip}
                                >
                                    <Text style={styles.actionRowTextDestructive}>Delete Trip</Text>
                                </Pressable>
                            </View>
                        </View>
                    </ScrollView>
                </SafeAreaView>
                <BottomNavBar />
            </View>
        );
    }

    // --- Trip List View ---
    return (
        <View style={styles.container}>
            <AmbientBackground />
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.listHeader}>
                        <Pressable style={styles.backButton} onPress={handleBack} hitSlop={10}>
                            <ChevronLeft size={24} color="#000" strokeWidth={1.5} />
                        </Pressable>
                        <Text style={styles.pageTitle}>Travel</Text>
                        <Pressable
                            style={styles.addButton}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.push('/add-trip');
                            }}
                            hitSlop={8}
                        >
                            <Plus size={22} color="#007AFF" strokeWidth={2.5} />
                        </Pressable>
                    </View>

                    {/* Empty State */}
                    {activeTrips.length === 0 && completedTrips.length === 0 && (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyEmoji}>✈️</Text>
                            <Text style={styles.emptyTitle}>No trips yet</Text>
                            <Text style={styles.emptySubtitle}>Plan a trip and never forget to pack again</Text>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.emptyButton,
                                    pressed && { opacity: 0.7 },
                                ]}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    router.push('/add-trip');
                                }}
                            >
                                <Text style={styles.emptyButtonText}>Plan a Trip</Text>
                            </Pressable>
                        </View>
                    )}

                    {/* Active Trips */}
                    {activeTrips.length > 0 && (
                        <View style={styles.sectionContainer}>
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Active</Text>
                                {activeTrips.map((trip, i) => (
                                    <SwipeableRow
                                        key={trip.id}
                                        onDelete={() => {
                                            Alert.alert(
                                                'Delete Trip',
                                                `Are you sure you want to delete "${trip.name}"?`,
                                                [
                                                    { text: 'Cancel', style: 'cancel' },
                                                    {
                                                        text: 'Delete',
                                                        style: 'destructive',
                                                        onPress: () => deleteTrip(trip.id),
                                                    },
                                                ]
                                            );
                                        }}
                                    >
                                        <TripCard
                                            trip={trip}
                                            progress={getTripProgress(trip)}
                                            onPress={() => handleSelectTrip(trip.id)}
                                            isLast={i === activeTrips.length - 1}
                                        />
                                    </SwipeableRow>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Completed Trips */}
                    {completedTrips.length > 0 && (
                        <View style={styles.sectionContainer}>
                            <Pressable
                                style={styles.completedHeader}
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    setShowCompleted(!showCompleted);
                                }}
                            >
                                <Text style={styles.completedHeaderText}>
                                    Completed ({completedTrips.length})
                                </Text>
                                {showCompleted
                                    ? <ChevronUp size={18} color="#8E8E93" strokeWidth={2} />
                                    : <ChevronDown size={18} color="#8E8E93" strokeWidth={2} />
                                }
                            </Pressable>

                            {showCompleted && (
                                <View style={styles.section}>
                                    {completedTrips.map((trip, i) => (
                                        <SwipeableRow
                                            key={trip.id}
                                            onDelete={() => {
                                                Alert.alert(
                                                    'Delete Trip',
                                                    `Are you sure you want to delete "${trip.name}"?`,
                                                    [
                                                        { text: 'Cancel', style: 'cancel' },
                                                        {
                                                            text: 'Delete',
                                                            style: 'destructive',
                                                            onPress: () => deleteTrip(trip.id),
                                                        },
                                                    ]
                                                );
                                            }}
                                        >
                                            <CompletedTripRow
                                                trip={trip}
                                                onPress={() => handleSelectTrip(trip.id)}
                                                isLast={i === completedTrips.length - 1}
                                            />
                                        </SwipeableRow>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
            <BottomNavBar />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 120,
    },

    // List header
    listHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 20,
        gap: 12,
    },
    pageTitle: {
        flex: 1,
        fontSize: 34,
        fontWeight: '800',
        color: '#000',
        letterSpacing: -1,
    },
    backButton: {
        padding: 4,
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 20,
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButton: {
        padding: 4,
    },

    // Empty state
    emptyState: {
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 40,
    },
    emptyEmoji: {
        fontSize: 56,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#000',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 15,
        color: '#8E8E93',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 21,
    },
    emptyButton: {
        backgroundColor: '#000',
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 100,
    },
    emptyButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },

    // Sections
    sectionContainer: {
        marginHorizontal: 16,
        marginBottom: 24,
    },
    section: {
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 16,
        overflow: 'hidden',
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#000',
        letterSpacing: -0.4,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },

    // Trip card
    tripCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    tripIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    tripContent: {
        flex: 1,
    },
    tripTitleRow: {
        marginBottom: 6,
    },
    tripName: {
        fontSize: 17,
        fontWeight: '500',
        color: '#000',
        letterSpacing: -0.2,
    },
    destRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        marginTop: 2,
    },
    tripDest: {
        fontSize: 13,
        color: '#8E8E93',
    },
    countdownText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FF9500',
        marginTop: 2,
    },
    tripProgressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    progressBarContainer: {
        flex: 1,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(60,60,67,0.08)',
    },
    progressBarFill: {
        height: 4,
        borderRadius: 2,
    },
    tripProgressText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#8E8E93',
    },
    tripRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginLeft: 8,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    tripSeparator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        left: 64,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(60,60,67,0.1)',
    },

    // Completed section
    completedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 4,
    },
    completedHeaderText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#8E8E93',
    },

    // Detail nav
    detailNav: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 4,
        paddingBottom: 8,
    },
    navTextButton: {
        paddingVertical: 4,
        paddingHorizontal: 2,
    },
    navTextButtonLabel: {
        fontSize: 17,
        fontWeight: '400',
        color: '#007AFF',
    },
    detailScrollContent: {
        paddingBottom: 120,
        paddingHorizontal: 20,
    },

    // Hero card
    heroCard: {
        backgroundColor: 'rgba(255,255,255,0.85)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#000',
        letterSpacing: -0.6,
    },
    heroDestRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    heroDestText: {
        fontSize: 15,
        color: '#8E8E93',
        fontWeight: '400',
    },
    heroProgressWrap: {
        marginTop: 16,
    },
    heroProgressBar: {
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(60,60,67,0.08)',
    },
    heroProgressFill: {
        height: 6,
        borderRadius: 3,
        backgroundColor: '#007AFF',
    },
    heroStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    heroStatsText: {
        fontSize: 13,
        color: '#8E8E93',
        fontWeight: '500',
    },
    heroStatsPercent: {
        fontSize: 13,
        color: '#007AFF',
        fontWeight: '600',
    },
    heroBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: '#FF950012',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        gap: 5,
        marginTop: 12,
    },
    heroBadgeText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FF9500',
    },

    // Status button
    statusButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 15,
        borderRadius: 14,
        alignItems: 'center',
        marginBottom: 28,
    },
    statusButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#fff',
    },

    // Grouped section pattern
    groupedSection: {
        marginBottom: 28,
    },
    groupedSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 10,
    },
    groupedSectionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        flex: 1,
    },
    groupedSectionCount: {
        fontSize: 13,
        fontWeight: '500',
        color: '#8E8E93',
    },
    groupedCard: {
        backgroundColor: 'rgba(255,255,255,0.85)',
        borderRadius: 14,
        overflow: 'hidden',
    },
    inCardSep: {
        position: 'absolute',
        bottom: 0,
        left: 50,
        right: 0,
        height: StyleSheet.hairlineWidth,
        backgroundColor: 'rgba(60,60,67,0.12)',
    },
    inCardSepFull: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: 'rgba(60,60,67,0.12)',
    },

    // Checklist
    checklistRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 12,
    },
    checklistChecked: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#34C759',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checklistUnchecked: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#C7C7CC',
    },
    checklistText: {
        fontSize: 17,
        fontWeight: '400',
        color: '#000',
        flex: 1,
    },
    checklistTextDone: {
        textDecorationLine: 'line-through',
        color: '#8E8E93',
    },
    checklistAddRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 12,
    },
    checklistAddCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 1.5,
        borderColor: '#D1D1D6',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checklistAddInput: {
        flex: 1,
        fontSize: 17,
        color: '#000',
        paddingVertical: 0,
    },

    // Completed toggle
    completedToggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    completedToggleText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#8E8E93',
    },

    // Packing categories
    packingCategoryWrap: {
        marginBottom: 14,
    },
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
        paddingHorizontal: 2,
    },
    categoryDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    categoryLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
        flex: 1,
    },
    categoryCount: {
        fontSize: 13,
        fontWeight: '500',
        color: '#8E8E93',
    },
    itemsList: {
        borderRadius: 14,
        overflow: 'hidden',
    },

    // Budget
    budgetTotalLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: '#000',
    },
    expenseRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 10,
    },
    expenseDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    expenseDesc: {
        flex: 1,
        fontSize: 17,
        fontWeight: '400',
        color: '#000',
    },
    expenseCat: {
        fontSize: 12,
        color: '#8E8E93',
    },
    expenseAmt: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
    },
    expenseAddWrap: {
        padding: 14,
        gap: 10,
    },
    expenseInputRow: {
        flexDirection: 'row',
        gap: 8,
    },
    expenseInput: {
        backgroundColor: 'rgba(120,120,128,0.08)',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        color: '#000',
    },
    expenseCatRow: {
        gap: 6,
    },
    expenseCatChip: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 16,
        backgroundColor: 'rgba(120,120,128,0.06)',
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    expenseCatChipText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#8E8E93',
    },
    addExpenseButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 9,
        borderRadius: 10,
        alignItems: 'center',
    },
    addExpenseButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },

    // Action rows (iOS Settings style)
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 13,
        paddingHorizontal: 16,
        gap: 12,
    },
    actionRowText: {
        flex: 1,
        fontSize: 17,
        fontWeight: '400',
        color: '#007AFF',
    },
    actionRowTextDestructive: {
        flex: 1,
        fontSize: 17,
        fontWeight: '400',
        color: '#FF3B30',
        textAlign: 'center',
    },
});
