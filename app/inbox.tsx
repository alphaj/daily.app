import { useRouter } from 'expo-router';
import {
    Pin,
    MessageCircle,
    Lightbulb,
    Bell,
    CheckCircle2,
    Clock,
    Send,
    Trash2,
    Inbox as InboxIcon,
    Archive,
    RotateCcw,
    ArrowLeft,
    ChevronRight,
} from 'lucide-react-native';
import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ActionSheetIOS,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeOutRight, LinearTransition } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useInbox } from '@/contexts/InboxContext';
import { useTodos } from '@/contexts/TodoContext';
import { useHabits } from '@/contexts/HabitContext';
import { TYPE_CONFIG, type InboxItem } from '@/types/inbox';
import { formatDistanceToNow } from 'date-fns';
import { BottomNavBar } from '@/components/BottomNavBar';
import { AmbientBackground } from '@/components/AmbientBackground';
import SwipeableRow from '@/components/SwipeableRow';

const ICON_MAP: Record<string, any> = {
    MessageCircle,
    Lightbulb,
    Bell,
    CheckCircle2,
    Clock,
};

function InboxItemCard({
    item,
    onDelete,
    onTogglePin,
    onArchive,
    onConvertToTask,
    onConvertToHabit,
    isLast,
}: {
    item: InboxItem;
    onDelete: (id: string) => void;
    onTogglePin: (id: string) => void;
    onArchive: (id: string) => void;
    onConvertToTask: (id: string, content: string) => void;
    onConvertToHabit: (id: string, content: string) => void;
    isLast?: boolean;
}) {
    const config = TYPE_CONFIG[item.type];
    const IconComponent = ICON_MAP[config.icon] || MessageCircle;

    const timeAgo = formatDistanceToNow(new Date(item.createdAt), { addSuffix: false });
    const formattedTime = timeAgo
        .replace('about ', '')
        .replace(' days', 'd')
        .replace(' day', 'd')
        .replace(' hours', 'h')
        .replace(' hour', 'h')
        .replace(' minutes', 'm')
        .replace(' minute', 'm');

    const handleDelete = useCallback(() => {
        onDelete(item.id);
    }, [item.id, onDelete]);

    const handleConvertToTask = useCallback(() => {
        onConvertToTask(item.id, item.content);
    }, [item.id, item.content, onConvertToTask]);

    const handleConvertToHabit = useCallback(() => {
        onConvertToHabit(item.id, item.content);
    }, [item.id, item.content, onConvertToHabit]);

    const handleLongPress = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const options = [
            'Convert to Task',
            'Convert to Habit',
            'Archive',
            item.isPinned ? 'Unpin' : 'Pin',
            'Delete',
            'Cancel',
        ];
        ActionSheetIOS.showActionSheetWithOptions(
            {
                options,
                destructiveButtonIndex: 4,
                cancelButtonIndex: 5,
                title: item.content,
            },
            (buttonIndex) => {
                if (buttonIndex === 0) handleConvertToTask();
                else if (buttonIndex === 1) handleConvertToHabit();
                else if (buttonIndex === 2) onArchive(item.id);
                else if (buttonIndex === 3) onTogglePin(item.id);
                else if (buttonIndex === 4) handleDelete();
            }
        );
    }, [item, handleConvertToTask, handleConvertToHabit, handleDelete, onTogglePin, onArchive]);

    return (
        <SwipeableRow
            onDelete={handleDelete}
            onConvertToTask={handleConvertToTask}
            onConvertToHabit={handleConvertToHabit}
        >
            <Pressable
                style={styles.inboxItem}
                onLongPress={handleLongPress}
                delayLongPress={300}
            >
                <IconComponent size={20} color={config.color} strokeWidth={2} />
                <View style={styles.itemContent}>
                    <Text style={styles.itemText} numberOfLines={2}>{item.content}</Text>
                    <Text style={styles.itemMeta}>
                        {config.label} · {formattedTime}
                    </Text>
                </View>
                {item.isPinned && (
                    <Pin size={12} color="#FF9500" strokeWidth={2.5} fill="#FF9500" />
                )}
                {!isLast && <View style={styles.separator} />}
            </Pressable>
        </SwipeableRow>
    );
}

