import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    TextInput,
    ActionSheetIOS,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
    Inbox,
    Pin,
    MessageCircle,
    Lightbulb,
    CheckCircle2,
    Bell,
    Clock,
    Plus,
    ChevronDown,
    ChevronRight,
    RotateCcw,
} from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';
import SwipeableRow from '@/components/SwipeableRow';
import { useInbox } from '@/contexts/InboxContext';
import { useTodos } from '@/contexts/TodoContext';
import { useHabits } from '@/contexts/HabitContext';
import { AmbientBackground } from '@/components/AmbientBackground';
import { BottomNavBar } from '@/components/BottomNavBar';
import type { InboxItem, InboxItemType } from '@/types/inbox';
import { TYPE_CONFIG } from '@/types/inbox';

const ICON_MAP: Record<string, React.ComponentType<any>> = {
    MessageCircle,
    Lightbulb,
    CheckCircle2,
    Bell,
    Clock,
};

function getIcon(name: string) {
    return ICON_MAP[name] || MessageCircle;
}

function DashboardTile({
    label,
    count,
    icon: IconComponent,
    color,
    isSelected,
    onPress,
}: {
    label: string;
    count: number;
    icon: React.ComponentType<any>;
    color: string;
    isSelected: boolean;
    onPress: () => void;
}) {
    return (
        <Pressable
            onPress={() => {
                Haptics.selectionAsync();
                onPress();
            }}
            style={[
                styles.tile,
                isSelected && { borderColor: color, borderWidth: 2 },
            ]}
        >
            <View style={[styles.tileIconCircle, { backgroundColor: color }]}>
                <IconComponent size={16} color="#fff" strokeWidth={2.5} />
            </View>
            <Text style={styles.tileCount}>{count}</Text>
            <Text style={styles.tileLabel}>{label}</Text>
        </Pressable>
    );
}

function ItemRow({
    item,
    onArchive,
    onDelete,
    onTogglePin,
    onConvertToTask,
    onConvertToHabit,
}: {
    item: InboxItem;
    onArchive: (id: string) => void;
    onDelete: (id: string) => void;
    onTogglePin: (id: string) => void;
    onConvertToTask: (id: string, content: string) => void;
    onConvertToHabit: (id: string, content: string) => void;
}) {
    const config = TYPE_CONFIG[item.type];
    const timeAgo = formatDistanceToNow(new Date(item.createdAt), { addSuffix: true });

    const handleLongPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        ActionSheetIOS.showActionSheetWithOptions(
            {
                options: [
                    'Convert to Task',
                    'Convert to Habit',
                    'Archive',
                    item.isPinned ? 'Unpin' : 'Pin',
                    'Delete',
                    'Cancel',
                ],
                destructiveButtonIndex: 4,
                cancelButtonIndex: 5,
            },
            (buttonIndex) => {
                switch (buttonIndex) {
                    case 0:
                        onConvertToTask(item.id, item.content);
                        break;
                    case 1:
                        onConvertToHabit(item.id, item.content);
                        break;
                    case 2:
                        onArchive(item.id);
                        break;
                    case 3:
                        onTogglePin(item.id);
                        break;
                    case 4:
                        onDelete(item.id);
                        break;
                }
            },
        );
    };

    return (
        <SwipeableRow
            onDelete={() => onDelete(item.id)}
            onConvertToTask={() => onConvertToTask(item.id, item.content)}
            onConvertToHabit={() => onConvertToHabit(item.id, item.content)}
        >
            <Pressable
                onLongPress={handleLongPress}
                style={styles.itemRow}
            >
                <Pressable
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onArchive(item.id);
                    }}
                    hitSlop={8}
                >
                    <View style={[styles.radioCircle, { borderColor: config.color }]} />
                </Pressable>
                <View style={styles.itemContent}>
                    <Text style={styles.itemText} numberOfLines={2}>
                        {item.content}
                    </Text>
                </View>
                {item.isPinned && (
                    <Pin size={13} color="#FF9500" strokeWidth={2.5} style={styles.pinIcon} />
                )}
                <Text style={styles.itemTime}>{timeAgo}</Text>
            </Pressable>
        </SwipeableRow>
    );
}

