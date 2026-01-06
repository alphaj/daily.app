import { useRouter } from 'expo-router';
import {
    ChevronLeft,
    MoreHorizontal,
    Plus,
    Zap,
    Menu,
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setIsExpanded(!isExpanded);
    };

    const handleDelete = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onDelete(item.id);
    };

    const handlePin = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onTogglePin(item.id);
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
        <View style={[styles.dumpItemContainer, isExpanded && styles.dumpItemContainerExpanded]}>
            <Pressable style={styles.dumpItem} onPress={handlePress} onLongPress={handlePin}>
                <View style={[styles.typeIndicator, { backgroundColor: config.color }]}>
                    <IconComponent size={14} color="#fff" strokeWidth={2} />
                </View>
                <View style={styles.dumpContent}>
                    <Text style={styles.dumpText}>{item.content}</Text>
                    <Text style={styles.dumpMeta}>
                        {config.label} • {timeAgo}
                    </Text>
                </View>
                {item.isPinned && (
                    <View style={styles.pinnedBadge}>
                        <Pin size={12} color="#5856D6" />
                    </View>
                )}
            </Pressable>

            {isExpanded && (
                <View style={styles.actionBar}>
                    <Pressable style={styles.actionButton} onPress={handleConvertToTask}>
                        <CheckCircle2 size={18} color="#34C759" strokeWidth={2} />
                        <Text style={[styles.actionText, { color: '#34C759' }]}>Task</Text>
                    </Pressable>
                    <Pressable style={styles.actionButton} onPress={handleConvertToHabit}>
                        <Zap size={18} color="#5856D6" strokeWidth={2} />
                        <Text style={[styles.actionText, { color: '#5856D6' }]}>Habit</Text>
                    </Pressable>
                    <Pressable style={styles.actionButton} onPress={handleDelete}>
                        <Trash2 size={18} color="#FF3B30" strokeWidth={2} />
                        <Text style={[styles.actionText, { color: '#FF3B30' }]}>Delete</Text>
                    </Pressable>
                </View>
            )}
        </View>
    );
}

export default function BrainDumpScreen() {
    const router = useRouter();
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
                    <Pressable style={styles.iconButton} onPress={() => router.back()}>
                        <ChevronLeft size={24} color="#000" strokeWidth={1.5} />
                    </Pressable>

                    <View style={styles.headerCenter}>
                        <Text style={styles.logoText}>daily.app</Text>
                        <Text style={styles.headerTitle}>Brain Dump</Text>
                    </View>

                    <Pressable style={styles.iconButton}>
                        <MoreHorizontal size={24} color="#000" />
                    </Pressable>
                </View>

                {/* Quick Input */}
                <View style={styles.inputContainer}>
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
                    />
                    {inputText.trim() && (
                        <Pressable style={styles.sendButton} onPress={handleSubmit}>
                            <Send size={20} color="#fff" />
                        </Pressable>
                    )}
                </View>

                {/* Hint */}
                <Text style={styles.hintText}>
                    Type anything • Auto-detects links, ideas, reminders & tasks
                </Text>

                <ScrollView
                    style={styles.content}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Pinned Section */}
                    {pinnedItems.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Pin size={14} color="#5856D6" />
                                <Text style={styles.sectionTitle}>Pinned</Text>
                            </View>
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
                                <MessageCircle size={48} color="#C7C7CC" strokeWidth={1} />
                                <Text style={styles.emptyTitle}>Empty mind?</Text>
                                <Text style={styles.emptySubtitle}>
                                    Capture your thoughts, ideas, and random things here
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
                <View style={styles.bottomBar}>
                    <Pressable style={styles.bottomTab} onPress={() => router.replace('/')}>
                        <Home size={24} color="#000" strokeWidth={1.5} />
                    </Pressable>
                    <Pressable style={[styles.bottomTab, styles.bottomTabActive]}>
                        <Brain size={24} color="#5856D6" strokeWidth={1.5} />
                    </Pressable>

                    <Pressable style={styles.fab} onPress={handleAddPress}>
                        <Plus size={28} color="#000" strokeWidth={1.5} />
                    </Pressable>

                    <Pressable style={styles.bottomTab} onPress={() => router.push('/habits')}>
                        <Zap size={24} color="#000" strokeWidth={1.5} />
                    </Pressable>
                    <Pressable style={styles.bottomTab} onPress={() => router.push('/menu')}>
                        <Menu size={24} color="#000" strokeWidth={1.5} />
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    flex: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    iconButton: {
        padding: 8,
    },
    headerCenter: {
        alignItems: 'center',
        gap: 4,
    },
    logoText: {
        fontSize: 20,
        fontWeight: '800',
        color: '#000',
        letterSpacing: -1.0,
    },
    headerTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#8E8E93',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 24,
        marginTop: 16,
        backgroundColor: '#F2F2F7',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
    },
    input: {
        flex: 1,
        fontSize: 17,
        color: '#000',
        fontWeight: '500',
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#5856D6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    hintText: {
        fontSize: 12,
        color: '#C7C7CC',
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 16,
    },
    content: {
        flex: 1,
    },
    section: {
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#8E8E93',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
    },
    dumpItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 12,
    },
    dumpItemContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#F2F2F7',
        overflow: 'hidden',
    },
    dumpItemContainerExpanded: {
        borderColor: '#5856D6',
        backgroundColor: '#F8F8FC',
    },
    actionBar: {
        flexDirection: 'row',
        padding: 12,
        paddingTop: 0,
        gap: 8,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    actionText: {
        fontSize: 13,
        fontWeight: '600',
    },
    typeIndicator: {
        width: 28,
        height: 28,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    dumpContent: {
        flex: 1,
    },
    dumpText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000',
        lineHeight: 22,
    },
    dumpMeta: {
        fontSize: 12,
        color: '#8E8E93',
        marginTop: 4,
    },
    pinnedBadge: {
        marginLeft: 8,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#8E8E93',
        marginTop: 8,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    bottomBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 32,
        paddingVertical: 8,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#F2F2F7',
        paddingBottom: 20,
    },
    bottomTab: {
        padding: 4,
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
