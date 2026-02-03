import { useRouter } from 'expo-router';
import {
    Settings,
    Plus,
    Clock,
    FolderKanban,
    Home,
    Brain,
    Pin,
    Lightbulb,
    Bell,
    CheckCircle2,
    MessageCircle,
    Send,
    Trash2,
    Zap,
    Inbox as InboxIcon,
    Archive,
    RotateCcw,
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
    Animated,
    Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useInbox } from '@/contexts/InboxContext';
import { useTodos } from '@/contexts/TodoContext';
import { useHabits } from '@/contexts/HabitContext';
import { TYPE_CONFIG, AREA_CONFIG, type InboxItem, type InboxItemType } from '@/types/inbox';
import { formatDistanceToNow } from 'date-fns';
import { BottomNavBar } from '@/components/BottomNavBar';
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
    isFirst,
    isLast,
}: {
    item: InboxItem;
    onDelete: (id: string) => void;
    onTogglePin: (id: string) => void;
    onArchive: (id: string) => void;
    onConvertToTask: (id: string, content: string) => void;
    onConvertToHabit: (id: string, content: string) => void;
    isFirst?: boolean;
    isLast?: boolean;
}) {
    const config = TYPE_CONFIG[item.type];
    const IconComponent = ICON_MAP[config.icon] || MessageCircle;

    const timeAgo = formatDistanceToNow(new Date(item.createdAt), { addSuffix: false });
    const formattedTime = timeAgo.replace('about ', '').replace(' days', 'd').replace(' day', 'd').replace(' hours', 'h').replace(' hour', 'h').replace(' minutes', 'm').replace(' minute', 'm');

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
        Alert.alert(
            item.content,
            undefined,
            [
                { text: 'Convert to Task', onPress: handleConvertToTask },
                { text: 'Convert to Habit', onPress: handleConvertToHabit },
                { text: 'Archive', onPress: () => onArchive(item.id) },
                { text: item.isPinned ? 'Unpin' : 'Pin', onPress: () => onTogglePin(item.id) },
                { text: 'Delete', style: 'destructive', onPress: handleDelete },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    }, [item, handleConvertToTask, handleConvertToHabit, handleDelete, onTogglePin, onArchive]);

    return (
        <SwipeableRow
            onDelete={handleDelete}
            onConvertToTask={handleConvertToTask}
            onConvertToHabit={handleConvertToHabit}
        >
            <Pressable
                style={[
                    styles.inboxItem,
                    isFirst && styles.inboxItemFirst,
                    isLast && styles.inboxItemLast,
                ]}
                onLongPress={handleLongPress}
                delayLongPress={300}
            >
                <View style={[styles.typeIndicator, { backgroundColor: config.color + '12' }]}>
                    <IconComponent size={18} color={config.color} strokeWidth={2} />
                </View>
                <View style={styles.itemContent}>
                    <View style={styles.itemTitleRow}>
                        <Text style={styles.itemText} numberOfLines={2}>{item.content}</Text>
                        {item.isPinned && (
                            <Pin size={12} color="#FF9500" strokeWidth={2.5} fill="#FF9500" />
                        )}
                    </View>
                    <Text style={styles.itemMeta}>
                        {config.label} • {formattedTime}
                    </Text>
                </View>
                {!isLast && <View style={styles.separator} />}
            </Pressable>
        </SwipeableRow>
    );
}

function ArchivedRow({
    item,
    onRestore,
    onDelete,
}: {
    item: InboxItem;
    onRestore: (id: string) => void;
    onDelete: (id: string) => void;
}) {
    const config = TYPE_CONFIG[item.type];

    return (
        <View style={styles.archivedRow}>
            <View style={styles.archivedContent}>
                <View style={[styles.archivedIcon, { backgroundColor: config.color + '15' }]}>
                    <Text style={{ fontSize: 12 }}>{config.label.charAt(0)}</Text>
                </View>
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
                    <RotateCcw size={18} color="#5856D6" strokeWidth={2} />
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
                    <Trash2 size={18} color="#FF3B30" strokeWidth={2} />
                </Pressable>
            </View>
            <View style={styles.archivedSeparator} />
        </View>
    );
}

