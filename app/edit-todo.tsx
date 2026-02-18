import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Check, Plus, GripVertical, Clock, Calendar, Repeat, Sunrise, ChevronDown } from 'lucide-react-native';
import React, { useState, useMemo, useRef, useCallback } from 'react';
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
    LayoutAnimation,
    UIManager,
    type ScrollView as ScrollViewType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTodos } from '@/contexts/TodoContext';
import { format, parseISO } from 'date-fns';
import { DatePickerModal } from '@/components/DatePickerModal';
import { AnimatedBottomSheet } from '@/components/AnimatedBottomSheet';
import { LinearGradient } from 'expo-linear-gradient';
import { AmbientBackground } from '@/components/AmbientBackground';
import type { TimeOfDay, RepeatOption, Subtask } from '@/types/todo';

if (Platform.OS === 'android') {
    UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

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

function formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
}

type ExpandableField = 'timeOfDay' | 'duration' | 'repeat' | null;

export default function EditTodoScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { todos, updateTodo } = useTodos();

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
    const [subtasks, setSubtasks] = useState<{ id: string; title: string; emoji: string }[]>(
        (todo?.subtasks ?? []).map(st => ({ id: st.id, title: st.title, emoji: st.emoji ?? '📋' }))
    );
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const scrollViewRef = useRef<ScrollViewType>(null);

    // Inline expanding pickers
    const [expandedField, setExpandedField] = useState<ExpandableField>(null);

    // Bottom sheets (emoji pickers only)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showSubtaskEmojiPicker, setShowSubtaskEmojiPicker] = useState<string | null>(null);

    const toggleField = useCallback((field: ExpandableField) => {
        Haptics.selectionAsync();
        LayoutAnimation.configureNext({
            duration: 250,
            update: { type: 'easeInEaseOut', property: 'opacity' },
            create: { type: 'easeInEaseOut', property: 'opacity' },
            delete: { type: 'easeInEaseOut', property: 'opacity' },
        });
        setExpandedField(prev => prev === field ? null : field);
    }, []);

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
            });
            router.back();
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

    const getTimeOfDayLabel = (): string => {
        if (!timeOfDay) return 'Not set';
        const opt = TIME_OF_DAY_OPTIONS.find(o => o.value === timeOfDay);
        return opt ? `${opt.icon} ${opt.label}` : 'Not set';
    };

    const getDateLabel = (): string => {
        if (!dueDate) return 'Not set';
        return format(dueDate, 'MMM d, yyyy');
    };

    const getDurationLabel = (): string => {
        if (!estimatedMinutes) return 'Not set';
        return formatDuration(estimatedMinutes);
    };

    const getRepeatLabel = (): string => {
        if (repeat === 'none') return 'None';
        const opt = REPEAT_OPTIONS.find(o => o.value === repeat);
        return opt ? opt.label : 'None';
    };

    const canSave = title.trim().length > 0;

    return (
        <View style={{ flex: 1 }}>
            <AmbientBackground />
            <SafeAreaView style={styles.container} edges={['top']}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Pressable onPress={() => router.back()} style={styles.headerButton} hitSlop={8}>
                            <X size={22} color="#1C1C1E" strokeWidth={2} />
                        </Pressable>
                        <Text style={styles.headerTitle}>Edit task</Text>
                        <Pressable
                            style={[styles.saveButton, canSave && styles.saveButtonActive]}
                            onPress={handleSave}
                            disabled={!canSave}
                            hitSlop={8}
                        >
                            <Check size={20} color={canSave ? '#fff' : '#C7C7CC'} strokeWidth={2.5} />
                        </Pressable>
                    </View>

                    <ScrollView
                        ref={scrollViewRef}
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="interactive"
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Title Card */}
                        <View style={styles.card}>
                            <View style={styles.titleRow}>
                                <TextInput
                                    style={styles.titleInput}
                                    placeholder="Task name"
                                    placeholderTextColor="#B0B0B5"
                                    value={title}
                                    onChangeText={setTitle}
                                    autoFocus
                                    multiline={false}
                                />
                                <Pressable
                                    style={styles.emojiButton}
                                    onPress={() => {
                                        Keyboard.dismiss();
                                        Haptics.selectionAsync();
                                        setShowEmojiPicker(true);
                                    }}
                                >
                                    <Text style={styles.emojiButtonText}>{emoji || '🌤'}</Text>
                                </Pressable>
                            </View>
                        </View>

                        {/* Fields Card */}
                        <View style={styles.card}>
                            {/* Time of Day */}
                            <Pressable
                                style={styles.fieldRow}
                                onPress={() => toggleField('timeOfDay')}
                            >
                                <View style={styles.fieldLabelRow}>
                                    <Sunrise size={16} color="#8E8E93" />
                                    <Text style={styles.fieldLabel}>Time of day</Text>
                                </View>
                                {expandedField !== 'timeOfDay' && (
                                    <View style={styles.fieldValue}>
                                        <Text style={styles.fieldValueText}>{getTimeOfDayLabel()}</Text>
                                        <ChevronDown size={14} color="#C7C7CC" />
                                    </View>
                                )}
                            </Pressable>
                            {expandedField === 'timeOfDay' && (
                                <View style={styles.inlineOptions}>
                                    {TIME_OF_DAY_OPTIONS.map(opt => {
                                        const active = timeOfDay === opt.value;
                                        return (
                                            <Pressable
                                                key={opt.value}
                                                style={[styles.inlineChip, active && styles.inlineChipActive]}
                                                onPress={() => {
                                                    Haptics.selectionAsync();
                                                    setTimeOfDay(active ? undefined : opt.value);
                                                    toggleField(null);
                                                }}
                                            >
                                                <Text style={styles.inlineChipIcon}>{opt.icon}</Text>
                                                <Text style={[styles.inlineChipText, active && styles.inlineChipTextActive]}>{opt.label}</Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            )}

                            <View style={styles.fieldSeparator} />

                            {/* Date */}
                            <Pressable
                                style={styles.fieldRow}
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    if (expandedField) {
                                        LayoutAnimation.configureNext({
                                            duration: 250,
                                            update: { type: 'easeInEaseOut', property: 'opacity' },
                                            create: { type: 'easeInEaseOut', property: 'opacity' },
                                            delete: { type: 'easeInEaseOut', property: 'opacity' },
                                        });
                                        setExpandedField(null);
                                    }
                                    setShowDatePicker(true);
                                }}
                            >
                                <View style={styles.fieldLabelRow}>
                                    <Calendar size={16} color="#8E8E93" />
                                    <Text style={styles.fieldLabel}>Date</Text>
                                </View>
                                <View style={styles.fieldValue}>
                                    <Text style={styles.fieldValueText}>{getDateLabel()}</Text>
                                </View>
                            </Pressable>

                            <View style={styles.fieldSeparator} />

                            {/* Duration */}
                            <Pressable
                                style={styles.fieldRow}
                                onPress={() => toggleField('duration')}
                            >
                                <View style={styles.fieldLabelRow}>
                                    <Clock size={16} color="#8E8E93" />
                                    <Text style={styles.fieldLabel}>Duration</Text>
                                </View>
                                {expandedField !== 'duration' && (
                                    <View style={styles.fieldValue}>
                                        <Text style={styles.fieldValueText}>{getDurationLabel()}</Text>
                                        <ChevronDown size={14} color="#C7C7CC" />
                                    </View>
                                )}
                            </Pressable>
                            {expandedField === 'duration' && (
                                <View style={styles.inlineOptions}>
                                    <Pressable
                                        style={[styles.inlineChip, !estimatedMinutes && styles.inlineChipActive]}
                                        onPress={() => {
                                            Haptics.selectionAsync();
                                            setEstimatedMinutes(undefined);
                                            toggleField(null);
                                        }}
                                    >
                                        <Text style={[styles.inlineChipText, !estimatedMinutes && styles.inlineChipTextActive]}>None</Text>
                                    </Pressable>
                                    {DURATION_OPTIONS.map(opt => {
                                        const active = estimatedMinutes === opt.value;
                                        return (
                                            <Pressable
                                                key={opt.value}
                                                style={[styles.inlineChip, active && styles.inlineChipActive]}
                                                onPress={() => {
                                                    Haptics.selectionAsync();
                                                    setEstimatedMinutes(opt.value);
                                                    toggleField(null);
                                                }}
                                            >
                                                <Text style={[styles.inlineChipText, active && styles.inlineChipTextActive]}>{opt.label}</Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            )}

                            <View style={styles.fieldSeparator} />

                            {/* Repeat */}
                            <Pressable
                                style={styles.fieldRow}
                                onPress={() => toggleField('repeat')}
                            >
                                <View style={styles.fieldLabelRow}>
                                    <Repeat size={16} color="#8E8E93" />
                                    <Text style={styles.fieldLabel}>Repeat</Text>
                                </View>
                                {expandedField !== 'repeat' && (
                                    <View style={styles.fieldValue}>
                                        <Text style={styles.fieldValueText}>{getRepeatLabel()}</Text>
                                        <ChevronDown size={14} color="#C7C7CC" />
                                    </View>
                                )}
                            </Pressable>
                            {expandedField === 'repeat' && (
                                <View style={styles.inlineOptions}>
                                    {REPEAT_OPTIONS.map(opt => {
                                        const active = repeat === opt.value;
                                        return (
                                            <Pressable
                                                key={opt.value}
                                                style={[styles.inlineChip, active && styles.inlineChipActive]}
                                                onPress={() => {
                                                    Haptics.selectionAsync();
                                                    setRepeat(opt.value);
                                                    toggleField(null);
                                                }}
                                            >
                                                {opt.icon ? <Text style={styles.inlineChipIcon}>{opt.icon}</Text> : null}
                                                <Text style={[styles.inlineChipText, active && styles.inlineChipTextActive]}>{opt.label}</Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            )}
                        </View>

                        {/* Sub-tasks Card */}
                        <View style={styles.card}>
                            <Text style={styles.subtaskHeader}>Sub-tasks</Text>

                            {subtasks.map((st) => (
                                <View key={st.id}>
                                    <View style={styles.fieldSeparator} />
                                    <View style={styles.subtaskRow}>
                                        <Pressable
                                            style={styles.subtaskEmoji}
                                            onPress={() => {
                                                Keyboard.dismiss();
                                                Haptics.selectionAsync();
                                                setShowSubtaskEmojiPicker(st.id);
                                            }}
                                        >
                                            <Text style={styles.subtaskEmojiText}>{st.emoji}</Text>
                                        </Pressable>
                                        <Text style={styles.subtaskTitle} numberOfLines={1}>{st.title}</Text>
                                        <Pressable
                                            onPress={() => removeSubtask(st.id)}
                                            hitSlop={8}
                                            style={styles.dragHandle}
                                        >
                                            <GripVertical size={18} color="#C7C7CC" />
                                        </Pressable>
                                    </View>
                                </View>
                            ))}
                        </View>

                        {/* Add New Subtask */}
                        <Pressable
                            style={styles.addNewButton}
                            onPress={() => {
                                if (newSubtaskTitle.trim()) {
                                    addSubtask();
                                } else {
                                    Haptics.selectionAsync();
                                }
                            }}
                        >
                            <Text style={styles.addNewText}>ADD NEW</Text>
                            <Plus size={16} color="#8E8E93" />
                        </Pressable>

                        {/* Inline subtask input */}
                        <View style={styles.subtaskInputCard}>
                            <TextInput
                                style={styles.subtaskInput}
                                placeholder="New sub-task name..."
                                placeholderTextColor="#C7C7CC"
                                value={newSubtaskTitle}
                                onChangeText={setNewSubtaskTitle}
                                onSubmitEditing={addSubtask}
                                returnKeyType="done"
                                onFocus={() => {
                                    setTimeout(() => {
                                        scrollViewRef.current?.scrollToEnd({ animated: true });
                                    }, 300);
                                }}
                            />
                            {newSubtaskTitle.trim().length > 0 && (
                                <Pressable onPress={addSubtask} style={styles.subtaskAddBtn} hitSlop={8}>
                                    <Plus size={18} color="#fff" />
                                </Pressable>
                            )}
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
                <View style={styles.sheetHeaderRow}>
                    <Text style={styles.sheetTitle}>Choose Icon</Text>
                    <Pressable onPress={() => setShowEmojiPicker(false)}>
                        <Text style={styles.sheetDone}>Done</Text>
                    </Pressable>
                </View>
                <View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.emojiScrollContent}>
                        <View style={styles.emojiRows}>
                            <View style={styles.emojiRow}>
                                {EMOJI_OPTIONS.filter((_, i) => i % 2 === 0).map(e => {
                                    const active = emoji === e;
                                    return (
                                        <Pressable
                                            key={e}
                                            style={[styles.emojiOption, active && styles.emojiOptionActive]}
                                            onPress={() => {
                                                Haptics.selectionAsync();
                                                setEmoji(active ? undefined : e);
                                            }}
                                        >
                                            <Text style={styles.emojiText}>{e}</Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                            <View style={styles.emojiRow}>
                                {EMOJI_OPTIONS.filter((_, i) => i % 2 === 1).map(e => {
                                    const active = emoji === e;
                                    return (
                                        <Pressable
                                            key={e}
                                            style={[styles.emojiOption, active && styles.emojiOptionActive]}
                                            onPress={() => {
                                                Haptics.selectionAsync();
                                                setEmoji(active ? undefined : e);
                                            }}
                                        >
                                            <Text style={styles.emojiText}>{e}</Text>
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
                        style={styles.emojiScrollFade}
                        pointerEvents="none"
                    />
                </View>
            </AnimatedBottomSheet>

            {/* Subtask Emoji Picker */}
            <AnimatedBottomSheet
                visible={showSubtaskEmojiPicker !== null}
                onClose={() => setShowSubtaskEmojiPicker(null)}
            >
                <View style={styles.sheetHeaderRow}>
                    <Text style={styles.sheetTitle}>Choose Icon</Text>
                    <Pressable onPress={() => setShowSubtaskEmojiPicker(null)}>
                        <Text style={styles.sheetDone}>Done</Text>
                    </Pressable>
                </View>
                <View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.emojiScrollContent}>
                        <View style={styles.emojiRows}>
                            <View style={styles.emojiRow}>
                                {EMOJI_OPTIONS.filter((_, i) => i % 2 === 0).map(e => (
                                    <Pressable
                                        key={e}
                                        style={styles.emojiOption}
                                        onPress={() => {
                                            Haptics.selectionAsync();
                                            if (showSubtaskEmojiPicker) {
                                                updateSubtaskEmoji(showSubtaskEmojiPicker, e);
                                            }
                                        }}
                                    >
                                        <Text style={styles.emojiText}>{e}</Text>
                                    </Pressable>
                                ))}
                            </View>
                            <View style={styles.emojiRow}>
                                {EMOJI_OPTIONS.filter((_, i) => i % 2 === 1).map(e => (
                                    <Pressable
                                        key={e}
                                        style={styles.emojiOption}
                                        onPress={() => {
                                            Haptics.selectionAsync();
                                            if (showSubtaskEmojiPicker) {
                                                updateSubtaskEmoji(showSubtaskEmojiPicker, e);
                                            }
                                        }}
                                    >
                                        <Text style={styles.emojiText}>{e}</Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>
                    </ScrollView>
                    <LinearGradient
                        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.emojiScrollFade}
                        pointerEvents="none"
                    />
                </View>
            </AnimatedBottomSheet>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        height: 56,
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F2F2F7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1C1C1E',
        letterSpacing: -0.4,
    },
    saveButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#E5E5EA',
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveButtonActive: {
        backgroundColor: '#007AFF',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 100,
        gap: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    titleInput: {
        flex: 1,
        fontSize: 18,
        fontWeight: '500',
        color: '#1C1C1E',
        letterSpacing: -0.2,
        paddingVertical: 4,
    },
    emojiButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFF8E7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emojiButtonText: {
        fontSize: 22,
    },
    // Field rows
    fieldRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
    },
    fieldLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    fieldLabel: {
        fontSize: 16,
        fontWeight: '400',
        color: '#1C1C1E',
    },
    fieldValue: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F2F2F7',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    fieldValueText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#3C3C43',
    },
    fieldSeparator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#E5E5EA',
    },
    // Inline option chips
    inlineOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        paddingBottom: 8,
    },
    inlineChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#F2F2F7',
    },
    inlineChipActive: {
        backgroundColor: '#1C1C1E',
    },
    inlineChipIcon: {
        fontSize: 15,
    },
    inlineChipText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#3C3C43',
    },
    inlineChipTextActive: {
        color: '#fff',
    },
    // Subtask section
    subtaskHeader: {
        fontSize: 16,
        fontWeight: '500',
        color: '#8E8E93',
        marginBottom: 4,
    },
    subtaskRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        gap: 12,
    },
    subtaskEmoji: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    subtaskEmojiText: {
        fontSize: 18,
    },
    subtaskTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: '#1C1C1E',
    },
    dragHandle: {
        padding: 4,
    },
    addNewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 14,
    },
    addNewText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8E8E93',
        letterSpacing: 0.5,
    },
    subtaskInputCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    subtaskInput: {
        flex: 1,
        fontSize: 15,
        color: '#1C1C1E',
        paddingVertical: 4,
    },
    subtaskAddBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#007AFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Sheet header (used inside AnimatedBottomSheet)
    sheetHeaderRow: {
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
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emojiOptionActive: {
        backgroundColor: '#007AFF',
    },
    emojiText: {
        fontSize: 24,
    },
    emojiScrollFade: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 40,
    },
});