function ArchivedRow({
    item,
    onRestore,
    onDelete,
    isLast,
}: {
    item: InboxItem;
    onRestore: (id: string) => void;
    onDelete: (id: string) => void;
    isLast?: boolean;
}) {
    const config = TYPE_CONFIG[item.type];
    const IconComponent = ICON_MAP[config.icon] || MessageCircle;

    return (
        <View style={styles.archivedRow}>
            <View style={styles.archivedContent}>
                <IconComponent size={16} color="#8E8E93" strokeWidth={2} />
                <Text style={styles.archivedTitle} numberOfLines={1}>
                    {item.content}
                </Text>
            </View>
            <View style={styles.archivedActions}>
                <Pressable
                    style={styles.archivedAction}
                    onPress={() => {
                        Haptics.selectionAsync();
                        onRestore(item.id);
                    }}
                    hitSlop={10}
                >
                    <RotateCcw size={16} color="#007AFF" strokeWidth={2} />
                </Pressable>
                <Pressable
                    style={styles.archivedAction}
                    onPress={() => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                        Alert.alert('Delete Item', 'This will permanently remove this item.', [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Delete', style: 'destructive', onPress: () => onDelete(item.id) },
                        ]);
                    }}
                    hitSlop={10}
                >
                    <Trash2 size={16} color="#FF3B30" strokeWidth={2} />
                </Pressable>
            </View>
            {!isLast && <View style={styles.archivedSeparator} />}
        </View>
    );
}

