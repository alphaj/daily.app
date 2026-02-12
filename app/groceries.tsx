import React, { useState, useMemo, useCallback } from 'react';
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
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
    ShoppingCart,
    Check,
    ChevronDown,
    ChevronUp,
    RotateCcw,
    Search,
    X,
    CheckCircle2,
    Clock,
    Plus,
} from 'lucide-react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useGroceries } from '@/contexts/GroceryContext';
import { GroceryCard } from '@/components/GroceryCard';
import { GroceryQuickAdd } from '@/components/GroceryQuickAdd';
import { BottomNavBar } from '@/components/BottomNavBar';
import { AmbientBackground } from '@/components/AmbientBackground';
import { CATEGORY_CONFIG, type GroceryCategory, type GroceryItem } from '@/types/grocery';

type ViewMode = 'list' | 'items';

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
        shoppingList.length > 0 ? 'list' : 'items'
    );
    const [isCheckedOffCollapsed, setIsCheckedOffCollapsed] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

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

    const handleClearList = useCallback(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        clearShoppingList();
        setViewMode('items');
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

    // Shopping mode has items if either active or purchased items exist
    const hasShoppingItems = shoppingList.length > 0 || purchasedThisSession.length > 0;

    // All items checked off = completion state
    const isAllDone = shoppingList.length === 0 && purchasedThisSession.length > 0;

    // Dynamic title
    const pageTitle = viewMode === 'list' ? 'Shopping' : 'My Items';

    // Frequent items not currently on list (for suggestions)
    const availableSuggestions = useMemo(() => {
        return frequentItems.filter(item => !item.isOnList);
    }, [frequentItems]);

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
                            <Text style={styles.mainTitle}>{pageTitle}</Text>
                        </View>

                        {/* Segmented Control */}
                        <View style={styles.modeToggleContainer}>
                            <Pressable
                                style={[
                                    styles.modeOption,
                                    viewMode === 'list' && styles.modeOptionSelected,
                                ]}
                                onPress={() => handleModeToggle('list')}
                            >
                                <Text style={[
                                    styles.modeOptionText,
                                    viewMode === 'list' && styles.modeOptionTextSelected,
                                ]}>
                                    List
                                </Text>
                                {stats.onListCount > 0 && (
                                    <View style={styles.countBadge}>
                                        <Text style={styles.countBadgeText}>{stats.onListCount}</Text>
                                    </View>
                                )}
                            </Pressable>
                            <Pressable
                                style={[
                                    styles.modeOption,
                                    viewMode === 'items' && styles.modeOptionSelected,
                                ]}
                                onPress={() => handleModeToggle('items')}
                            >
                                <Text style={[
                                    styles.modeOptionText,
                                    viewMode === 'items' && styles.modeOptionTextSelected,
                                ]}>
                                    Items
                                </Text>
                            </Pressable>
                        </View>

                        {viewMode === 'list' ? (
                            /* ======== LIST (SHOPPING) MODE ======== */
                            <>
                                {!hasShoppingItems ? (
                                    <View style={styles.emptyState}>
                                        <View style={styles.emptyIconContainer}>
                                            <ShoppingCart size={40} color="#C7C7CC" strokeWidth={1.5} />
                                        </View>
                                        <Text style={styles.emptyTitle}>Your list is empty</Text>
                                        <Text style={styles.emptySubtitle}>
                                            Switch to Items and tap to add things to your list
                                        </Text>
                                    </View>
                                ) : isAllDone ? (
                                    /* Completion state */
                                    <Animated.View
                                        entering={FadeInDown.duration(400).delay(300)}
                                        style={styles.completionState}
                                    >
                                        <View style={styles.completionIcon}>
                                            <CheckCircle2 size={48} color="#34C759" strokeWidth={1.5} />
                                        </View>
                                        <Text style={styles.completionTitle}>All done</Text>
                                        <Text style={styles.completionSubtitle}>
                                            You got everything on your list
                                        </Text>
                                        <Pressable
                                            style={({ pressed }) => [
                                                styles.clearListButton,
                                                pressed && { opacity: 0.7 },
                                            ]}
                                            onPress={handleClearList}
                                        >
                                            <Text style={styles.clearListText}>Clear List</Text>
                                        </Pressable>
                                    </Animated.View>
                                ) : (
                                    <>
                                        {/* Flat shopping list (no category grouping) */}
                                        <View style={styles.listSection}>
                                            <Text style={styles.listCount}>
                                                {shoppingList.length} item{shoppingList.length !== 1 ? 's' : ''} left
                                            </Text>
                                            <View style={styles.listContainer}>
                                                {shoppingList.map((item, index) => (
                                                    <Animated.View
                                                        key={item.id}
                                                        entering={FadeInDown.delay(index * 40).duration(250)}
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
                                                            isLast={index === shoppingList.length - 1}
                                                        />
                                                    </Animated.View>
                                                ))}
                                            </View>
                                        </View>

                                        {/* Inline add row */}
                                        <View style={styles.inlineAddSection}>
                                            <GroceryQuickAdd
                                                onAddItem={handleQuickAdd}
                                                suggestions={availableSuggestions}
                                                onAddSuggestion={handleAddSuggestion}
                                                onExpandPress={handleAddPress}
                                            />
                                        </View>
                                    </>
                                )}

                                {/* Checked Off section */}
                                {purchasedThisSession.length > 0 && !isAllDone && (
                                    <View style={styles.checkedOffSection}>
                                        <Pressable
                                            style={styles.checkedOffHeader}
                                            onPress={() => setIsCheckedOffCollapsed(prev => !prev)}
                                        >
                                            <Text style={styles.checkedOffLabel}>
                                                CHECKED OFF
                                            </Text>
                                            <View style={styles.checkedOffRight}>
                                                <Text style={styles.checkedOffCount}>
                                                    {purchasedThisSession.length}
                                                </Text>
                                                {isCheckedOffCollapsed
                                                    ? <ChevronDown size={14} color="#8E8E93" />
                                                    : <ChevronUp size={14} color="#8E8E93" />
                                                }
                                            </View>
                                        </Pressable>

                                        {!isCheckedOffCollapsed && (
                                            <View style={styles.checkedOffList}>
                                                {purchasedThisSession.map((item, index) => (
                                                    <Animated.View
                                                        key={item.id}
                                                        entering={FadeInDown.delay(index * 30).duration(200)}
                                                        layout={LinearTransition.springify().damping(18).stiffness(120)}
                                                    >
                                                        <Pressable
                                                            style={({ pressed }) => [
                                                                styles.checkedOffItem,
                                                                pressed && { opacity: 0.4 },
                                                            ]}
                                                            onPress={() => handleUndoPurchase(item.id)}
                                                        >
                                                            <View style={styles.checkedCircle}>
                                                                <Check size={12} color="#fff" strokeWidth={3} />
                                                            </View>
                                                            <Text style={styles.checkedOffName} numberOfLines={1}>
                                                                {item.name}
                                                            </Text>
                                                            <RotateCcw size={14} color="#C7C7CC" strokeWidth={2} />
                                                            {index < purchasedThisSession.length - 1 && (
                                                                <View style={styles.checkedOffSeparator} />
                                                            )}
                                                        </Pressable>
                                                    </Animated.View>
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                )}
                            </>
                        ) : (
                            /* ======== ITEMS (PANTRY) MODE ======== */
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
                                        {/* Restock Suggestions (horizontal chips) */}
                                        {suggestedRestock.length > 0 && (
                                            <View style={styles.restockSection}>
                                                <View style={styles.restockHeader}>
                                                    <Clock size={12} color="#FF9500" strokeWidth={2.5} />
                                                    <Text style={styles.restockLabel}>RESTOCK</Text>
                                                </View>
                                                <ScrollView
                                                    horizontal
                                                    showsHorizontalScrollIndicator={false}
                                                    contentContainerStyle={styles.restockChipsContent}
                                                    style={styles.restockChipsRow}
                                                >
                                                    {suggestedRestock.map(item => (
                                                        <Animated.View
                                                            key={item.id}
                                                            exiting={FadeOutRight.duration(200)}
                                                            layout={LinearTransition.springify().damping(18).stiffness(120)}
                                                        >
                                                            <Pressable
                                                                style={({ pressed }) => [
                                                                    styles.restockChip,
                                                                    pressed && { opacity: 0.7 },
                                                                ]}
                                                                onPress={() => handleAddSuggestion(item)}
                                                            >
                                                                <Text style={styles.restockChipText} numberOfLines={1}>
                                                                    {item.name}
                                                                </Text>
                                                                <Plus size={13} color="#007AFF" strokeWidth={2.5} />
                                                            </Pressable>
                                                        </Animated.View>
                                                    ))}
                                                </ScrollView>
                                            </View>
                                        )}

                                        {/* All Items by Category */}
                                        {groceries.length === 0 ? (
                                            <View style={styles.emptyState}>
                                                <View style={styles.emptyIconContainer}>
                                                    <ShoppingCart size={40} color="#C7C7CC" strokeWidth={1.5} />
                                                </View>
                                                <Text style={styles.emptyTitle}>No items yet</Text>
                                                <Text style={styles.emptySubtitle}>
                                                    Add items you regularly buy to build your list
                                                </Text>
                                                <Pressable
                                                    style={({ pressed }) => [
                                                        styles.emptyAddButton,
                                                        pressed && { opacity: 0.8 },
                                                    ]}
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
                                                                entering={FadeInDown.delay(index * 40).duration(250)}
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
        paddingBottom: 120,
    },
    // --- Header ---
    pageHeader: {
        paddingHorizontal: 24,
        marginTop: 8,
        marginBottom: 20,
    },
    mainTitle: {
        fontSize: 34,
        fontWeight: '800',
        color: '#000',
        letterSpacing: -1,
    },
    // --- Segmented Control ---
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
    // --- Shopping list ---
    listSection: {
        paddingHorizontal: 20,
        marginBottom: 4,
    },
    listCount: {
        fontSize: 13,
        fontWeight: '500',
        color: '#8E8E93',
        marginBottom: 8,
        paddingLeft: 4,
    },
    listContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
    },
    // --- Inline add ---
    inlineAddSection: {
        paddingHorizontal: 20,
        marginTop: 8,
        marginBottom: 8,
    },
    // --- Checked Off section ---
    checkedOffSection: {
        paddingHorizontal: 20,
        marginTop: 12,
        marginBottom: 12,
    },
    checkedOffHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
        paddingHorizontal: 4,
    },
    checkedOffLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
        letterSpacing: 0.5,
    },
    checkedOffRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    checkedOffCount: {
        fontSize: 13,
        fontWeight: '500',
        color: '#8E8E93',
    },
    checkedOffList: {
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
    },
    checkedOffItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 12,
        opacity: 0.5,
    },
    checkedCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#34C759',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkedOffName: {
        flex: 1,
        fontSize: 17,
        fontWeight: '400',
        color: '#8E8E93',
        textDecorationLine: 'line-through',
    },
    checkedOffSeparator: {
        position: 'absolute',
        bottom: 0,
        left: 46,
        right: 0,
        height: StyleSheet.hairlineWidth,
        backgroundColor: 'rgba(60, 60, 67, 0.12)',
    },
    // --- Completion state ---
    completionState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        paddingHorizontal: 32,
    },
    completionIcon: {
        marginBottom: 16,
    },
    completionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000',
        marginBottom: 6,
    },
    completionSubtitle: {
        fontSize: 15,
        color: '#8E8E93',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    clearListButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    clearListText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#007AFF',
    },
    // --- Search ---
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
    // --- Restock chips ---
    restockSection: {
        paddingLeft: 20,
        marginBottom: 20,
    },
    restockHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingLeft: 4,
        marginBottom: 10,
    },
    restockLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FF9500',
        letterSpacing: 0.5,
    },
    restockChipsRow: {
        maxHeight: 40,
    },
    restockChipsContent: {
        gap: 8,
        paddingRight: 20,
    },
    restockChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
    },
    restockChipText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#000',
    },
    // --- Category sections (pantry) ---
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
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    sectionHeaderText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6D6D72',
        letterSpacing: 0.5,
    },
    categoryCount: {
        fontSize: 13,
        fontWeight: '500',
        color: '#8E8E93',
    },
    // --- Empty states ---
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
        backgroundColor: '#000',
        borderRadius: 100,
    },
    emptyAddText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
});
