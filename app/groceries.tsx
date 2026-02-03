import React, { useState, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
    Plus,
    ShoppingCart,
    Package,
    ChevronRight,
    Sparkles,
    Check,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useGroceries } from '@/contexts/GroceryContext';
import { GroceryCard } from '@/components/GroceryCard';
import { BottomNavBar } from '@/components/BottomNavBar';
import { AmbientBackground } from '@/components/AmbientBackground';
import { CATEGORY_CONFIG, type GroceryCategory, type GroceryItem } from '@/types/grocery';

type ViewMode = 'pantry' | 'shopping';

export default function GroceriesScreen() {
    const router = useRouter();
    const {
        groceries,
        shoppingList,
        itemsByCategory,
        suggestedRestock,
        stats,
        toggleOnList,
        markPurchased,
        deleteItem,
        clearShoppingList,
    } = useGroceries();

    const [viewMode, setViewMode] = useState<ViewMode>(
        shoppingList.length > 0 ? 'shopping' : 'pantry'
    );

    const handleAddPress = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/add-grocery');
    }, [router]);

    const handleModeToggle = useCallback((mode: ViewMode) => {
        Haptics.selectionAsync();
        setViewMode(mode);
    }, []);

    const handleEdit = useCallback((item: GroceryItem) => {
        router.push(`/add-grocery?id=${item.id}`);
    }, [router]);

    const handleDoneShopping = useCallback(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        clearShoppingList();
        setViewMode('pantry');
    }, [clearShoppingList]);

    // Group shopping list by category for aisle-based display
    const shoppingListByCategory = useMemo(() => {
        const grouped: Partial<Record<GroceryCategory, GroceryItem[]>> = {};

        shoppingList.forEach(item => {
            if (!grouped[item.category]) {
                grouped[item.category] = [];
            }
            grouped[item.category]!.push(item);
        });

        return Object.entries(grouped)
            .sort(([a], [b]) =>
                CATEGORY_CONFIG[a as GroceryCategory].order - CATEGORY_CONFIG[b as GroceryCategory].order
            );
    }, [shoppingList]);

    // Non-empty categories for pantry view
    const nonEmptyCategories = useMemo(() => {
        return (Object.entries(itemsByCategory) as [GroceryCategory, GroceryItem[]][])
            .filter(([_, items]) => items.length > 0)
            .sort(([a], [b]) => CATEGORY_CONFIG[a].order - CATEGORY_CONFIG[b].order);
    }, [itemsByCategory]);

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
                    <View style={styles.pageHeader}>
                        <Text style={styles.subTitle}>YOUR KITCHEN</Text>
                        <Text style={styles.mainTitle}>Groceries</Text>
                    </View>

                    {/* Mode Toggle */}
                    <View style={styles.modeToggleContainer}>
                        <Pressable
                            style={[
                                styles.modeOption,
                                viewMode === 'pantry' && styles.modeOptionSelected,
                            ]}
                            onPress={() => handleModeToggle('pantry')}
                        >
                            <Package size={16} color={viewMode === 'pantry' ? '#000' : '#8E8E93'} />
                            <Text style={[
                                styles.modeOptionText,
                                viewMode === 'pantry' && styles.modeOptionTextSelected,
                            ]}>
                                Pantry
                            </Text>
                        </Pressable>
                        <Pressable
                            style={[
                                styles.modeOption,
                                viewMode === 'shopping' && styles.modeOptionSelected,
                            ]}
                            onPress={() => handleModeToggle('shopping')}
                        >
                            <ShoppingCart size={16} color={viewMode === 'shopping' ? '#000' : '#8E8E93'} />
                            <Text style={[
                                styles.modeOptionText,
                                viewMode === 'shopping' && styles.modeOptionTextSelected,
                            ]}>
                                Shopping
                            </Text>
                            {stats.onListCount > 0 && (
                                <View style={styles.countBadge}>
                                    <Text style={styles.countBadgeText}>{stats.onListCount}</Text>
                                </View>
                            )}
                        </Pressable>
                    </View>

                    {viewMode === 'shopping' ? (
                        /* Shopping Mode */
                        <>
                            {shoppingList.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <View style={styles.emptyIconContainer}>
                                        <ShoppingCart size={40} color="#C7C7CC" strokeWidth={1.5} />
                                    </View>
                                    <Text style={styles.emptyTitle}>Your list is empty</Text>
                                    <Text style={styles.emptySubtitle}>
                                        Tap items in your pantry to add them to your shopping list
                                    </Text>
                                </View>
                            ) : (
                                <>
                                    {/* Progress Bar */}
                                    <View style={styles.progressContainer}>
                                        <View style={styles.progressBar}>
                                            <View
                                                style={[
                                                    styles.progressFill,
                                                    { width: '0%' }, // Will fill as items are purchased
                                                ]}
                                            />
                                        </View>
                                        <Text style={styles.progressText}>
                                            {shoppingList.length} items to buy
                                        </Text>
                                    </View>

                                    {/* Shopping List by Category */}
                                    {shoppingListByCategory.map(([category, items]) => (
                                        <View key={category} style={styles.categorySection}>
                                            <View style={styles.categoryHeader}>
                                                <Text style={styles.categoryEmoji}>
                                                    {CATEGORY_CONFIG[category as GroceryCategory].emoji}
                                                </Text>
                                                <Text style={styles.categoryLabel}>
                                                    {CATEGORY_CONFIG[category as GroceryCategory].label}
                                                </Text>
                                            </View>
                                            <View style={styles.listContainer}>
                                                {items.map((item, index) => (
                                                    <GroceryCard
                                                        key={item.id}
                                                        item={item}
                                                        onToggleList={toggleOnList}
                                                        onMarkPurchased={markPurchased}
                                                        onDelete={deleteItem}
                                                        onEdit={handleEdit}
                                                        isShoppingMode
                                                        isFirst={index === 0}
                                                        isLast={index === items.length - 1}
                                                    />
                                                ))}
                                            </View>
                                        </View>
                                    ))}

                                    {/* Done Shopping Button */}
                                    <Pressable
                                        style={({ pressed }) => [
                                            styles.doneButton,
                                            pressed && { opacity: 0.8 },
                                        ]}
                                        onPress={handleDoneShopping}
                                    >
                                        <Check size={20} color="#fff" strokeWidth={2.5} />
                                        <Text style={styles.doneButtonText}>Done Shopping</Text>
                                    </Pressable>
                                </>
                            )}
                        </>
                    ) : (
                        /* Pantry Mode */
                        <>
                            {/* Suggested Restock */}
                            {suggestedRestock.length > 0 && (
                                <View style={styles.sectionContainer}>
                                    <View style={styles.sectionHeader}>
                                        <Sparkles size={18} color="#FF9500" />
                                        <Text style={styles.sectionLabel}>Suggested Restock</Text>
                                    </View>
                                    <View style={styles.listContainer}>
                                        {suggestedRestock.map((item, index) => (
                                            <GroceryCard
                                                key={item.id}
                                                item={item}
                                                onToggleList={toggleOnList}
                                                onMarkPurchased={markPurchased}
                                                onDelete={deleteItem}
                                                onEdit={handleEdit}
                                                isFirst={index === 0}
                                                isLast={index === suggestedRestock.length - 1}
                                            />
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* All Items by Category */}
                            {groceries.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <View style={styles.emptyIconContainer}>
                                        <Package size={40} color="#C7C7CC" strokeWidth={1.5} />
                                    </View>
                                    <Text style={styles.emptyTitle}>Your pantry is empty</Text>
                                    <Text style={styles.emptySubtitle}>
                                        Add items you regularly buy to build your pantry
                                    </Text>
                                    <Pressable
                                        style={styles.emptyAddButton}
                                        onPress={handleAddPress}
                                    >
                                        <Text style={styles.emptyAddText}>Add First Item</Text>
                                    </Pressable>
                                </View>
                            ) : (
                                nonEmptyCategories.map(([category, items]) => (
                                    <View key={category} style={styles.categorySection}>
                                        <View style={styles.categoryHeader}>
                                            <Text style={styles.categoryEmoji}>
                                                {CATEGORY_CONFIG[category].emoji}
                                            </Text>
                                            <Text style={styles.categoryLabel}>
                                                {CATEGORY_CONFIG[category].label}
                                            </Text>
                                            <Text style={styles.categoryCount}>
                                                {items.length}
                                            </Text>
                                        </View>
                                        <View style={styles.listContainer}>
                                            {items.map((item, index) => (
                                                <GroceryCard
                                                    key={item.id}
                                                    item={item}
                                                    onToggleList={toggleOnList}
                                                    onMarkPurchased={markPurchased}
                                                    onDelete={deleteItem}
                                                    onEdit={handleEdit}
                                                    isFirst={index === 0}
                                                    isLast={index === items.length - 1}
                                                />
                                            ))}
                                        </View>
                                    </View>
                                ))
                            )}
                        </>
                    )}
                </ScrollView>

                {/* FAB Add Button */}
                <Pressable
                    style={({ pressed }) => [
                        styles.fab,
                        pressed && { transform: [{ scale: 0.95 }] },
                    ]}
                    onPress={handleAddPress}
                >
                    <Plus size={24} color="#fff" strokeWidth={2.5} />
                </Pressable>
            </SafeAreaView>
            <BottomNavBar />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    safeArea: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 140,
    },
    pageHeader: {
        paddingHorizontal: 24,
        marginTop: 8,
        marginBottom: 20,
    },
    subTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#8E8E93',
        marginBottom: 4,
        letterSpacing: 0.8,
    },
    mainTitle: {
        fontSize: 34,
        fontWeight: '800',
        color: '#000',
        letterSpacing: -1,
    },
    modeToggleContainer: {
        flexDirection: 'row',
        marginHorizontal: 20,
        backgroundColor: '#E5E5EA',
        borderRadius: 99,
        padding: 4,
        marginBottom: 24,
    },
    modeOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 99,
        gap: 6,
    },
    modeOptionSelected: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    modeOptionText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#8E8E93',
    },
    modeOptionTextSelected: {
        color: '#000',
    },
    countBadge: {
        backgroundColor: '#FF3B30',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        minWidth: 20,
        alignItems: 'center',
    },
    countBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#fff',
    },
    sectionContainer: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    sectionLabel: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000',
    },
    categorySection: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    categoryEmoji: {
        fontSize: 18,
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
    listContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },
    progressContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    progressBar: {
        height: 4,
        backgroundColor: '#E5E5EA',
        borderRadius: 2,
        marginBottom: 8,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#34C759',
        borderRadius: 2,
    },
    progressText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#8E8E93',
        textAlign: 'center',
    },
    doneButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#34C759',
        marginHorizontal: 20,
        marginTop: 8,
        paddingVertical: 16,
        borderRadius: 14,
        gap: 8,
        shadowColor: '#34C759',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    doneButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#fff',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 32,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E5E5EA',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 15,
        color: '#8E8E93',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 20,
    },
    emptyAddButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#007AFF',
        borderRadius: 12,
    },
    emptyAddText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 100,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#007AFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
});
