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
} from 'lucide-react-native';
import React, { useState, useRef } from 'react';
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
}: {
    item: InboxItem;
    onDelete: (id: string) => void;
    onTogglePin: (id: string) => void;
    onArchive: (id: string) => void;
    onConvertToTask: (id: string, content: string) => void;
    onConvertToHabit: (id: string, content: string) => void;
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const config = TYPE_CONFIG[item.type];
    const IconComponent = ICON_MAP[config.icon] || MessageCircle;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.98,
            useNativeDriver: true,
            speed: 20,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            speed: 20,
        }).start();
    };

    const handlePress = () => {
        Haptics.selectionAsync();
        setIsExpanded(!isExpanded);
    };

    const handlePin = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onTogglePin(item.id);
    };

    const handleDelete = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onDelete(item.id);
    };

    const handleArchive = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onArchive(item.id);
    };

    const handleConvertToTask = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onConvertToTask(item.id, item.content);
    };

    const handleConvertToHabit = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onConvertToHabit(item.id, item.content);
    };

    const timeAgo = formatDistanceToNow(new Date(item.createdAt), { addSuffix: true });
    const areaConfig = item.area ? AREA_CONFIG[item.area] : null;

    return (
        <Animated.View style={[styles.itemWrapper, { transform: [{ scale: scaleAnim }] }]}>
            <Pressable
                style={[styles.inboxItem, isExpanded && styles.inboxItemExpanded]}
                onPress={handlePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onLongPress={handlePin}
            >
                <View style={styles.itemHeader}>
                    <View style={[styles.typeIndicator, { backgroundColor: config.color + '20' }]}>
                        <IconComponent size={16} color={config.color} strokeWidth={2.5} />
                    </View>
                    <View style={styles.itemContent}>
                        <Text style={styles.itemText}>{item.content}</Text>
                        {item.note && (
                            <Text style={styles.itemNote} numberOfLines={isExpanded ? undefined : 1}>
                                {item.note}
                            </Text>
                        )}
                        <View style={styles.metaRow}>
                            <Text style={styles.itemMeta}>
                                {config.label} • {timeAgo}
                            </Text>
                            {areaConfig && (
                                <View style={[styles.areaBadge, { backgroundColor: areaConfig.color + '15' }]}>
                                    <Text style={{ fontSize: 10 }}>{areaConfig.emoji}</Text>
                                    <Text style={[styles.areaText, { color: areaConfig.color }]}>
                                        {areaConfig.label}
                                    </Text>
                                </View>
                            )}
                            {item.isPinned && (
                                <View style={styles.pinBadge}>
                                    <Pin size={10} color="#5856D6" strokeWidth={2.5} />
                                    <Text style={styles.pinText}>Pinned</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {isExpanded && (
                    <View style={styles.actionBar}>
                        <View style={styles.divider} />
                        <View style={styles.actionButtons}>
                            <Pressable style={styles.actionButton} onPress={handleConvertToTask}>
                                <View style={[styles.actionIcon, { backgroundColor: '#34C75915' }]}>
                                    <CheckCircle2 size={18} color="#34C759" strokeWidth={2} />
                                </View>
                                <Text style={styles.actionText}>Task</Text>
                            </Pressable>
                            <Pressable style={styles.actionButton} onPress={handleConvertToHabit}>
                                <View style={[styles.actionIcon, { backgroundColor: '#5856D615' }]}>
                                    <Zap size={18} color="#5856D6" strokeWidth={2} />
                                </View>
                                <Text style={styles.actionText}>Habit</Text>
                            </Pressable>
                            <Pressable style={styles.actionButton} onPress={handleArchive}>
                                <View style={[styles.actionIcon, { backgroundColor: '#8E8E9315' }]}>
                                    <Archive size={18} color="#8E8E93" strokeWidth={2} />
                                </View>
                                <Text style={styles.actionText}>Archive</Text>
                            </Pressable>
                            <Pressable style={styles.actionButton} onPress={handleDelete}>
                                <View style={[styles.actionIcon, { backgroundColor: '#FF3B3015' }]}>
                                    <Trash2 size={18} color="#FF3B30" strokeWidth={2} />
                                </View>
                                <Text style={[styles.actionText, { color: '#FF3B30' }]}>Delete</Text>
                            </Pressable>
                        </View>
                    </View>
                )}
            </Pressable>
        </Animated.View>
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
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Inbox</Text>
                    <Pressable style={styles.headerButton} onPress={() => router.push('/menu')}>
                        <Settings size={22} color="#000" strokeWidth={1.5} />
                    </Pressable>
                </View>

                {/* Main Content */}
                <ScrollView
                    style={styles.content}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    keyboardShouldPersistTaps="handled"
                >
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
                            <Text style={styles.sectionTitle}>Pinned</Text>
                            {pinnedItems.map((item) => (
                                <InboxItemCard
                                    key={item.id}
                                    item={item}
                                    onDelete={deleteItem}
                                    onTogglePin={togglePin}
                                    onArchive={archiveItem}
                                    onConvertToTask={handleConvertToTask}
                                    onConvertToHabit={handleConvertToHabit}
                                />
                            ))}
                        </View>
                    )}

                    {/* Recent Section */}
                    <View style={styles.section}>
                        {pinnedItems.length > 0 && <Text style={styles.sectionTitle}>Recent</Text>}
                        {unpinnedItems.length === 0 && pinnedItems.length === 0 ? (
                            <View style={styles.emptyState}>
                                <View style={styles.emptyIconContainer}>
                                    <InboxIcon size={48} color="#C7C7CC" strokeWidth={1} />
                                </View>
                                <Text style={styles.emptyTitle}>Empty Inbox</Text>
                                <Text style={styles.emptySubtitle}>
                                    Capture thoughts, ideas, and tasks before they slip away.
                                </Text>
                            </View>
                        ) : (
                            unpinnedItems.map((item) => (
                                <InboxItemCard
                                    key={item.id}
                                    item={item}
                                    onDelete={deleteItem}
                                    onTogglePin={togglePin}
                                    onArchive={archiveItem}
                                    onConvertToTask={handleConvertToTask}
                                    onConvertToHabit={handleConvertToHabit}
                                />
                            ))
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
                                    {archivedItems.map((item) => (
                                        <ArchivedRow
                                            key={item.id}
                                            item={item}
                                            onRestore={restoreItem}
                                            onDelete={deleteItem}
                                        />
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 16,
        paddingBottom: 16,
    },
    headerTitle: {
        fontSize: 34,
        fontWeight: '700',
        color: '#000',
        letterSpacing: -0.5,
    },
    headerButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    inputCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 16,
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
    },
    input: {
        fontSize: 17,
        color: '#000',
        fontWeight: '500',
        minHeight: 24,
        maxHeight: 120,
        marginBottom: 12,
    },
    inputFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    hintText: {
        fontSize: 12,
        color: '#8E8E93',
        fontWeight: '500',
    },
    sendButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#5856D6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#000',
        marginBottom: 16,
        marginLeft: 4,
    },
    itemWrapper: {
        marginBottom: 12,
    },
    inboxItem: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 1,
    },
    inboxItemExpanded: {
        shadowOpacity: 0.08,
        shadowRadius: 12,
    },
    itemHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    typeIndicator: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemContent: {
        flex: 1,
        paddingTop: 2,
    },
    itemText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000',
        lineHeight: 22,
        marginBottom: 4,
    },
    itemNote: {
        fontSize: 14,
        color: '#8E8E93',
        lineHeight: 20,
        marginBottom: 4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
    },
    itemMeta: {
        fontSize: 12,
        color: '#8E8E93',
        fontWeight: '500',
    },
    areaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    areaText: {
        fontSize: 10,
        fontWeight: '600',
    },
    pinBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F2F2F7',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    pinText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#5856D6',
    },
    actionBar: {
        marginTop: 12,
    },
    divider: {
        height: 1,
        backgroundColor: '#F2F2F7',
        marginBottom: 12,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: '#F9F9F9',
    },
    actionIcon: {
        width: 24,
        height: 24,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#000',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
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
        fontWeight: '700',
        color: '#000',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 15,
        color: '#8E8E93',
        textAlign: 'center',
        maxWidth: 260,
        lineHeight: 22,
    },
    archiveSection: {
        marginTop: 16,
        marginBottom: 20,
    },
    archiveToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    archiveToggleText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8E8E93',
    },
    archivedList: {
        marginTop: 16,
        gap: 10,
    },
    archivedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#EAEAEE',
        borderRadius: 16,
        padding: 12,
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
        backgroundColor: '#fff',
    },
    archivedTitle: {
        fontSize: 15,
        color: '#8E8E93',
        flex: 1,
        fontWeight: '500',
        textDecorationLine: 'line-through',
    },
    archivedActions: {
        flexDirection: 'row',
        gap: 12,
        paddingLeft: 12,
    },
    archivedAction: {
        padding: 6,
        backgroundColor: '#fff',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    bottomBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 32,
        paddingTop: 16,
        backgroundColor: '#fff',
        borderTopWidth: 0.5,
        borderTopColor: '#E5E5EA',
    },
    bottomTab: {
        padding: 8,
    },
    bottomTabActive: {
        opacity: 1,
    },
    fab: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -16,
    },
});