export default function InboxScreen() {
    const {
        items,
        archivedItems,
        addItem,
        deleteItem,
        togglePin,
        archiveItem,
        restoreItem,
        getPinnedItems,
    } = useInbox();
    const { addTodo } = useTodos();
    const { addHabit } = useHabits();
    const [inputText, setInputText] = useState('');
    const [selectedType, setSelectedType] = useState<InboxItemType | null>(null);
    const [showCompleted, setShowCompleted] = useState(false);
    const inputRef = useRef<TextInput>(null);

    const pinnedItems = getPinnedItems();

    const handleAddPress = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        inputRef.current?.focus();
    }, []);

    const handleSubmit = useCallback(() => {
        if (inputText.trim()) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            addItem(inputText, selectedType || undefined);
            setInputText('');
            setSelectedType(null);
        }
    }, [inputText, selectedType, addItem]);

    const handleConvertToTask = useCallback((id: string, content: string) => {
        addTodo(content);
        archiveItem(id);
    }, [addTodo, archiveItem]);

    const handleConvertToHabit = useCallback((id: string, content: string) => {
        addHabit(content);
        archiveItem(id);
    }, [addHabit, archiveItem]);

    const activeItems = useMemo(
        () => items.filter((i) => !i.isArchived),
        [items],
    );

    const typeCounts = useMemo(() => {
        const counts: Partial<Record<InboxItemType, number>> = {};
        for (const item of activeItems) {
            counts[item.type] = (counts[item.type] || 0) + 1;
        }
        return counts;
    }, [activeItems]);

    const activeTypes = useMemo(
        () =>
            (Object.keys(TYPE_CONFIG) as InboxItemType[]).filter(
                (t) => (typeCounts[t] || 0) > 0,
            ),
        [typeCounts],
    );

    const filteredItems = useMemo(
        () =>
            selectedType
                ? activeItems.filter((i) => i.type === selectedType)
                : activeItems,
        [activeItems, selectedType],
    );

    return (
        <View style={styles.root}>
            <AmbientBackground />
            <SafeAreaView style={styles.container} edges={['top']}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.flex}
                >
                    <ScrollView
                        style={styles.scroll}
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                        keyboardDismissMode="interactive"
                    >
                        {/* Title */}
                        <Animated.Text
                            entering={FadeInDown.duration(400).delay(50)}
                            style={styles.title}
                        >
                            Inbox
                        </Animated.Text>

                        {/* Dashboard Grid */}
                        <Animated.View
                            entering={FadeInDown.duration(400).delay(100)}
                            style={styles.dashboardGrid}
                        >
                            <DashboardTile
                                label="All"
                                count={activeItems.length}
                                icon={Inbox}
                                color="#007AFF"
                                isSelected={selectedType === null}
                                onPress={() => setSelectedType(null)}
                            />
                            <DashboardTile
                                label="Pinned"
                                count={pinnedItems.length}
                                icon={Pin}
                                color="#FF9500"
                                isSelected={false}
                                onPress={() => setSelectedType(null)}
                            />
                            {activeTypes.map((type) => {
                                const cfg = TYPE_CONFIG[type];
                                const Icon = getIcon(cfg.icon);
                                return (
                                    <DashboardTile
                                        key={type}
                                        label={cfg.label}
                                        count={typeCounts[type] || 0}
                                        icon={Icon}
                                        color={cfg.color}
                                        isSelected={selectedType === type}
                                        onPress={() =>
                                            setSelectedType(selectedType === type ? null : type)
                                        }
                                    />
                                );
                            })}
                        </Animated.View>

                        {/* Inline New Item Row */}
                        <Animated.View
                            entering={FadeInDown.duration(400).delay(150)}
                            style={styles.newItemRow}
                        >
                            <View style={styles.newItemCircle}>
                                <Plus size={14} color="#8E8E93" strokeWidth={2.5} />
                            </View>
                            <TextInput
                                ref={inputRef}
                                style={styles.newItemInput}
                                placeholder="New Item"
                                placeholderTextColor="#C7C7CC"
                                value={inputText}
                                onChangeText={setInputText}
                                onSubmitEditing={handleSubmit}
                                returnKeyType="done"
                                blurOnSubmit={false}
                            />
                        </Animated.View>

                        {/* Item List */}
                        {filteredItems.length === 0 && (
                            <Animated.View
                                entering={FadeInDown.duration(400).delay(200)}
                                style={styles.emptyState}
                            >
                                <Inbox size={48} color="#C7C7CC" strokeWidth={1.5} />
                                <Text style={styles.emptyTitle}>No Items</Text>
                                <Text style={styles.emptySubtitle}>
                                    Tap + to add a new item
                                </Text>
                            </Animated.View>
                        )}

                        {filteredItems.map((item, index) => (
                            <Animated.View
                                key={item.id}
                                entering={FadeInDown.duration(300).delay(180 + index * 40)}
                            >
                                <ItemRow
                                    item={item}
                                    onArchive={archiveItem}
                                    onDelete={deleteItem}
                                    onTogglePin={togglePin}
                                    onConvertToTask={handleConvertToTask}
                                    onConvertToHabit={handleConvertToHabit}
                                />
                                {index < filteredItems.length - 1 && (
                                    <View style={styles.separator} />
                                )}
                            </Animated.View>
                        ))}

                        {/* Completed / Archive Section */}
                        {archivedItems.length > 0 && (
                            <Animated.View
                                entering={FadeInDown.duration(400).delay(250)}
                            >
                                <Pressable
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setShowCompleted(!showCompleted);
                                    }}
                                    style={styles.completedHeader}
                                >
                                    {showCompleted ? (
                                        <ChevronDown size={18} color="#8E8E93" strokeWidth={2} />
                                    ) : (
                                        <ChevronRight size={18} color="#8E8E93" strokeWidth={2} />
                                    )}
                                    <Text style={styles.completedTitle}>Completed</Text>
                                    <Text style={styles.completedCount}>
                                        {archivedItems.length}
                                    </Text>
                                </Pressable>

                                {showCompleted &&
                                    archivedItems.map((item, index) => (
                                        <Animated.View
                                            key={item.id}
                                            entering={FadeInDown.duration(250).delay(index * 30)}
                                            style={styles.archivedRow}
                                        >
                                            <View
                                                style={[
                                                    styles.radioCircleFilled,
                                                    { backgroundColor: TYPE_CONFIG[item.type].color },
                                                ]}
                                            >
                                                <CheckCircle2 size={14} color="#fff" strokeWidth={2.5} />
                                            </View>
                                            <Text style={styles.archivedText} numberOfLines={1}>
                                                {item.content}
                                            </Text>
                                            <Pressable
                                                onPress={() => {
                                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                    restoreItem(item.id);
                                                }}
                                                hitSlop={8}
                                                style={styles.restoreButton}
                                            >
                                                <RotateCcw size={15} color="#007AFF" strokeWidth={2} />
                                            </Pressable>
                                            {index < archivedItems.length - 1 && (
                                                <View style={styles.separatorArchived} />
                                            )}
                                        </Animated.View>
                                    ))}
                            </Animated.View>
                        )}
                    </ScrollView>

                    <BottomNavBar onFabPress={handleAddPress} />
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    flex: {
        flex: 1,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 120,
    },
    title: {
        fontSize: 34,
        fontWeight: '800',
        color: '#000',
        letterSpacing: -0.5,
        marginTop: 8,
        marginBottom: 16,
    },

    // Dashboard Grid
    dashboardGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 24,
    },
    tile: {
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 16,
        padding: 12,
        minWidth: '47%',
        flexGrow: 1,
        flexBasis: '47%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    tileIconCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    tileCount: {
        fontSize: 28,
        fontWeight: '700',
        color: '#000',
        letterSpacing: -0.5,
        lineHeight: 32,
    },
    tileLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: '#8E8E93',
        marginTop: 2,
    },

    // New Item Row
    newItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 4,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(0,0,0,0.1)',
        marginBottom: 4,
    },
    newItemCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#C7C7CC',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    newItemInput: {
        flex: 1,
        fontSize: 17,
        color: '#000',
        padding: 0,
    },

    // Item Row
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 13,
        paddingHorizontal: 4,
        backgroundColor: 'transparent',
    },
    radioCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        marginRight: 12,
    },
    itemContent: {
        flex: 1,
        marginRight: 8,
    },
    itemText: {
        fontSize: 17,
        fontWeight: '400',
        color: '#000',
        lineHeight: 22,
    },
    pinIcon: {
        marginRight: 6,
    },
    itemTime: {
        fontSize: 13,
        color: '#8E8E93',
        fontWeight: '400',
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: 'rgba(0,0,0,0.1)',
        marginLeft: 40,
    },

    // Empty State
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#8E8E93',
        marginTop: 12,
    },
    emptySubtitle: {
        fontSize: 15,
        color: '#C7C7CC',
        marginTop: 4,
    },

    // Completed Section
    completedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        marginTop: 16,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(0,0,0,0.1)',
    },
    completedTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#8E8E93',
        marginLeft: 6,
        flex: 1,
    },
    completedCount: {
        fontSize: 15,
        fontWeight: '500',
        color: '#C7C7CC',
    },
    archivedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 4,
    },
    radioCircleFilled: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    archivedText: {
        flex: 1,
        fontSize: 16,
        color: '#8E8E93',
        textDecorationLine: 'line-through',
    },
    restoreButton: {
        padding: 4,
        marginLeft: 8,
    },
    separatorArchived: {
        position: 'absolute',
        bottom: 0,
        left: 40,
        right: 0,
        height: StyleSheet.hairlineWidth,
        backgroundColor: 'rgba(0,0,0,0.08)',
    },
});