export default function InboxScreen() {
    const router = useRouter();
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
    const [showArchive, setShowArchive] = useState(false);
    const inputRef = useRef<TextInput>(null);

    const pinnedItems = getPinnedItems();
    const unpinnedItems = items.filter((item) => !item.isPinned);

    const handleAddPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        inputRef.current?.focus();
    };

    const handleSubmit = () => {
        if (inputText.trim()) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            addItem(inputText);
            setInputText('');
        }
    };

    const handleConvertToTask = (id: string, content: string) => {
        addTodo(content);
        archiveItem(id);
    };

    const handleConvertToHabit = (id: string, content: string) => {
        addHabit(content);
        archiveItem(id);
    };

    return (
        <View style={styles.root}>
            <AmbientBackground />
            <SafeAreaView style={styles.container} edges={['top']}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.flex}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Pressable
                            style={styles.backButton}
                            onPress={() => router.back()}
                            hitSlop={20}
                        >
                            <ArrowLeft size={20} color="#000" strokeWidth={2.5} />
                        </Pressable>
                        <Text style={styles.headerTitle}>Inbox</Text>
                        <View style={styles.headerRight} />
                    </View>

                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="interactive"
                    >
                        {/* Input */}
                        <View style={styles.inputSection}>
                            <View style={styles.inputRow}>
                                <TextInput
                                    ref={inputRef}
                                    style={styles.input}
                                    placeholder="What's on your mind?"
                                    placeholderTextColor="#8E8E93"
                                    value={inputText}
                                    onChangeText={setInputText}
                                    onSubmitEditing={handleSubmit}
                                    returnKeyType="done"
                                    blurOnSubmit={false}
                                    multiline
                                />
                                {inputText.trim().length > 0 && (
                                    <Pressable
                                        style={({ pressed }) => [
                                            styles.sendButton,
                                            pressed && { opacity: 0.7 },
                                        ]}
                                        onPress={handleSubmit}
                                    >
                                        <Send size={16} color="#fff" strokeWidth={2.5} />
                                    </Pressable>
                                )}
                            </View>
                        </View>

                        {/* Pinned Section */}
                        {pinnedItems.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Pinned</Text>
                                <View style={styles.listContainer}>
                                    {pinnedItems.map((item, index) => (
                                        <Animated.View
                                            key={item.id}
                                            entering={FadeInDown.delay(index * 50).duration(300)}
                                            exiting={FadeOutRight.duration(250)}
                                            layout={LinearTransition.springify().damping(18).stiffness(120)}
                                        >
                                            <InboxItemCard
                                                item={item}
                                                onDelete={deleteItem}
                                                onTogglePin={togglePin}
                                                onArchive={archiveItem}
                                                onConvertToTask={handleConvertToTask}
                                                onConvertToHabit={handleConvertToHabit}
                                                isLast={index === pinnedItems.length - 1}
                                            />
                                        </Animated.View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Recent Section */}
                        {unpinnedItems.length === 0 && pinnedItems.length === 0 ? (
                            <View style={styles.emptyState}>
                                <InboxIcon size={36} color="#C7C7CC" strokeWidth={1.5} />
                                <Text style={styles.emptyTitle}>No items yet</Text>
                                <Text style={styles.emptySubtitle}>
                                    Jot down thoughts, ideas, or tasks
                                </Text>
                            </View>
                        ) : unpinnedItems.length > 0 ? (
                            <View style={styles.section}>
                                {pinnedItems.length > 0 && (
                                    <Text style={styles.sectionTitle}>Recent</Text>
                                )}
                                <View style={styles.listContainer}>
                                    {unpinnedItems.map((item, index) => (
                                        <Animated.View
                                            key={item.id}
                                            entering={FadeInDown.delay(index * 50).duration(300)}
                                            exiting={FadeOutRight.duration(250)}
                                            layout={LinearTransition.springify().damping(18).stiffness(120)}
                                        >
                                            <InboxItemCard
                                                item={item}
                                                onDelete={deleteItem}
                                                onTogglePin={togglePin}
                                                onArchive={archiveItem}
                                                onConvertToTask={handleConvertToTask}
                                                onConvertToHabit={handleConvertToHabit}
                                                isLast={index === unpinnedItems.length - 1}
                                            />
                                        </Animated.View>
                                    ))}
                                </View>
                            </View>
                        ) : null}

                        {/* Archive Section */}
                        {archivedItems.length > 0 && (
                            <View style={styles.section}>
                                <Pressable
                                    style={styles.archiveToggle}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setShowArchive(!showArchive);
                                    }}
                                >
                                    <View style={styles.archiveToggleLeft}>
                                        <Archive size={16} color="#8E8E93" strokeWidth={2} />
                                        <Text style={styles.archiveToggleText}>
                                            Archived
                                        </Text>
                                        <Text style={styles.archiveCount}>{archivedItems.length}</Text>
                                    </View>
                                    <ChevronRight
                                        size={16}
                                        color="#C7C7CC"
                                        strokeWidth={2}
                                        style={{
                                            transform: [{ rotate: showArchive ? '90deg' : '0deg' }],
                                        }}
                                    />
                                </Pressable>

                                {showArchive && (
                                    <View style={styles.listContainer}>
                                        {archivedItems.map((item, index) => (
                                            <ArchivedRow
                                                key={item.id}
                                                item={item}
                                                onRestore={restoreItem}
                                                onDelete={deleteItem}
                                                isLast={index === archivedItems.length - 1}
                                            />
                                        ))}
                                    </View>
                                )}
                            </View>
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
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.8)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000',
        position: 'absolute',
        left: 0,
        right: 0,
        textAlign: 'center',
        zIndex: -1,
    },
    headerRight: {
        width: 36,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 120,
        paddingTop: 8,
    },
    inputSection: {
        marginBottom: 24,
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 16,
        overflow: 'hidden',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    input: {
        flex: 1,
        fontSize: 17,
        color: '#000',
        fontWeight: '400',
        letterSpacing: -0.3,
        minHeight: 24,
        maxHeight: 100,
        paddingTop: 0,
        paddingBottom: 0,
    },
    sendButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#007AFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
        marginBottom: 8,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: -0.1,
    },
    listContainer: {
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 16,
        overflow: 'hidden',
    },
    inboxItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 12,
    },
    separator: {
        position: 'absolute',
        bottom: 0,
        left: 48,
        right: 0,
        height: StyleSheet.hairlineWidth,
        backgroundColor: 'rgba(60,60,67,0.1)',
    },
    itemContent: {
        flex: 1,
        justifyContent: 'center',
    },
    itemText: {
        fontSize: 17,
        fontWeight: '400',
        color: '#000',
        lineHeight: 22,
        letterSpacing: -0.4,
    },
    itemMeta: {
        fontSize: 13,
        color: '#8E8E93',
        fontWeight: '400',
        marginTop: 2,
        letterSpacing: -0.1,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        gap: 8,
    },
    emptyTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#3C3C43',
        marginTop: 8,
        letterSpacing: -0.4,
    },
    emptySubtitle: {
        fontSize: 15,
        color: '#8E8E93',
        letterSpacing: -0.2,
    },
    archiveToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    archiveToggleLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    archiveToggleText: {
        fontSize: 17,
        fontWeight: '400',
        color: '#000',
        letterSpacing: -0.2,
    },
    archiveCount: {
        fontSize: 15,
        fontWeight: '400',
        color: '#8E8E93',
    },
    archivedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    archivedSeparator: {
        position: 'absolute',
        bottom: 0,
        left: 40,
        right: 0,
        height: StyleSheet.hairlineWidth,
        backgroundColor: 'rgba(60,60,67,0.1)',
    },
    archivedContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    archivedTitle: {
        fontSize: 15,
        color: '#8E8E93',
        flex: 1,
        fontWeight: '400',
        textDecorationLine: 'line-through',
        letterSpacing: -0.3,
    },
    archivedActions: {
        flexDirection: 'row',
        gap: 16,
        paddingLeft: 12,
    },
    archivedAction: {
        padding: 4,
    },
});
