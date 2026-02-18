import { useRouter } from 'expo-router';
import { X, Check, Sunrise, ChevronDown } from 'lucide-react-native';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useHabits } from '@/contexts/HabitContext';
import { AnimatedBottomSheet } from '@/components/AnimatedBottomSheet';
import { LinearGradient } from 'expo-linear-gradient';
import { suggestEmoji } from '@/utils/emojiSuggest';
import { AmbientBackground } from '@/components/AmbientBackground';
import type { HabitFrequency } from '@/types/habit';

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

type TimeOfDay = 'anytime' | 'morning' | 'afternoon' | 'evening';

const TIME_OF_DAY_OPTIONS: { label: string; value: TimeOfDay; icon: string }[] = [
    { label: 'Morning', value: 'morning', icon: '☀️' },
    { label: 'Afternoon', value: 'afternoon', icon: '🌤' },
    { label: 'Evening', value: 'evening', icon: '🌙' },
    { label: 'Anytime', value: 'anytime', icon: '🕐' },
];

const FREQUENCY_OPTIONS: { label: string; value: HabitFrequency; icon: string }[] = [
    { label: 'Daily', value: 'daily', icon: '🔁' },
    { label: 'Weekdays', value: 'weekdays', icon: '📅' },
    { label: 'Weekly', value: 'weekly', icon: '📆' },
];

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

type ExpandableField = 'timeOfDay' | 'frequency' | null;

export default function AddHabitScreen() {
    const router = useRouter();
    const { addHabit } = useHabits();

    const [title, setTitle] = useState('');
    const [emoji, setEmoji] = useState<string | undefined>(undefined);
    const [emojiColor, setEmojiColor] = useState<string | undefined>(undefined);
    const userPickedEmoji = useRef(false);

    const handleTitleChange = useCallback((text: string) => {
        setTitle(text);
        if (!userPickedEmoji.current) {
            setEmoji(suggestEmoji(text));
        }
    }, []);

    const [frequency, setFrequency] = useState<HabitFrequency>('daily');
    const [weeklyDays, setWeeklyDays] = useState<number[]>([]);
    const [timeOfDay, setTimeOfDay] = useState<TimeOfDay | undefined>(undefined);

    const [expandedField, setExpandedField] = useState<ExpandableField>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

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

    const toggleWeeklyDay = useCallback((day: number) => {
        Haptics.selectionAsync();
        setWeeklyDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    }, []);

    const handleSave = () => {
        if (title.trim()) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            addHabit(title.trim(), frequency, {
                emoji,
                emojiColor,
                weeklyDays: frequency === 'weekly' ? weeklyDays : undefined,
                timeOfDay,
            });
            router.back();
        }
    };

    const getTimeOfDayLabel = (): string => {
        if (!timeOfDay) return 'Not set';
        const opt = TIME_OF_DAY_OPTIONS.find(o => o.value === timeOfDay);
        return opt ? `${opt.icon} ${opt.label}` : 'Not set';
    };

    const getFrequencyLabel = (): string => {
        const opt = FREQUENCY_OPTIONS.find(o => o.value === frequency);
        return opt ? `${opt.icon} ${opt.label}` : 'Daily';
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
                            <Pressable onPress={() => router.back()} style={styles.cancelButton} hitSlop={8}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </Pressable>
                            <Text style={styles.headerTitle}>New Habit</Text>
                            <Pressable
                                style={[styles.saveButton, canSave && styles.saveButtonActive]}
                                onPress={handleSave}
                                disabled={!canSave}
                                hitSlop={8}
                            >
                                <Text style={[styles.saveText, canSave && styles.saveTextActive]}>Add</Text>
                            </Pressable>
                        </View>
                    </View>

                    <ScrollView
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
                                    placeholder="Habit name"
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
                                    <Text style={styles.emojiButtonText}>{emoji || '🔄'}</Text>
                                </Pressable>
                            </View>
                        </View>

                        {/* Fields Card */}
                        <View style={styles.card}>
                            {/* Frequency */}
                            <Pressable
                                style={styles.fieldRow}
                                onPress={() => toggleField('frequency')}
                            >
                                <View style={styles.fieldLabelRow}>
                                    <Text style={styles.fieldIconText}>🔁</Text>
                                    <Text style={styles.fieldLabel}>Frequency</Text>
                                </View>
                                {expandedField !== 'frequency' && (
                                    <View style={styles.fieldValue}>
                                        <Text style={styles.fieldValueText}>{getFrequencyLabel()}</Text>
                                        <ChevronDown size={14} color="#C7C7CC" />
                                    </View>
                                )}
                            </Pressable>
                            {expandedField === 'frequency' && (
                                <View style={styles.inlineOptions}>
                                    {FREQUENCY_OPTIONS.map(opt => {
                                        const active = frequency === opt.value;
                                        return (
                                            <Pressable
                                                key={opt.value}
                                                style={[styles.inlineChip, active && styles.inlineChipActive]}
                                                onPress={() => {
                                                    Haptics.selectionAsync();
                                                    setFrequency(opt.value);
                                                    if (opt.value !== 'weekly') {
                                                        toggleField(null);
                                                    }
                                                }}
                                            >
                                                <Text style={styles.inlineChipIcon}>{opt.icon}</Text>
                                                <Text style={[styles.inlineChipText, active && styles.inlineChipTextActive]}>{opt.label}</Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            )}

                            {/* Weekly Days Selector */}
                            {frequency === 'weekly' && (
                                <View style={styles.weeklyDaysContainer}>
                                    {DAY_LABELS.map((label, index) => {
                                        const active = weeklyDays.includes(index);
                                        return (
                                            <Pressable
                                                key={index}
                                                style={[styles.dayChip, active && styles.dayChipActive]}
                                                onPress={() => toggleWeeklyDay(index)}
                                            >
                                                <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>{label}</Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            )}

                            <View style={styles.fieldSeparator} />

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
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
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
                            <Text style={styles.visualsPreviewEmoji}>{emoji || '🔄'}</Text>
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
    },
    saveButtonActive: {},
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
    fieldIconText: {
        fontSize: 16,
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
    // Weekly day chips
    weeklyDaysContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 4,
    },
    dayChip: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayChipActive: {
        backgroundColor: '#1C1C1E',
    },
    dayChipText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#3C3C43',
    },
    dayChipTextActive: {
        color: '#fff',
    },
    // Sheet header
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
});
