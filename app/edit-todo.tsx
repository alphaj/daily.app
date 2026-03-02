import { useRouter, useLocalSearchParams } from 'expo-router';
import { useGoBack } from '@/lib/useGoBack';
import { X, Check, Plus, Lock } from 'lucide-react-native';
import React, { useState, useMemo, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    TextInput,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    type ScrollView as ScrollViewType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from '@/lib/haptics';
import { useTodos } from '@/contexts/TodoContext';
import { useBuddy } from '@/contexts/BuddyContext';
import { format, parseISO, isToday, isTomorrow, addDays } from 'date-fns';
import { DatePickerModal } from '@/components/DatePickerModal';
import { AnimatedBottomSheet } from '@/components/AnimatedBottomSheet';
import { LinearGradient } from 'expo-linear-gradient';
import type { TimeOfDay, RepeatOption, Subtask } from '@/types/todo';

const EMOJI_OPTIONS = [
    '🌅', '☀️', '🌙', '⏰', '🛏️', '🪥',
    '🧘', '💧', '🏃', '🏋️', '🤸', '🚴', '🏊', '⚽', '🎾', '💪',
    '🍳', '🥗', '🍎', '🥑', '🍵', '☕', '🫐', '🥦', '🥕', '🍕',
    '📝', '💼', '💻', '📧', '📅', '✅', '🗂️', '📎', '🖊️', '📊',
    '📖', '🎯', '💡', '🎓', '🧠', '🎨', '🎵', '🎹', '✍️', '🌐',
    '💊', '🩺', '🧖', '💆', '🛁', '😴', '🩷', '🧊',
    '🌸', '🍃', '🌿', '🦋', '✨', '💫', '🕯️', '🙏', '🪴', '🌈',
    '👨‍👩‍👧', '💬', '📞', '🤝', '💌', '🎁', '🥰', '👋', '🎉', '🎂',
    '💰', '💵', '📈', '🏦', '💳', '🏠', '🧹', '🧺', '📦', '🧸',
    '✈️', '🚗', '🚆', '🏖️', '🗺️', '🧳', '⛰️', '🏕️',
    '🐕', '🐈', '🐟', '🐦', '🦮',
    '🔧', '🛒', '📸', '🎮', '📱', '🔑', '💎', '🌟', '⭐', '🚀',
];

const TIME_OF_DAY_OPTIONS: { label: string; value: TimeOfDay; icon: string }[] = [
    { label: 'Morning', value: 'morning', icon: '☀️' },
    { label: 'Afternoon', value: 'afternoon', icon: '🌤' },
    { label: 'Evening', value: 'evening', icon: '🌙' },
    { label: 'Anytime', value: 'anytime', icon: '🕐' },
];

const DURATION_OPTIONS: { label: string; value: number }[] = [
    { label: '15m', value: 15 },
    { label: '30m', value: 30 },
    { label: '45m', value: 45 },
    { label: '1h', value: 60 },
    { label: '1h 15m', value: 75 },
    { label: '1h 30m', value: 90 },
    { label: '2h', value: 120 },
];

const REPEAT_OPTIONS: { label: string; value: RepeatOption; icon: string }[] = [
    { label: 'None', value: 'none', icon: '' },
    { label: 'Daily', value: 'daily', icon: '🔁' },
    { label: 'Weekdays', value: 'weekdays', icon: '📅' },
    { label: 'Weekly', value: 'weekly', icon: '📆' },
    { label: 'Monthly', value: 'monthly', icon: '🗓️' },
];

function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export default function EditTodoScreen() {
    const router = useRouter();
    const goBack = useGoBack();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { todos, updateTodo } = useTodos();
    const { hasActiveBuddy } = useBuddy();
    const hasPartner = hasActiveBuddy;

    const todo = useMemo(() => todos.find(t => t.id === id), [todos, id]);

    const [title, setTitle] = useState(todo?.title ?? '');
    const [emoji, setEmoji] = useState<string | undefined>(todo?.emoji);
    const [dueDate, setDueDate] = useState<Date | null>(
        todo?.dueDate ? parseISO(todo.dueDate) : new Date()
    );
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [estimatedMinutes, setEstimatedMinutes] = useState<number | undefined>(todo?.estimatedMinutes);
    const [repeat, setRepeat] = useState<RepeatOption>(todo?.repeat ?? 'none');
    const [timeOfDay, setTimeOfDay] = useState<TimeOfDay | undefined>(todo?.timeOfDay);
    const [isPrivate, setIsPrivate] = useState(todo?.isPrivate ?? false);
    const [subtasks, setSubtasks] = useState<{ id: string; title: string; emoji: string }[]>(
        (todo?.subtasks ?? []).map(st => ({ id: st.id, title: st.title, emoji: st.emoji ?? '📋' }))
    );
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const scrollViewRef = useRef<ScrollViewType>(null);
    const subtaskInputRef = useRef<TextInput>(null);

    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showSubtaskEmojiPicker, setShowSubtaskEmojiPicker] = useState<string | null>(null);

    if (!todo) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: '#8E8E93', fontSize: 16 }}>Task not found</Text>
            </View>
        );
    }

    const handleSave = () => {
        if (title.trim()) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            const subtaskData: Subtask[] = subtasks.map(st => {
                const existing = todo.subtasks?.find(s => s.id === st.id);
                return {
                    id: st.id,
                    title: st.title,
                    emoji: st.emoji,
                    completed: existing?.completed ?? false,
                };
            });
            updateTodo(todo.id, {
                title: title.trim(),
                emoji,
                dueDate: dueDate ? dueDate.toISOString().split('T')[0] : todo.dueDate,
                estimatedMinutes,
                timeOfDay,
                repeat: repeat !== 'none' ? repeat : undefined,
                subtasks: subtaskData.length > 0 ? subtaskData : undefined,
                isPrivate: isPrivate || undefined,
            });
            goBack();
        }
    };

    const addSubtask = () => {
        if (newSubtaskTitle.trim()) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSubtasks(prev => [...prev, {
                id: generateId(),
                title: newSubtaskTitle.trim(),
                emoji: '📋',
            }]);
            setNewSubtaskTitle('');
        }
    };

    const removeSubtask = (subtaskId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSubtasks(prev => prev.filter(st => st.id !== subtaskId));
    };

    const updateSubtaskEmoji = (subtaskId: string, newEmoji: string) => {
        setSubtasks(prev => prev.map(st => st.id === subtaskId ? { ...st, emoji: newEmoji } : st));
        setShowSubtaskEmojiPicker(null);
    };

    const canSave = title.trim().length > 0;

    const isDateToday = dueDate ? isToday(dueDate) : false;
    const isDateTomorrow = dueDate ? isTomorrow(dueDate) : false;
    const isCustomDate = dueDate && !isDateToday && !isDateTomorrow;

    return (
        <View style={s.root}>
            <SafeAreaView style={s.container} edges={['top']}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    {/* Handle + Header */}
                    <View style={s.headerArea}>
                        <View style={s.handle} />
                        <View style={s.header}>
                            <Pressable
                                onPress={goBack}
                                style={s.closeBtn}
                                hitSlop={8}
                            >
                                <X size={18} color="#8E8E93" strokeWidth={2.5} />
                            </Pressable>
                            <Pressable
                                onPress={handleSave}
                                disabled={!canSave}
                                hitSlop={8}
                            >
                                <Text style={[s.saveText, canSave && s.saveTextActive]}>Save</Text>
                            </Pressable>
                        </View>
                    </View>

                    <ScrollView
                        ref={scrollViewRef}
                        contentContainerStyle={s.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="interactive"
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Title Area */}
                        <View style={s.titleArea}>
                            <TextInput
                                style={s.titleInput}
                                placeholder="Task name"
                                placeholderTextColor="#C7C7CC"
                                value={title}
                                onChangeText={setTitle}
                                autoFocus
                                multiline={false}
                            />
                            <Pressable
                                style={s.emojiBtn}
                                onPress={() => {
                                    Keyboard.dismiss();
                                    Haptics.selectionAsync();
                                    setShowEmojiPicker(true);
                                }}
                            >
                                <Text style={s.emojiBtnText}>{emoji || '🌤'}</Text>
                            </Pressable>
                        </View>

                        {/* When Section */}
                        <View style={s.section}>
                            <Text style={s.sectionLabel}>When</Text>
                            <View style={s.pillRow}>
                                <Pressable
                                    style={[s.pill, isDateToday && s.pillActive]}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setDueDate(new Date());
                                    }}
                                >
                                    <Text style={[s.pillText, isDateToday && s.pillTextActive]}>Today</Text>
                                </Pressable>
                                <Pressable
                                    style={[s.pill, isDateTomorrow && s.pillActive]}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setDueDate(addDays(new Date(), 1));
                                    }}
                                >
                                    <Text style={[s.pillText, isDateTomorrow && s.pillTextActive]}>Tomorrow</Text>
                                </Pressable>
                                <Pressable
                                    style={[s.pill, isCustomDate && s.pillActive]}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setShowDatePicker(true);
                                    }}
                                >
                                    <Text style={[s.pillText, isCustomDate && s.pillTextActive]}>
                                        {isCustomDate ? format(dueDate, 'MMM d') : 'Pick Date'}
                                    </Text>
                                </Pressable>
                                <Pressable
                                    style={[s.pill, !dueDate && s.pillActive]}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setDueDate(null);
                                    }}
                                >
                                    <Text style={[s.pillText, !dueDate && s.pillTextActive]}>Someday</Text>
                                </Pressable>
                            </View>
                        </View>

                        {/* Time of Day Section */}
                        <View style={s.section}>
                            <Text style={s.sectionLabel}>Time of day</Text>
                            <View style={s.pillRow}>
                                {TIME_OF_DAY_OPTIONS.map(opt => {
                                    const active = timeOfDay === opt.value;
                                    return (
                                        <Pressable
                                            key={opt.value}
                                            style={[s.pill, active && s.pillActive]}
                                            onPress={() => {
                                                Haptics.selectionAsync();
                                                setTimeOfDay(active ? undefined : opt.value);
                                            }}
                                        >
                                            <Text style={s.pillIcon}>{opt.icon}</Text>
                                            <Text style={[s.pillText, active && s.pillTextActive]}>{opt.label}</Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Duration Section */}
                        <View style={s.section}>
                            <Text style={s.sectionLabel}>Duration</Text>
                            <View style={s.pillRow}>
                                {DURATION_OPTIONS.map(opt => {
                                    const active = estimatedMinutes === opt.value;
                                    return (
                                        <Pressable
                                            key={opt.value}
                                            style={[s.pill, s.pillCompact, active && s.pillActive]}
                                            onPress={() => {
                                                Haptics.selectionAsync();
                                                setEstimatedMinutes(active ? undefined : opt.value);
                                            }}
                                        >
                                            <Text style={[s.pillText, active && s.pillTextActive]}>{opt.label}</Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Repeat Section */}
                        <View style={s.section}>
                            <Text style={s.sectionLabel}>Repeat</Text>
                            <View style={s.pillRow}>
                                {REPEAT_OPTIONS.map(opt => {
                                    const active = repeat === opt.value;
                                    return (
                                        <Pressable
                                            key={opt.value}
                                            style={[s.pill, active && s.pillActive]}
                                            onPress={() => {
                                                Haptics.selectionAsync();
                                                setRepeat(opt.value);
                                            }}
                                        >
                                            <Text style={[s.pillText, active && s.pillTextActive]}>{opt.label}</Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Private Section */}
                        {hasPartner && (
                            <View style={s.section}>
                                <Text style={s.sectionLabel}>Visibility</Text>
                                <View style={s.pillRow}>
                                    <Pressable
                                        style={[s.pill, !isPrivate && s.pillActive]}
                                        onPress={() => {
                                            Haptics.selectionAsync();
                                            setIsPrivate(false);
                                        }}
                                    >
                                        <Text style={[s.pillText, !isPrivate && s.pillTextActive]}>Shared</Text>
                                    </Pressable>
                                    <Pressable
                                        style={[s.pill, isPrivate && s.pillWarn]}
                                        onPress={() => {
                                            Haptics.selectionAsync();
                                            setIsPrivate(true);
                                        }}
                                    >
                                        <Lock size={14} color={isPrivate ? '#FF9500' : '#8E8E93'} />
                                        <Text style={[s.pillText, isPrivate && s.pillTextWarn]}>Private</Text>
                                    </Pressable>
                                </View>
                            </View>
                        )}

                        {/* Checklist Section */}
                        <View style={s.section}>
                            <Text style={s.sectionLabel}>Checklist</Text>
                            <View style={s.checklistCard}>
                                {subtasks.map((st, i) => (
                                    <View key={st.id}>
                                        {i > 0 && <View style={s.checklistSeparator} />}
                                        <View style={s.checklistRow}>
                                            <Pressable
                                                style={s.checklistCircle}
                                                onPress={() => {
                                                    Keyboard.dismiss();
                                                    Haptics.selectionAsync();
                                                    setShowSubtaskEmojiPicker(st.id);
                                                }}
                                            >
                                                <Text style={s.checklistEmoji}>{st.emoji}</Text>
                                            </Pressable>
                                            <Text style={s.checklistTitle} numberOfLines={1}>{st.title}</Text>
                                            <Pressable onPress={() => removeSubtask(st.id)} hitSlop={8} style={s.checklistRemove}>
                                                <X size={14} color="#C7C7CC" strokeWidth={2.5} />
                                            </Pressable>
                                        </View>
                                    </View>
                                ))}
                                {subtasks.length > 0 && <View style={s.checklistSeparator} />}
                                <View style={s.checklistAddRow}>
                                    <View style={s.checklistAddIcon}>
                                        <Plus size={14} color="#007AFF" strokeWidth={2.5} />
                                    </View>
                                    <TextInput
                                        ref={subtaskInputRef}
                                        style={s.checklistInput}
                                        placeholder="Add item"
                                        placeholderTextColor="#C7C7CC"
                                        value={newSubtaskTitle}
                                        onChangeText={setNewSubtaskTitle}
                                        onSubmitEditing={() => {
                                            addSubtask();
                                            setTimeout(() => {
                                                subtaskInputRef.current?.focus();
                                                scrollViewRef.current?.scrollToEnd({ animated: true });
                                            }, 50);
                                        }}
                                        blurOnSubmit={false}
                                        returnKeyType="next"
                                        onFocus={() => {
                                            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 300);
                                        }}
                                    />
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* Date Picker */}
                <DatePickerModal
                    visible={showDatePicker}
                    onClose={() => setShowDatePicker(false)}
                    selectedDate={dueDate}
                    onSelectDate={setDueDate}
                />
            </SafeAreaView>

            {/* Emoji Picker */}
            <AnimatedBottomSheet
                visible={showEmojiPicker}
                onClose={() => setShowEmojiPicker(false)}
            >
                <View style={s.sheetHeader}>
                    <Pressable onPress={() => setShowEmojiPicker(false)} hitSlop={8}>
                        <X size={20} color="#1C1C1E" strokeWidth={2} />
                    </Pressable>
                    <Text style={s.sheetTitle}>Choose Icon</Text>
                    <Pressable onPress={() => setShowEmojiPicker(false)} hitSlop={8}>
                        <Check size={20} color="#007AFF" strokeWidth={2} />
                    </Pressable>
                </View>
                <View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.emojiScrollContent}>
                        <View style={s.emojiRows}>
                            <View style={s.emojiRow}>
                                {EMOJI_OPTIONS.filter((_, i) => i % 2 === 0).map(e => {
                                    const active = emoji === e;
                                    return (
                                        <Pressable
                                            key={e}
                                            style={[s.emojiOption, active && s.emojiOptionActive]}
                                            onPress={() => {
                                                Haptics.selectionAsync();
                                                setEmoji(active ? undefined : e);
                                            }}
                                        >
                                            <Text style={s.emojiText}>{e}</Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                            <View style={s.emojiRow}>
                                {EMOJI_OPTIONS.filter((_, i) => i % 2 === 1).map(e => {
                                    const active = emoji === e;
                                    return (
                                        <Pressable
                                            key={e}
                                            style={[s.emojiOption, active && s.emojiOptionActive]}
                                            onPress={() => {
                                                Haptics.selectionAsync();
                                                setEmoji(active ? undefined : e);
                                            }}
                                        >
                                            <Text style={s.emojiText}>{e}</Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </View>
                    </ScrollView>
                    <LinearGradient
                        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={s.emojiScrollFade}
                        pointerEvents="none"
                    />
                </View>
            </AnimatedBottomSheet>

            {/* Subtask Emoji Picker */}
            <AnimatedBottomSheet
                visible={showSubtaskEmojiPicker !== null}
                onClose={() => setShowSubtaskEmojiPicker(null)}
            >
                <View style={s.sheetHeader}>
                    <Text style={s.sheetTitle}>Choose Icon</Text>
                    <Pressable onPress={() => setShowSubtaskEmojiPicker(null)}>
                        <Text style={s.sheetDone}>Done</Text>
                    </Pressable>
                </View>
                <View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.emojiScrollContent}>
                        <View style={s.emojiRows}>
                            <View style={s.emojiRow}>
                                {EMOJI_OPTIONS.filter((_, i) => i % 2 === 0).map(e => (
                                    <Pressable
                                        key={e}
                                        style={s.emojiOption}
                                        onPress={() => {
                                            Haptics.selectionAsync();
                                            if (showSubtaskEmojiPicker) {
                                                updateSubtaskEmoji(showSubtaskEmojiPicker, e);
                                            }
                                        }}
                                    >
                                        <Text style={s.emojiText}>{e}</Text>
                                    </Pressable>
                                ))}
                            </View>
                            <View style={s.emojiRow}>
                                {EMOJI_OPTIONS.filter((_, i) => i % 2 === 1).map(e => (
                                    <Pressable
                                        key={e}
                                        style={s.emojiOption}
                                        onPress={() => {
                                            Haptics.selectionAsync();
                                            if (showSubtaskEmojiPicker) {
                                                updateSubtaskEmoji(showSubtaskEmojiPicker, e);
                                            }
                                        }}
                                    >
                                        <Text style={s.emojiText}>{e}</Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>
                    </ScrollView>
                    <LinearGradient
                        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={s.emojiScrollFade}
                        pointerEvents="none"
                    />
                </View>
            </AnimatedBottomSheet>
        </View>
    );
}

const s = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    container: {
        flex: 1,
    },
    headerArea: {
        paddingTop: 6,
    },
    handle: {
        width: 36,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: '#E5E5EA',
        alignSelf: 'center',
        marginBottom: 6,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 44,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#C7C7CC',
    },
    saveTextActive: {
        color: '#007AFF',
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: 120,
    },

    // Title area
    titleArea: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginBottom: 32,
        paddingTop: 8,
    },
    titleInput: {
        flex: 1,
        fontSize: 24,
        fontWeight: '600',
        color: '#1C1C1E',
        letterSpacing: -0.4,
        paddingVertical: 4,
    },
    emojiBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emojiBtnText: {
        fontSize: 24,
    },

    // Sections
    section: {
        marginBottom: 32,
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: '#999',
        letterSpacing: 0.3,
        marginBottom: 10,
    },
    pillRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 100,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    pillCompact: {
        paddingHorizontal: 14,
    },
    pillActive: {
        backgroundColor: 'rgba(0, 122, 255, 0.07)',
        borderColor: 'rgba(0, 122, 255, 0.28)',
    },
    pillWarn: {
        backgroundColor: 'rgba(255, 149, 0, 0.07)',
        borderColor: 'rgba(255, 149, 0, 0.28)',
    },
    pillIcon: {
        fontSize: 14,
    },
    pillText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#3C3C43',
    },
    pillTextActive: {
        color: '#007AFF',
    },
    pillTextWarn: {
        color: '#FF9500',
    },

    // Checklist
    checklistCard: {
        backgroundColor: '#FAFAFA',
        borderRadius: 12,
        overflow: 'hidden',
    },
    checklistSeparator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#E5E5EA',
        marginLeft: 48,
    },
    checklistRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 14,
        gap: 10,
    },
    checklistCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#EEEEEF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checklistEmoji: {
        fontSize: 15,
    },
    checklistTitle: {
        flex: 1,
        fontSize: 16,
        color: '#1C1C1E',
    },
    checklistRemove: {
        padding: 4,
    },
    checklistAddRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 14,
        gap: 10,
    },
    checklistAddIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: '#007AFF',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checklistInput: {
        flex: 1,
        fontSize: 16,
        color: '#1C1C1E',
        paddingVertical: 2,
    },

    // Sheet styles
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    sheetTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    sheetDone: {
        fontSize: 17,
        fontWeight: '600',
        color: '#007AFF',
    },

    // Emoji grid
    emojiScrollContent: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 16,
    },
    emojiRows: {
        gap: 8,
    },
    emojiRow: {
        flexDirection: 'row',
        gap: 8,
    },
    emojiOption: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emojiOptionActive: {
        backgroundColor: '#007AFF',
    },
    emojiText: {
        fontSize: 22,
    },
    emojiScrollFade: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 40,
    },
});