export default function InboxScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
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
        <SafeAreaView style={styles.container} edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
            >
                {/* Main Content */}
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Inbox</Text>
                        <Text style={styles.headerSubtitle}>Capture thoughts before they slip away</Text>
                    </View>

                    {/* Input Card */}
                    <View style={styles.inputCard}>
                        <TextInput
                            ref={inputRef}
                            style={styles.input}
                            placeholder="What's on your mind?"
                            placeholderTextColor="#C7C7CC"
                            value={inputText}
                            onChangeText={setInputText}
                            onSubmitEditing={handleSubmit}
                            returnKeyType="done"
                            blurOnSubmit={false}
                            multiline
                        />
                        <View style={styles.inputFooter}>
                            <Text style={styles.hintText}>Capture thoughts, ideas, or tasks</Text>
                            {inputText.trim() && (
                                <Pressable style={styles.sendButton} onPress={handleSubmit}>
                                    <Send size={18} color="#fff" strokeWidth={2.5} />
                                </Pressable>
                            )}
                        </View>
                    </View>

                    {/* Pinned Section */}
                    {pinnedItems.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>PINNED</Text>
                            <View style={styles.listContainer}>
                                {pinnedItems.map((item, index) => (
                                    <InboxItemCard
                                        key={item.id}
                                        item={item}
                                        onDelete={deleteItem}
                                        onTogglePin={togglePin}
                                        onArchive={archiveItem}
                                        onConvertToTask={handleConvertToTask}
                                        onConvertToHabit={handleConvertToHabit}
                                        isFirst={index === 0}
                                        isLast={index === pinnedItems.length - 1}
                                    />
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Recent Section */}
                    <View style={styles.section}>
                        {unpinnedItems.length === 0 && pinnedItems.length === 0 ? (
                            <View style={styles.emptyState}>
                                <View style={styles.emptyIconContainer}>
                                    <InboxIcon size={40} color="#C7C7CC" strokeWidth={1.5} />
                                </View>
                                <Text style={styles.emptyTitle}>Your inbox is empty</Text>
                                <Text style={styles.emptySubtitle}>
                                    Capture quick thoughts, ideas, and tasks before they slip away
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.listContainer}>
                                {unpinnedItems.map((item, index) => (
                                    <InboxItemCard
                                        key={item.id}
                                        item={item}
                                        onDelete={deleteItem}
                                        onTogglePin={togglePin}
                                        onArchive={archiveItem}
                                        onConvertToTask={handleConvertToTask}
                                        onConvertToHabit={handleConvertToHabit}
                                        isFirst={index === 0}
                                        isLast={index === unpinnedItems.length - 1}
                                    />
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Archive Section */}
                    {archivedItems.length > 0 && (
                        <View style={styles.archiveSection}>
                            <Pressable
                                style={styles.archiveToggle}
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    setShowArchive(!showArchive);
                                }}
                            >
                                <Archive size={16} color="#8E8E93" strokeWidth={2} />
                                <Text style={styles.archiveToggleText}>
                                    {showArchive ? 'Hide' : 'Show'} Archived ({archivedItems.length})
                                </Text>
                            </Pressable>

                            {showArchive && (
                                <View style={styles.archivedList}>
                                    {archivedItems.map((item, index) => (
                                        <ArchivedRow
                                            key={item.id}
                                            item={item}
                                            onRestore={restoreItem}
                                            onDelete={deleteItem}
                                        />
                                        // TODO: Pass isLast to ArchiveRow to hide separator on last item if needed, but for now strict line is fine or we update style
                                    ))}
                                </View>
                            )}
                        </View>
                    )}
                </ScrollView>

                {/* Bottom Bar */}
                <BottomNavBar onFabPress={handleAddPress} />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    flex: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 120,
        paddingTop: 16,
    },
    header: {
        marginTop: 24,
        marginBottom: 32,
        paddingHorizontal: 4,
    },
    headerTitle: {
        fontSize: 34,
        fontWeight: '700',
        color: '#000',
        letterSpacing: 0.35,
    },
    headerSubtitle: {
        fontSize: 15,
        color: '#8E8E93',
        marginTop: 8,
        fontWeight: '400',
        letterSpacing: -0.2,
    },
    inputCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 2,
        // @ts-ignore - native only
        cornerCurve: 'continuous',
    },
    input: {
        fontSize: 17,
        color: '#000',
        fontWeight: '400',
        minHeight: 24,
        maxHeight: 100,
        marginBottom: 12,
        letterSpacing: -0.3,
    },
    inputFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    hintText: {
        fontSize: 13,
        color: '#8E8E93',
        fontWeight: '500',
        letterSpacing: -0.1,
    },
    sendButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#007AFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
        marginBottom: 10,
        marginLeft: 16,
        letterSpacing: -0.1,
        textTransform: 'uppercase',
    },
    listContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 1,
        // @ts-ignore - native only
        cornerCurve: 'continuous',
    },
    inboxItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 14,
    },
    inboxItemFirst: {
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    inboxItemLast: {
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
    },
    separator: {
        position: 'absolute',
        bottom: 0,
        left: 66,
        right: 0,
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#C6C6C8',
    },
    typeIndicator: {
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        // @ts-ignore - native only
        cornerCurve: 'continuous',
    },
    itemContent: {
        flex: 1,
        justifyContent: 'center',
    },
    itemTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        marginBottom: 2,
    },
    itemText: {
        fontSize: 17,
        fontWeight: '400',
        color: '#000',
        lineHeight: 22,
        flex: 1,
        letterSpacing: -0.4, // San Francisco style tracking
    },
    itemMeta: {
        fontSize: 13,
        color: '#8E8E93',
        fontWeight: '400',
        letterSpacing: -0.1,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        paddingHorizontal: 32,
    },
    emptyIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#E5E5EA',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000',
        marginBottom: 8,
        textAlign: 'center',
        letterSpacing: -0.4,
    },
    emptySubtitle: {
        fontSize: 15,
        color: '#8E8E93',
        textAlign: 'center',
        lineHeight: 20,
        letterSpacing: -0.2,
    },
    archiveSection: {
        marginBottom: 32,
    },
    archiveToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        backgroundColor: 'rgba(118, 118, 128, 0.12)', // Apple system fill
        borderRadius: 12,
    },
    archiveToggleText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#8E8E93',
        letterSpacing: -0.2,
    },
    archivedList: {
        marginTop: 16,
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        // @ts-ignore - native only
        cornerCurve: 'continuous',
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
        left: 16,
        right: 0,
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#C6C6C8',
    },
    archivedContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    archivedIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F2F2F7',
        // @ts-ignore - native only
        cornerCurve: 'continuous',
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
        paddingRight: 16,
    },
    archivedAction: {
        padding: 4,
    },
});
