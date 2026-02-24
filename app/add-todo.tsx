import { useRouter, useLocalSearchParams } from 'expo-router';
import { useGoBack } from '@/lib/useGoBack';
import { X, Check, Plus, GripVertical, Clock, Calendar, Repeat, Sunrise, ChevronDown, Lock, LockOpen, UserPlus } from 'lucide-react-native';
import React, { useState, useCallback, useRef } from 'react';
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
    Alert,
    type ScrollView as ScrollViewType,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    withDelay,
    runOnJS,
    interpolateColor,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from '@/lib/haptics';
import { useTodos } from '@/contexts/TodoContext';
import { useWorkMode } from '@/contexts/WorkModeContext';
import { usePartnership } from '@/contexts/PartnershipContext';
import { format } from 'date-fns';
import { DatePickerModal } from '@/components/DatePickerModal';
import { AnimatedBottomSheet } from '@/components/AnimatedBottomSheet';
import { LinearGradient } from 'expo-linear-gradient';
import { suggestEmoji } from '@/utils/emojiSuggest';
import { AmbientBackground } from '@/components/AmbientBackground';
import { assignTaskToPartner } from '@/lib/sync';
import { useSync } from '@/contexts/SyncContext';
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

const EMOJI_BG_COLORS = [
    '#D4C5F0', '#C8B8E8', '#E0D4F5', '#EDE5FA', '#F5F0FF',
    '#C5D8F0', '#D4E4F7', '#E3EDFB', '#B8D8E8', '#D0EAF0',
    '#B8E0C8', '#C8E8D4', '#D8F0E4', '#A8D8B8', '#C0E8C8',
    '#F0D4D8', '#F5DDE0', '#FAE8EA', '#E8C0C8', '#F0D0D8',
    '#F0D8C0', '#F5E0CC', '#FAE8D8', '#E8C8A8', '#F0D4B8',
    '#F0ECC0', '#F5F0CC', '#FAF5D8', '#E8E4A8', '#F0ECB8',
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

export default function AddTodoScreen() {
    const router = useRouter();
    const goBack = useGoBack();
    const { addTodo } = useTodos();
    const { isWorkMode } = useWorkMode();
    const { activePartners, hasActivePartnership, getPartnership } = usePartnership();
    const { syncNow } = useSync();
    const { timeOfDay: initialTimeOfDay, forPartnerId } = useLocalSearchParams<{ timeOfDay?: string; forPartnerId?: string }>();
    const hasPartner = hasActivePartnership;
    const [assignToPartnerId, setAssignToPartnerId] = useState<string | null>(forPartnerId ?? null);
    const assignToPartner = !!assignToPartnerId;
    const assignedPartnership = assignToPartnerId ? getPartnership(assignToPartnerId) : (activePartners.length === 1 ? activePartners[0] : null);

    const [title, setTitle] = useState('');
    const [emoji, setEmoji] = useState<string | undefined>('🌤');
    const [emojiColor, setEmojiColor] = useState<string | undefined>(undefined);
    const userPickedEmoji = useRef(false);

    const handleTitleChange = useCallback((text: string) => {
        setTitle(text);
        if (!userPickedEmoji.current) {
            setEmoji(suggestEmoji(text) || '🌤');
        }
    }, []);
    const [dueDate, setDueDate] = useState<Date | null>(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [estimatedMinutes, setEstimatedMinutes] = useState<number | undefined>(undefined);
    const [repeat, setRepeat] = useState<RepeatOption>('none');
    const [timeOfDay, setTimeOfDay] = useState<TimeOfDay | undefined>(() => {
        if (initialTimeOfDay && ['anytime', 'morning', 'afternoon', 'evening'].includes(initialTimeOfDay)) {
            return initialTimeOfDay as TimeOfDay;
        }
        return undefined;
    });
    const [isPrivate, setIsPrivate] = useState(false);
    const [subtasks, setSubtasks] = useState<{ id: string; title: string; emoji: string }[]>([]);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const subtaskInputRef = useRef<TextInput>(null);
    const scrollViewRef = useRef<ScrollViewType>(null);

    // Save animation
    const [saving, setSaving] = useState(false);
    const saveTextOpacity = useSharedValue(1);
    const checkScale = useSharedValue(0);
    const checkOpacity = useSharedValue(0);
    const buttonColorProgress = useSharedValue(0);
    const contentScale = useSharedValue(1);
    const contentOpacity = useSharedValue(1);

    const saveTextStyle = useAnimatedStyle(() => ({
        opacity: saveTextOpacity.value,
    }));
    const checkStyle = useAnimatedStyle(() => ({
        opacity: checkOpacity.value,
        transform: [{ scale: checkScale.value }],
    }));
    const buttonBgStyle = useAnimatedStyle(() => ({
        backgroundColor: interpolateColor(
            buttonColorProgress.value,
            [0, 1],
            ['transparent', '#007AFF'],
        ),
        borderRadius: 8,
    }));
    const contentAnimStyle = useAnimatedStyle(() => ({
        transform: [{ scale: contentScale.value }],
        opacity: contentOpacity.value,
    }));

    // Inline expanding pickers
    const [expandedField, setExpandedField] = useState<ExpandableField>(null);

    // Bottom sheets (emoji pickers only)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showSubtaskEmojiPicker, setShowSubtaskEmojiPicker] = useState<string | null>(null);
    const [editingSubtask, setEditingSubtask] = useState<{ id: string; title: string; emoji: string } | null>(null);

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

    const dismiss = useCallback(() => {
        goBack();
    }, [goBack]);

    const handleSave = async () => {
        if (title.trim() && !saving) {
            setSaving(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            const subtaskData: Subtask[] = subtasks.map(st => ({
                id: st.id,
                title: st.title,
                emoji: st.emoji,
                completed: false,
            }));

            if (assignToPartner && hasPartner) {
                const targetPartnerId = assignToPartnerId ?? assignedPartnership?.partner_id ?? undefined;
                const result = await assignTaskToPartner({
                    id: generateId(),
                    title: title.trim(),
                    createdAt: new Date().toISOString(),
                    dueDate: (dueDate || new Date()).toISOString().split('T')[0],
                    dueTime: undefined,
                    priority: undefined,
                    isWork: isWorkMode,
                    emoji,
                    emojiColor,
                    estimatedMinutes,
                    timeOfDay,
                    repeat: repeat !== 'none' ? repeat : undefined,
                    subtasks: subtaskData.length > 0 ? subtaskData : undefined,
                }, targetPartnerId);

                if (result.error) {
                    setSaving(false);
                    Alert.alert('Could not assign task', result.error);
                    return;
                }

                // Push local data so partner view stays current
                syncNow();
            } else {
                addTodo(title.trim(), dueDate || new Date(), undefined, isWorkMode, undefined, {
                    emoji,
                    emojiColor,
                    estimatedMinutes,
                    timeOfDay,
                    repeat: repeat !== 'none' ? repeat : undefined,
                    subtasks: subtaskData.length > 0 ? subtaskData : undefined,
                    isPrivate: isPrivate || undefined,
                });
            }

            // Button morph: fade out text, spring in checkmark, flash blue
            saveTextOpacity.value = withTiming(0, { duration: 150 });
            checkOpacity.value = withTiming(1, { duration: 150 });
            checkScale.value = withSpring(1, { damping: 12, stiffness: 200 });
            buttonColorProgress.value = withTiming(1, { duration: 200 });

            // Content settle + dismiss after animation completes
            contentScale.value = withTiming(0.97, { duration: 250 });
            contentOpacity.value = withDelay(150, withTiming(0.4, { duration: 250 }, () => {
                runOnJS(dismiss)();
            }));
        }
    };

    const addSubtask = () => {
        if (newSubtaskTitle.trim()) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const trimmed = newSubtaskTitle.trim();
            setSubtasks(prev => [...prev, {
                id: generateId(),
                title: trimmed,
                emoji: suggestEmoji(trimmed) || '📋',
            }]);
            setNewSubtaskTitle('');
        }
    };

    const removeSubtask = (id: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSubtasks(prev => prev.filter(st => st.id !== id));
    };

    const updateSubtaskEmoji = (id: string, newEmoji: string) => {
        setSubtasks(prev => prev.map(st => st.id === id ? { ...st, emoji: newEmoji } : st));
        setShowSubtaskEmojiPicker(null);
    };

    const startEditingSubtask = (st: { id: string; title: string; emoji: string }) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setEditingSubtask({ ...st });
    };

    const saveEditingSubtask = () => {
        if (editingSubtask && editingSubtask.title.trim()) {
            setSubtasks(prev => prev.map(st =>
                st.id === editingSubtask.id
                    ? { ...st, title: editingSubtask.title.trim(), emoji: editingSubtask.emoji }
                    : st
            ));
        }
        setEditingSubtask(null);
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
                    <View style={styles.headerContainer}>
                        <View style={styles.modalHandleTop} />
                        <View style={styles.header}>
                            <Pressable onPress={goBack} style={styles.cancelButton} hitSlop={8}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </Pressable>
                            <Text style={styles.headerTitle}>
                                {assignToPartner && hasPartner && assignedPartnership
                                    ? `For ${assignedPartnership.partner_name?.split(' ')[0] ?? 'Partner'}`
                                    : 'New Task'}
                            </Text>
                            <Animated.View style={[styles.saveButton, buttonBgStyle]}>
                                <Pressable
                                    onPress={handleSave}
                                    disabled={!canSave || saving}
                                    hitSlop={8}
                                    style={styles.saveButtonInner}
                                >
                                    <Animated.Text style={[styles.saveText, canSave && styles.saveTextActive, saveTextStyle]}>Add</Animated.Text>
                                    <Animated.View style={[styles.checkOverlay, checkStyle]}>
                                        <Check size={18} color="#fff" strokeWidth={3} />
                                    </Animated.View>
                                </Pressable>
                            </Animated.View>
                        </View>
                    </View>

                    <ScrollView
                        ref={scrollViewRef}
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="interactive"
                        showsVerticalScrollIndicator={false}
                    >
                      <Animated.View style={contentAnimStyle}>
                        {/* Title Card */}
                        <View style={styles.card}>
                            <View style={styles.titleRow}>
                                <TextInput
                                    style={styles.titleInput}
                                    placeholder="Task name"
                                    placeholderTextColor="#B0B0B5"
                                    value={title}
                                    onChangeText={handleTitleChange}
                                    autoFocus
                                    multiline={false}
                                />
                                <Pressable
                                    style={[styles.emojiButton, emojiColor ? { backgroundColor: emojiColor } : undefined]}
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

                            {hasPartner && (
                                <>
                                    <View style={styles.fieldSeparator} />
                                    {activePartners.length === 1 ? (
                                        /* Single partner: simple toggle */
                                        <Pressable
                                            style={styles.fieldRow}
                                            onPress={() => {
                                                Haptics.selectionAsync();
                                                if (assignToPartnerId) {
                                                    setAssignToPartnerId(null);
                                                } else {
                                                    setAssignToPartnerId(activePartners[0].partner_id!);
                                                    setIsPrivate(false);
                                                }
                                            }}
                                        >
                                            <View style={styles.fieldLabelRow}>
                                                <UserPlus size={16} color={assignToPartner ? '#007AFF' : '#8E8E93'} />
                                                <Text style={styles.fieldLabel}>
                                                    For {activePartners[0].partner_name?.split(' ')[0] ?? 'Partner'}
                                                </Text>
                                            </View>
                                            <View style={[styles.fieldValue, assignToPartner && styles.fieldValueAssign]}>
                                                <Text style={[styles.fieldValueText, assignToPartner && styles.fieldValueTextAssign]}>
                                                    {assignToPartner ? 'Assigned' : 'Off'}
                                                </Text>
                                            </View>
                                        </Pressable>
                                    ) : (
                                        /* Multiple partners: show each partner as an option */
                                        <>
                                            {activePartners.map((p) => {
                                                const isSelected = assignToPartnerId === p.partner_id;
                                                return (
                                                    <React.Fragment key={p.partner_id}>
                                                        <Pressable
                                                            style={styles.fieldRow}
                                                            onPress={() => {
                                                                Haptics.selectionAsync();
                                                                if (isSelected) {
                                                                    setAssignToPartnerId(null);
                                                                } else {
                                                                    setAssignToPartnerId(p.partner_id!);
                                                                    setIsPrivate(false);
                                                                }
                                                            }}
                                                        >
                                                            <View style={styles.fieldLabelRow}>
                                                                <UserPlus size={16} color={isSelected ? '#007AFF' : '#8E8E93'} />
                                                                <Text style={styles.fieldLabel}>
                                                                    For {p.partner_name?.split(' ')[0] ?? 'Partner'}
                                                                </Text>
                                                            </View>
                                                            <View style={[styles.fieldValue, isSelected && styles.fieldValueAssign]}>
                                                                <Text style={[styles.fieldValueText, isSelected && styles.fieldValueTextAssign]}>
                                                                    {isSelected ? 'Assigned' : 'Off'}
                                                                </Text>
                                                            </View>
                                                        </Pressable>
                                                        <View style={styles.fieldSeparator} />
                                                    </React.Fragment>
                                                );
                                            })}
                                        </>
                                    )}

                                    {!assignToPartner && (
                                        <>
                                            <View style={styles.fieldSeparator} />
                                            <Pressable
                                                style={styles.fieldRow}
                                                onPress={() => {
                                                    Haptics.selectionAsync();
                                                    setIsPrivate(!isPrivate);
                                                }}
                                            >
                                                <View style={styles.fieldLabelRow}>
                                                    {isPrivate ? (
                                                        <Lock size={16} color="#FF9500" />
                                                    ) : (
                                                        <LockOpen size={16} color="#8E8E93" />
                                                    )}
                                                    <Text style={styles.fieldLabel}>Private</Text>
                                                </View>
                                                <View style={[styles.fieldValue, isPrivate && styles.fieldValuePrivate]}>
                                                    <Text style={[styles.fieldValueText, isPrivate && styles.fieldValueTextPrivate]}>
                                                        {isPrivate ? 'Hidden from partners' : 'Shared'}
                                                    </Text>
                                                </View>
                                            </Pressable>
                                        </>
                                    )}
                                </>
                            )}
                        </View>

                        {/* Sub-tasks Card */}
                        <View style={styles.card}>
                            <Text style={styles.subtaskHeader}>Sub-tasks</Text>

                            {subtasks.map((st) => (
                                <View key={st.id}>
                                    <View style={styles.fieldSeparator} />
                                    <Pressable
                                        style={styles.subtaskRow}
                                        onLongPress={() => startEditingSubtask(st)}
                                        delayLongPress={400}
                                    >
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
                                    </Pressable>
                                </View>
                            ))}
                        </View>

                        {/* Add New Subtask */}
                        <Pressable
                            style={styles.addNewButton}
                            onPress={() => {
                                Haptics.selectionAsync();
                                subtaskInputRef.current?.focus();
                            }}
                        >
                            <Text style={styles.addNewText}>ADD NEW</Text>
                            <Plus size={16} color="#8E8E93" />
                        </Pressable>

                        {/* Inline subtask input */}
                        <View style={styles.subtaskInputCard}>
                            <TextInput
                                ref={subtaskInputRef}
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
                      </Animated.View>
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

            {/* Choose Visuals Bottom Sheet */}
            <AnimatedBottomSheet
                visible={showEmojiPicker}
                onClose={() => setShowEmojiPicker(false)}
            >
                <View style={styles.sheetHeaderRow}>
                    <Pressable onPress={() => setShowEmojiPicker(false)} hitSlop={8}>
                        <X size={20} color="#1C1C1E" strokeWidth={2} />
                    </Pressable>
                    <Text style={styles.sheetTitle}>Choose visuals</Text>
                    <Pressable onPress={() => setShowEmojiPicker(false)} hitSlop={8}>
                        <Check size={20} color="#C7C7CC" strokeWidth={2} />
                    </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
                    {/* Preview */}
                    <View style={styles.visualsPreview}>
                        <View style={[styles.visualsPreviewCircle, { backgroundColor: emojiColor || '#F2E8F5' }]}>
                            <Text style={styles.visualsPreviewEmoji}>{emoji || '🌤'}</Text>
                        </View>
                        {(emoji || emojiColor) && (
                            <Pressable
                                style={styles.visualsClearBtn}
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    setEmoji(suggestEmoji(title));
                                    setEmojiColor(undefined);
                                    userPickedEmoji.current = false;
                                }}
                                hitSlop={8}
                            >
                                <X size={14} color="#8E8E93" strokeWidth={2.5} />
                            </Pressable>
                        )}
                    </View>

                    {/* Emoji grid */}
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
                                                    if (active) {
                                                        setEmoji(suggestEmoji(title));
                                                        userPickedEmoji.current = false;
                                                    } else {
                                                        setEmoji(e);
                                                        userPickedEmoji.current = true;
                                                    }
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
                                                    if (active) {
                                                        setEmoji(suggestEmoji(title));
                                                        userPickedEmoji.current = false;
                                                    } else {
                                                        setEmoji(e);
                                                        userPickedEmoji.current = true;
                                                    }
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

                    {/* Color grid */}
                    <View style={styles.colorGrid}>
                        <Pressable
                            style={[styles.colorOption, !emojiColor && styles.colorOptionActive]}
                            onPress={() => {
                                Haptics.selectionAsync();
                                setEmojiColor(undefined);
                            }}
                        >
                            <View style={styles.colorNoFill}>
                                <View style={styles.colorNoFillLine} />
                            </View>
                        </Pressable>
                        {EMOJI_BG_COLORS.map(c => {
                            const active = emojiColor === c;
                            return (
                                <Pressable
                                    key={c}
                                    style={[styles.colorOption, active && styles.colorOptionActive]}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setEmojiColor(c);
                                    }}
                                >
                                    <View style={[styles.colorSwatch, { backgroundColor: c }]} />
                                </Pressable>
                            );
                        })}
                    </View>
                </ScrollView>
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

            {/* Edit Subtask Sheet */}
            <AnimatedBottomSheet
                visible={editingSubtask !== null}
                onClose={saveEditingSubtask}
            >
                <View style={styles.sheetHeaderRow}>
                    <Text style={styles.sheetTitle}>Edit Sub-task</Text>
                    <Pressable onPress={saveEditingSubtask}>
                        <Text style={styles.sheetDone}>Done</Text>
                    </Pressable>
                </View>
                {editingSubtask && (
                    <View style={styles.editSubtaskContent}>
                        <View style={styles.editSubtaskNameRow}>
                            <Pressable style={styles.editSubtaskEmojiBtn}>
                                <Text style={styles.editSubtaskEmoji}>{editingSubtask.emoji}</Text>
                            </Pressable>
                            <TextInput
                                style={styles.editSubtaskInput}
                                value={editingSubtask.title}
                                onChangeText={(text) => setEditingSubtask(prev => prev ? { ...prev, title: text } : null)}
                                autoFocus
                                selectTextOnFocus
                                returnKeyType="done"
                                onSubmitEditing={saveEditingSubtask}
                            />
                        </View>
                        <View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.emojiScrollContent}>
                                <View style={styles.emojiRows}>
                                    <View style={styles.emojiRow}>
                                        {EMOJI_OPTIONS.filter((_, i) => i % 2 === 0).map(e => {
                                            const active = editingSubtask.emoji === e;
                                            return (
                                                <Pressable
                                                    key={e}
                                                    style={[styles.emojiOption, active && styles.emojiOptionActive]}
                                                    onPress={() => {
                                                        Haptics.selectionAsync();
                                                        setEditingSubtask(prev => prev ? { ...prev, emoji: e } : null);
                                                    }}
                                                >
                                                    <Text style={styles.emojiText}>{e}</Text>
                                                </Pressable>
                                            );
                                        })}
                                    </View>
                                    <View style={styles.emojiRow}>
                                        {EMOJI_OPTIONS.filter((_, i) => i % 2 === 1).map(e => {
                                            const active = editingSubtask.emoji === e;
                                            return (
                                                <Pressable
                                                    key={e}
                                                    style={[styles.emojiOption, active && styles.emojiOptionActive]}
                                                    onPress={() => {
                                                        Haptics.selectionAsync();
                                                        setEditingSubtask(prev => prev ? { ...prev, emoji: e } : null);
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
                    </View>
                )}
            </AnimatedBottomSheet>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    headerContainer: {
        paddingTop: 6,
    },
    modalHandleTop: {
        width: 36,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: '#DDDDE0',
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
    cancelButton: {
        minWidth: 60,
    },
    cancelText: {
        fontSize: 17,
        color: '#8E8E93',
        letterSpacing: -0.2,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1C1C1E',
        letterSpacing: -0.4,
    },
    saveButton: {
        minWidth: 60,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    saveButtonInner: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
        paddingVertical: 2,
    },
    checkOverlay: {
        position: 'absolute',
    },
    saveText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#C7C7CC',
        letterSpacing: -0.2,
    },
    saveTextActive: {
        color: '#007AFF',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 100,
        gap: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
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
    fieldValuePrivate: {
        backgroundColor: '#FFF3E0',
    },
    fieldValueTextPrivate: {
        color: '#FF9500',
    },
    fieldValueAssign: {
        backgroundColor: '#E8F0FE',
    },
    fieldValueTextAssign: {
        color: '#007AFF',
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
    // Visuals picker
    visualsPreview: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 24,
    },
    visualsPreviewCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    visualsPreviewEmoji: {
        fontSize: 44,
    },
    visualsClearBtn: {
        position: 'absolute',
        top: 20,
        right: '30%',
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        paddingHorizontal: 20,
        paddingTop: 4,
        paddingBottom: 16,
    },
    colorOption: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    colorOptionActive: {
        borderColor: '#1C1C1E',
    },
    colorSwatch: {
        width: 42,
        height: 42,
        borderRadius: 21,
    },
    colorNoFill: {
        width: 42,
        height: 42,
        borderRadius: 21,
        borderWidth: 1.5,
        borderColor: '#C7C7CC',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    colorNoFillLine: {
        width: 56,
        height: 1.5,
        backgroundColor: '#C7C7CC',
        transform: [{ rotate: '-45deg' }],
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
    // Edit subtask
    editSubtaskContent: {
        paddingHorizontal: 20,
    },
    editSubtaskNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    editSubtaskEmojiBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    editSubtaskEmoji: {
        fontSize: 22,
    },
    editSubtaskInput: {
        flex: 1,
        fontSize: 17,
        fontWeight: '500',
        color: '#1C1C1E',
        backgroundColor: '#F2F2F7',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
});
