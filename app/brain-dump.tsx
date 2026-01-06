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
    Link2,
    Bell,
    CheckCircle2,
    MessageCircle,
    Send,
    Trash2,
    Zap,
    Inbox,
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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useBrainDump } from '@/contexts/BrainDumpContext';
import { useTodos } from '@/contexts/TodoContext';
import { useHabits } from '@/contexts/HabitContext';
import type { DumpItemType, BrainDumpItem } from '@/types/braindump';
import { formatDistanceToNow } from 'date-fns';

const TYPE_CONFIG: Record<DumpItemType, { icon: any; color: string; label: string }> = {
    thought: { icon: MessageCircle, color: '#8E8E93', label: 'Thought' },
    idea: { icon: Lightbulb, color: '#FFCC00', label: 'Idea' },
    link: { icon: Link2, color: '#007AFF', label: 'Link' },
    reminder: { icon: Bell, color: '#FF9500', label: 'Reminder' },
    task: { icon: CheckCircle2, color: '#34C759', label: 'Task' },
};

function DumpItem({
    item,
    onDelete,
    onTogglePin,
    onConvertToTask,
    onConvertToHabit,
}: {
    item: BrainDumpItem;
    onDelete: (id: string) => void;
    onTogglePin: (id: string) => void;
    onConvertToTask: (id: string, content: string) => void;
    onConvertToHabit: (id: string, content: string) => void;
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const config = TYPE_CONFIG[item.type];
    const IconComponent = config.icon;
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

    const handleConvertToTask = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onConvertToTask(item.id, item.content);
    };

    const handleConvertToHabit = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onConvertToHabit(item.id, item.content);
    };

    const timeAgo = formatDistanceToNow(new Date(item.createdAt), { addSuffix: true });

    return (
        <Animated.View style={[
            styles.itemWrapper,
            { transform: [{ scale: scaleAnim }] }
        ]}>
            <Pressable
                style={[styles.dumpItem, isExpanded && styles.dumpItemExpanded]}
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
                        <Text style={styles.dumpText}>{item.content}</Text>
                        <View style={styles.metaRow}>
                            <Text style={styles.dumpMeta}>
                                {config.label} • {timeAgo}
                            </Text>
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

export default function BrainDumpScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { items, addItem, deleteItem, togglePin, archiveItem, getPinnedItems } = useBrainDump();
    const { addTodo } = useTodos();
    const { addHabit } = useHabits();
    const [inputText, setInputText] = useState('');
    const inputRef = useRef<TextInput>(null);

    const pinnedItems = getPinnedItems();
    const unpinnedItems = items.filter(item => !item.isPinned);

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
                    <Text style={styles.headerTitle}>Brain Dump</Text>
                    <Pressable
                        style={styles.headerButton}
                        onPress={() => router.push('/menu')}
                    >
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
                            <Text style={styles.hintText}>
                                Auto-detects tasks, ideas & reminders
                            </Text>
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
                            {pinnedItems.map(item => (
                                <DumpItem
                                    key={item.id}
                                    item={item}
                                    onDelete={deleteItem}
                                    onTogglePin={togglePin}
                                    onConvertToTask={handleConvertToTask}
                                    onConvertToHabit={handleConvertToHabit}
                                />
                            ))}
                        </View>
                    )}

                    {/* Recent Section */}
                    <View style={styles.section}>
                        {pinnedItems.length > 0 && (
                            <Text style={styles.sectionTitle}>Recent</Text>
                        )}
                        {unpinnedItems.length === 0 && pinnedItems.length === 0 ? (
                            <View style={styles.emptyState}>
                                <View style={styles.emptyIconContainer}>
                                    <Inbox size={48} color="#C7C7CC" strokeWidth={1} />
                                </View>
                                <Text style={styles.emptyTitle}>Empty Mind</Text>
                                <Text style={styles.emptySubtitle}>
                                    Capture your thoughts, ideas, and tasks before they slip away.
                                </Text>
                            </View>
                        ) : (
                            unpinnedItems.map(item => (
                                <DumpItem
                                    key={item.id}
                                    item={item}
                                    onDelete={deleteItem}
                                    onTogglePin={togglePin}
                                    onConvertToTask={handleConvertToTask}
                                    onConvertToHabit={handleConvertToHabit}
                                />
                            ))
                        )}
                    </View>
                </ScrollView>

                {/* Bottom Bar */}
                <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                    <Pressable style={styles.bottomTab} onPress={() => router.replace('/')}>
                        <Home size={24} color="#000" strokeWidth={1.5} />
                    </Pressable>
                    <Pressable style={[styles.bottomTab, styles.bottomTabActive]}>
                        <Brain size={24} color="#5856D6" strokeWidth={1.5} />
                    </Pressable>

                    <Pressable style={styles.fab} onPress={handleAddPress}>
                        <Plus size={24} color="#000" strokeWidth={2} />
                    </Pressable>

                    <Pressable style={styles.bottomTab} onPress={() => router.replace('/projects')}>
                        <FolderKanban size={24} color="#000" strokeWidth={1.5} />
                    </Pressable>
                    <Pressable style={styles.bottomTab} onPress={() => router.replace('/later')}>
                        <Clock size={24} color="#000" strokeWidth={1.5} />
                    </Pressable>
                </View>
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
    dumpItem: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 1,
    },
    dumpItemExpanded: {
        shadowOpacity: 0.08,
        shadowRadius: 12,
        transform: [{ scale: 1.01 }],
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
    dumpText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000',
        lineHeight: 22,
        marginBottom: 4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dumpMeta: {
        fontSize: 12,
        color: '#8E8E93',
        fontWeight: '500',
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
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
        fontSize: 13,
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
