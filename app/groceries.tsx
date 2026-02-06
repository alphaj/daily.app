import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import Animated, {
    FadeInDown,
    FadeOutRight,
    LinearTransition,
    useSharedValue,
    useAnimatedStyle,
    withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
    ShoppingCart,
    Package,
    Check,
    ChevronDown,
    ChevronUp,
    RotateCcw,
    Search,
    X,
} from 'lucide-react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useGroceries } from '@/contexts/GroceryContext';
import { GroceryCard } from '@/components/GroceryCard';
import { GroceryQuickAdd } from '@/components/GroceryQuickAdd';
import { GroceryIcon } from '@/components/GroceryIcon';
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
        purchasedThisSession,
        frequentItems,
        stats,
        toggleOnList,
        markPurchased,
        deleteItem,
        clearShoppingList,
        quickAddItem,
        undoPurchase,
        clearPurchasedItems,
    } = useGroceries();

    const [viewMode, setViewMode] = useState<ViewMode>(
        shoppingList.length > 0 ? 'shopping' : 'pantry'
    );
    const [isDoneSectionCollapsed, setIsDoneSectionCollapsed] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // --- Progress bar animation ---
    const purchasedCount = purchasedThisSession.length;
    const remainingCount = shoppingList.length;
    const totalCount = purchasedCount + remainingCount;
    const progressPercent = totalCount > 0 ? (purchasedCount / totalCount) * 100 : 0;

    const progressWidth = useSharedValue(0);

    useEffect(() => {
        progressWidth.value = withTiming(progressPercent, { duration: 400 });
    }, [progressPercent, progressWidth]);

    const progressAnimatedStyle = useAnimatedStyle(() => ({
        width: `${progressWidth.value}%`,
    }));

    const handleAddPress = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/add-grocery');
    }, [router]);

    const handleModeToggle = useCallback((mode: ViewMode) => {
        Haptics.selectionAsync();
        setViewMode(mode);
        setSearchQuery('');
    }, []);

    const handleEdit = useCallback((item: GroceryItem) => {
        router.push(`/add-grocery?id=${item.id}`);
    }, [router]);

    const handleDoneShopping = useCallback(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        clearShoppingList();
        setViewMode('pantry');
    }, [clearShoppingList]);

    const handleQuickAdd = useCallback((name: string) => {
        quickAddItem(name);
    }, [quickAddItem]);

    const handleAddSuggestion = useCallback((item: GroceryItem) => {
        toggleOnList(item.id);
    }, [toggleOnList]);

    const handleUndoPurchase = useCallback((id: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        undoPurchase(id);
    }, [undoPurchase]);

    const handleClearPurchased = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        clearPurchasedItems();
    }, [clearPurchasedItems]);

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

    // Pantry search results
    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return null;
        const q = searchQuery.toLowerCase();
        return groceries.filter(g =>
            g.name.toLowerCase().includes(q) ||
            (g.brand && g.brand.toLowerCase().includes(q)) ||
            (g.notes && g.notes.toLowerCase().includes(q)) ||
            CATEGORY_CONFIG[g.category].label.toLowerCase().includes(q)
        );
    }, [groceries, searchQuery]);

    // Progress text
    const progressText = useMemo(() => {
        if (progressPercent > 0) {
            return `${Math.round(progressPercent)}% done — ${remainingCount} left`;
        }
        return `${totalCount} items to buy`;
    }, [progressPercent, remainingCount, totalCount]);

    // Shopping mode has items if either active or purchased items exist
    const hasShoppingItems = shoppingList.length > 0 || purchasedThisSession.length > 0;

    return (
        <View style={styles.container}>
            <AmbientBackground />
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={0}
                >
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
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
                                {!hasShoppingItems ? (
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
                                                <Animated.View
                                                    style={[styles.progressFill, progressAnimatedStyle]}
                                                />
                                            </View>
                                            <Text style={styles.progressText}>
                                                {progressText}
                                            </Text>
                                        </View>

                                        {/* Shopping List by Category */}
                                        {shoppingListByCategory.map(([category, items]) => (
                                            <View key={category} style={styles.categorySection}>
                                                <View style={styles.sectionHeaderRow}>
                                                    <MaterialCommunityIcons
                                                        name={CATEGORY_CONFIG[category as GroceryCategory].icon as any}
                                                        size={14}
                                                        color="#6D6D72"
                                                    />
                                                    <Text style={styles.sectionHeaderText}>
                                                        {CATEGORY_CONFIG[category as GroceryCategory].label.toUpperCase()}
                                                    </Text>
                                                </View>
                                                <View style={styles.listContainer}>
                                                    {items.map((item, index) => (
                                                        <Animated.View
                                                            key={item.id}
                                                            entering={FadeInDown.delay(index * 50).duration(300)}
                                                            exiting={FadeOutRight.duration(250)}
                                                            layout={LinearTransition.springify().damping(18).stiffness(120)}
                                                        >
                                                            <GroceryCard
                                                                item={item}
                                                                onToggleList={toggleOnList}
                                                                onMarkPurchased={markPurchased}
                                                                onDelete={deleteItem}
                                                                onEdit={handleEdit}
                                                                isShoppingMode
                                                                isFirst={index === 0}
                                                                isLast={index === items.length - 1}
                                                            />
                                                        </Animated.View>
                                                    ))}
                                                </View>
                                            </View>
                                        ))}

                                        {/* Purchased "Done" Section */}
                                        {purchasedThisSession.length > 0 && (
                                            <View style={styles.doneSection}>
                                                <Pressable
                                                    style={styles.doneSectionHeader}
                                                    onPress={() => setIsDoneSectionCollapsed(prev => !prev)}
                                                >
                                                    <View style={styles.doneSectionLeft}>
                                                        <Text style={styles.doneSectionLabel}>
                                                            DONE ({purchasedThisSession.length})
                                                        </Text>
                                                        {isDoneSectionCollapsed
                                                            ? <ChevronDown size={14} color="#8E8E93" />
                                                            : <ChevronUp size={14} color="#8E8E93" />
                                                        }
                                                    </View>
                                                    <Pressable
                                                        onPress={handleClearPurchased}
                                                        hitSlop={8}
                                                    >
                                                        <Text style={styles.clearAllText}>Clear</Text>
                                                    </Pressable>
                                                </Pressable>

                                                {!isDoneSectionCollapsed && (
                                                    <View style={styles.doneListContainer}>
                                                        {purchasedThisSession.map((item, index) => (
                                                            <Animated.View
                                                                key={item.id}
                                                                entering={FadeInDown.delay(index * 30).duration(200)}
                                                                layout={LinearTransition.springify().damping(18).stiffness(120)}
                                                            >
                                                                <Pressable
                                                                    style={({ pressed }) => [
                                                                        styles.doneItem,
                                                                        pressed && { opacity: 0.5 },
                                                                        index === purchasedThisSession.length - 1 && styles.doneItemLast,
                                                                    ]}
                                                                    onPress={() => handleUndoPurchase(item.id)}
                                                                >
                                                                    <View style={styles.doneIconContainer}>
                                                                        <GroceryIcon
                                                                            name={item.name}
                                                                            category={item.category}
                                                                            size={16}
                                                                            color="#8E8E93"
                                                                        />
                                                                    </View>
                                                                    <Text style={styles.doneName} numberOfLines={1}>
                                                                        {item.name}
                                                                    </Text>
                                                                    <RotateCcw size={14} color="#C7C7CC" strokeWidth={2} />
                                                                    {index < purchasedThisSession.length - 1 && (
                                                                        <View style={styles.doneSeparator} />
                                                                    )}
                                                                </Pressable>
                                                            </Animated.View>
                                                        ))}
                                                    </View>
                                                )}
                                            </View>
                                        )}

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
                                {/* Search Bar */}
                                <View style={styles.searchContainer}>
                                    <View style={styles.searchBar}>
                                        <Search size={15} color="#8E8E93" />
                                        <TextInput
                                            style={styles.searchInput}
                                            placeholder="Search"
                                            placeholderTextColor="#8E8E93"
                                            value={searchQuery}
                                            onChangeText={setSearchQuery}
                                            returnKeyType="search"
                                            clearButtonMode="while-editing"
                                        />
                                        {searchQuery.length > 0 && Platform.OS !== 'ios' && (
                                            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                                                <X size={15} color="#8E8E93" />
                                            </Pressable>
                                        )}
                                    </View>
                                </View>

                                {searchQuery.trim().length > 0 ? (
                                    /* Search Results */
                                    searchResults && searchResults.length > 0 ? (
                                        <View style={styles.categorySection}>
                                            <View style={styles.listContainer}>
                                                {searchResults.map((item, index) => (
                                                    <Animated.View
                                                        key={item.id}
                                                        entering={FadeInDown.delay(index * 30).duration(200)}
                                                        layout={LinearTransition.springify().damping(18).stiffness(120)}
                                                    >
                                                        <GroceryCard
                                                            item={item}
                                                            onToggleList={toggleOnList}
                                                            onMarkPurchased={markPurchased}
                                                            onDelete={deleteItem}
                                                            onEdit={handleEdit}
                                                            isFirst={index === 0}
                                                            isLast={index === searchResults.length - 1}
                                                        />
                                                    </Animated.View>
                                                ))}
                                            </View>
                                        </View>
                                    ) : (
                                        <View style={styles.emptyState}>
                                            <Text style={styles.emptyTitle}>No items found</Text>
                                            <Text style={styles.emptySubtitle}>
                                                Try a different search term
                                            </Text>
                                        </View>
                                    )
                                ) : (
                                    <>
                                        {/* Suggested Restock */}
                                        {suggestedRestock.length > 0 && (
                                            <View style={styles.sectionContainer}>
                                                <Text style={[styles.sectionHeaderText, { color: '#FF9500' }]}>
                                                    SUGGESTED RESTOCK
                                                </Text>
                                                <View style={styles.listContainer}>
                                                    {suggestedRestock.map((item, index) => (
                                                        <Animated.View
                                                            key={item.id}
                                                            entering={FadeInDown.delay(index * 50).duration(300)}
                                                            exiting={FadeOutRight.duration(250)}
                                                            layout={LinearTransition.springify().damping(18).stiffness(120)}
                                                        >
                                                            <GroceryCard
                                                                item={item}
                                                                onToggleList={toggleOnList}
                                                                onMarkPurchased={markPurchased}
                                                                onDelete={deleteItem}
                                                                onEdit={handleEdit}
                                                                isFirst={index === 0}
                                                                isLast={index === suggestedRestock.length - 1}
                                                            />
                                                        </Animated.View>
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
                                                        <View style={styles.sectionHeaderRow}>
                                                            <MaterialCommunityIcons
                                                                name={CATEGORY_CONFIG[category].icon as any}
                                                                size={14}
                                                                color="#6D6D72"
                                                            />
                                                            <Text style={styles.sectionHeaderText}>
                                                                {CATEGORY_CONFIG[category].label.toUpperCase()}
                                                            </Text>
                                                        </View>
                                                        <Text style={styles.categoryCount}>
                                                            {items.length}
                                                        </Text>
                                                    </View>
                                                    <View style={styles.listContainer}>
                                                        {items.map((item, index) => (
                                                            <Animated.View
                                                                key={item.id}
                                                                entering={FadeInDown.delay(index * 50).duration(300)}
                                                                exiting={FadeOutRight.duration(250)}
                                                                layout={LinearTransition.springify().damping(18).stiffness(120)}
                                                            >
                                                                <GroceryCard
                                                                    item={item}
                                                                    onToggleList={toggleOnList}
                                                                    onMarkPurchased={markPurchased}
                                                                    onDelete={deleteItem}
                                                                    onEdit={handleEdit}
                                                                    isFirst={index === 0}
                                                                    isLast={index === items.length - 1}
                                                                />
                                                            </Animated.View>
                                                        ))}
                                                    </View>
                                                </View>
                                            ))
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </ScrollView>

                    {/* Quick Add Bar (replaces FAB) */}
                    <GroceryQuickAdd
                        onAddItem={handleQuickAdd}
                        suggestions={frequentItems}
                        onAddSuggestion={handleAddSuggestion}
                        onExpandPress={handleAddPress}
                    />
                </KeyboardAvoidingView>
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
        paddingBottom: 200,
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
        backgroundColor: 'rgba(118, 118, 128, 0.12)',
        borderRadius: 9,
        padding: 2,
        marginBottom: 20,
    },
    modeOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 7,
        borderRadius: 7,
        gap: 5,
    },
    modeOptionSelected: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius: 2,
        elevation: 2,
    },
    modeOptionText: {
        fontSize: 13,
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
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingLeft: 4,
        marginBottom: 7,
    },
    sectionHeaderText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6D6D72',
        letterSpacing: 0.5,
    },
    categorySection: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 7,
        paddingHorizontal: 4,
    },
    categoryCount: {
        fontSize: 13,
        fontWeight: '500',
        color: '#8E8E93',
    },
    listContainer: {
        backgroundColor: '#fff',
        borderRadius: 10,
        overflow: 'hidden',
    },
    progressContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    progressBar: {
        height: 6,
        backgroundColor: 'rgba(118, 118, 128, 0.12)',
        borderRadius: 3,
        marginBottom: 8,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#34C759',
        borderRadius: 3,
    },
    progressText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#8E8E93',
        textAlign: 'center',
    },
    // Done (purchased) section
    doneSection: {
        paddingHorizontal: 20,
        marginTop: 8,
        marginBottom: 12,
    },
    doneSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    doneSectionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    doneSectionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6D6D72',
        letterSpacing: 0.5,
    },
    clearAllText: {
        fontSize: 15,
        fontWeight: '400',
        color: '#007AFF',
    },
    doneListContainer: {
        backgroundColor: '#fff',
        borderRadius: 10,
        overflow: 'hidden',
    },
    doneItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 14,
        gap: 10,
        opacity: 0.6,
    },
    doneItemLast: {
        // no bottom border
    },
    doneIconContainer: {
        width: 28,
        height: 28,
        borderRadius: 7,
        backgroundColor: 'rgba(118, 118, 128, 0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    doneName: {
        flex: 1,
        fontSize: 17,
        fontWeight: '400',
        color: '#8E8E93',
        textDecorationLine: 'line-through',
    },
    doneSeparator: {
        position: 'absolute',
        bottom: 0,
        left: 48,
        right: 0,
        height: StyleSheet.hairlineWidth,
        backgroundColor: 'rgba(60, 60, 67, 0.12)',
    },
    doneButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#34C759',
        marginHorizontal: 20,
        marginTop: 12,
        paddingVertical: 14,
        borderRadius: 12,
        gap: 6,
    },
    doneButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#fff',
    },
    // Search
    searchContainer: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(118, 118, 128, 0.12)',
        borderRadius: 10,
        paddingHorizontal: 8,
        height: 36,
        gap: 6,
    },
    searchInput: {
        flex: 1,
        fontSize: 17,
        color: '#000',
        padding: 0,
        lineHeight: 22,
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
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#007AFF',
        borderRadius: 8,
    },
    emptyAddText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
});
