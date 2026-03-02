import React, { useState, useRef } from 'react';
import {
    View, Text, StyleSheet, Pressable, TextInput, ScrollView,
    KeyboardAvoidingView, Platform, Keyboard, Image,
} from 'react-native';
import Animated, {
    useSharedValue, useAnimatedStyle, withTiming, withSpring, withDelay, runOnJS,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Check, Plus, Lock, UserPlus, Users, ArrowRight } from 'lucide-react-native';
import * as Haptics from '@/lib/haptics';
import { DatePickerModal } from '@/components/DatePickerModal';
import { AnimatedBottomSheet } from '@/components/AnimatedBottomSheet';
import { LinearGradient } from 'expo-linear-gradient';
import { isToday, isTomorrow, addDays } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import {
    type AddTodoFormState,
    TIME_OF_DAY_OPTIONS, DURATION_OPTIONS, REPEAT_OPTIONS,
    EMOJI_OPTIONS, EMOJI_BG_COLORS,
} from '@/hooks/useAddTodoForm';

const AVATAR_COLORS = [
    { bg: '#E8D5F5', text: '#7C3AED' },
    { bg: '#D5EDE8', text: '#059669' },
    { bg: '#DBEAFE', text: '#2563EB' },
    { bg: '#FDE8D5', text: '#EA580C' },
    { bg: '#FCE7F3', text: '#DB2777' },
    { bg: '#E0E7FF', text: '#4F46E5' },
    { bg: '#D5F5E8', text: '#047857' },
    { bg: '#FEF3C7', text: '#B45309' },
];

function getAvatarColor(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function AddTodoThings({ form }: { form: AddTodoFormState }) {
    const { profile } = useAuth();
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showSubtaskEmojiPicker, setShowSubtaskEmojiPicker] = useState<string | null>(null);
    const subtaskInputRef = useRef<TextInput>(null);
    const scrollViewRef = useRef<ScrollView>(null);

    // Save animation
    const contentScale = useSharedValue(1);
    const contentOpacity = useSharedValue(1);
    const saveCheckScale = useSharedValue(0);
    const saveCheckOpacity = useSharedValue(0);
    const saveTextOpacity = useSharedValue(1);

    const contentStyle = useAnimatedStyle(() => ({
        transform: [{ scale: contentScale.value }],
        opacity: contentOpacity.value,
    }));
    const saveTextStyle = useAnimatedStyle(() => ({ opacity: saveTextOpacity.value }));
    const saveCheckStyle = useAnimatedStyle(() => ({
        opacity: saveCheckOpacity.value,
        transform: [{ scale: saveCheckScale.value }],
    }));

    const handleSave = async () => {
        const success = await form.executeSave();
        if (success) {
            saveTextOpacity.value = withTiming(0, { duration: 100 });
            saveCheckOpacity.value = withTiming(1, { duration: 100 });
            saveCheckScale.value = withSpring(1, { damping: 14, stiffness: 200 });
            contentScale.value = withTiming(0.97, { duration: 200 });
            contentOpacity.value = withDelay(100, withTiming(0, { duration: 200 }, () => {
                runOnJS(form.goBack)();
            }));
        }
    };

    // Date pill helpers
    const isDateToday = form.dueDate ? isToday(form.dueDate) : false;
    const isDateTomorrow = form.dueDate ? isTomorrow(form.dueDate) : false;
    const isCustomDate = form.dueDate && !isDateToday && !isDateTomorrow;

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
                                onPress={form.goBack}
                                style={s.closeBtn}
                                hitSlop={8}
                            >
                                <X size={18} color="#8E8E93" strokeWidth={2.5} />
                            </Pressable>
                            <Pressable
                                onPress={handleSave}
                                disabled={!form.canSave || form.saving}
                                hitSlop={8}
                                style={s.saveBtnContainer}
                            >
                                <Animated.Text style={[s.saveText, form.canSave && s.saveTextActive, saveTextStyle]}>
                                    Save
                                </Animated.Text>
                                <Animated.View style={[s.saveCheckOverlay, saveCheckStyle]}>
                                    <Check size={18} color="#007AFF" strokeWidth={3} />
                                </Animated.View>
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
                        <Animated.View style={contentStyle}>
                            {/* Title Area */}
                            <View style={s.titleArea}>
                                <TextInput
                                    style={s.titleInput}
                                    placeholder="New To-Do"
                                    placeholderTextColor="#C7C7CC"
                                    value={form.title}
                                    onChangeText={form.handleTitleChange}
                                    autoFocus
                                    multiline={false}
                                />
                                <Pressable
                                    style={[s.emojiBtn, form.emojiColor ? { backgroundColor: form.emojiColor } : undefined]}
                                    onPress={() => {
                                        Keyboard.dismiss();
                                        Haptics.selectionAsync();
                                        setShowEmojiPicker(true);
                                    }}
                                >
                                    <Text style={s.emojiBtnText}>{form.emoji || '🌤'}</Text>
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
                                            form.setDueDate(new Date());
                                        }}
                                    >
                                        <Text style={[s.pillText, isDateToday && s.pillTextActive]}>Today</Text>
                                    </Pressable>
                                    <Pressable
                                        style={[s.pill, isDateTomorrow && s.pillActive]}
                                        onPress={() => {
                                            Haptics.selectionAsync();
                                            form.setDueDate(addDays(new Date(), 1));
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
                                            {isCustomDate ? form.getDateLabel() : 'Pick Date'}
                                        </Text>
                                    </Pressable>
                                    <Pressable
                                        style={[s.pill, !form.dueDate && s.pillActive]}
                                        onPress={() => {
                                            Haptics.selectionAsync();
                                            form.setDueDate(null);
                                        }}
                                    >
                                        <Text style={[s.pillText, !form.dueDate && s.pillTextActive]}>Someday</Text>
                                    </Pressable>
                                </View>
                            </View>

                            {/* Time of Day Section */}
                            <View style={s.section}>
                                <Text style={s.sectionLabel}>Time of day</Text>
                                <View style={s.pillRow}>
                                    {TIME_OF_DAY_OPTIONS.map(opt => {
                                        const active = form.timeOfDay === opt.value;
                                        return (
                                            <Pressable
                                                key={opt.value}
                                                style={[s.pill, active && s.pillActive]}
                                                onPress={() => {
                                                    Haptics.selectionAsync();
                                                    form.setTimeOfDay(active ? undefined : opt.value);
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
                                        const active = form.estimatedMinutes === opt.value;
                                        return (
                                            <Pressable
                                                key={opt.value}
                                                style={[s.pill, s.pillCompact, active && s.pillActive]}
                                                onPress={() => {
                                                    Haptics.selectionAsync();
                                                    form.setEstimatedMinutes(active ? undefined : opt.value);
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
                                        const active = form.repeat === opt.value;
                                        return (
                                            <Pressable
                                                key={opt.value}
                                                style={[s.pill, active && s.pillActive]}
                                                onPress={() => {
                                                    Haptics.selectionAsync();
                                                    form.setRepeat(opt.value);
                                                }}
                                            >
                                                <Text style={[s.pillText, active && s.pillTextActive]}>{opt.label}</Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            </View>

                            {/* People Section */}
                            {form.hasPartner && (
                                <>
                                    <View style={s.section}>
                                        <Text style={s.sectionLabel}>People</Text>
                                        <View style={s.pillRow}>
                                            {(() => {
                                                const isMe = !form.isTogether && !form.assignToPartner;
                                                const myInitial = profile?.name?.charAt(0).toUpperCase() ?? 'M';
                                                const myColor = getAvatarColor(profile?.name ?? 'Me');
                                                return (
                                                    <Pressable
                                                        style={[s.personPill, isMe && s.personPillSelected]}
                                                        onPress={() => {
                                                            Haptics.selectionAsync();
                                                            form.setTogetherPartnerId(null);
                                                            form.setAssignToPartnerId(null);
                                                        }}
                                                    >
                                                        {profile?.avatar_url ? (
                                                            <Image source={{ uri: profile.avatar_url }} style={s.personAvatarImg} />
                                                        ) : (
                                                            <View style={[s.personAvatar, { backgroundColor: myColor.bg }]}>
                                                                <Text style={[s.personInitial, { color: myColor.text }]}>{myInitial}</Text>
                                                            </View>
                                                        )}
                                                        <Text style={[s.personName, isMe && s.personNameSelected]}>
                                                            Me
                                                        </Text>
                                                    </Pressable>
                                                );
                                            })()}
                                            {form.activeBuddies.map((p) => {
                                                const pid = p.partner_id!;
                                                const firstName = p.partner_name?.split(' ')[0] ?? 'Partner';
                                                const initial = firstName.charAt(0).toUpperCase();
                                                const color = getAvatarColor(firstName);
                                                const avatarUrl = p.partner_avatar_url;
                                                const isTogether = form.togetherPartnerId === pid;
                                                const isAssigned = form.assignToPartnerId === pid;
                                                const isSelected = isTogether || isAssigned;

                                                return (
                                                    <Pressable
                                                        key={pid}
                                                        style={[s.personPill, isSelected && s.personPillSelected]}
                                                        onPress={() => {
                                                            Haptics.selectionAsync();
                                                            if (isSelected) {
                                                                form.setTogetherPartnerId(null);
                                                                form.setAssignToPartnerId(null);
                                                            } else {
                                                                form.setTogetherPartnerId(pid);
                                                                form.setAssignToPartnerId(null);
                                                                form.setIsPrivate(false);
                                                            }
                                                        }}
                                                    >
                                                        {avatarUrl ? (
                                                            <Image source={{ uri: avatarUrl }} style={s.personAvatarImg} />
                                                        ) : (
                                                            <View style={[s.personAvatar, { backgroundColor: color.bg }]}>
                                                                <Text style={[s.personInitial, { color: color.text }]}>{initial}</Text>
                                                            </View>
                                                        )}
                                                        <Text style={[s.personName, isSelected && s.personNameSelected]}>
                                                            {firstName}
                                                        </Text>
                                                    </Pressable>
                                                );
                                            })}
                                        </View>
                                        {(form.isTogether || form.assignToPartner) && (() => {
                                            const pid = form.togetherPartnerId || form.assignToPartnerId;
                                            const buddy = form.activeBuddies.find(b => b.partner_id === pid);
                                            const name = buddy?.partner_name?.split(' ')[0] ?? 'them';
                                            return (
                                                <View style={s.modeCards}>
                                                    <Pressable
                                                        style={[s.modeCard, form.isTogether && s.modeCardOn]}
                                                        onPress={() => {
                                                            Haptics.selectionAsync();
                                                            form.setAssignToPartnerId(null);
                                                            form.setTogetherPartnerId(pid);
                                                        }}
                                                    >
                                                        <View style={[s.modeIconWrap, form.isTogether && s.modeIconWrapOn]}>
                                                            <Users size={16} color={form.isTogether ? '#FFFFFF' : '#8E8E93'} />
                                                        </View>
                                                        <Text style={[s.modeTitle, form.isTogether && s.modeTitleOn]}>Together</Text>
                                                        <Text style={s.modeDesc}>You and {name} both do it</Text>
                                                    </Pressable>
                                                    <Pressable
                                                        style={[s.modeCard, form.assignToPartner && s.modeCardOn]}
                                                        onPress={() => {
                                                            Haptics.selectionAsync();
                                                            form.setTogetherPartnerId(null);
                                                            form.setAssignToPartnerId(pid);
                                                        }}
                                                    >
                                                        <View style={[s.modeIconWrap, form.assignToPartner && s.modeIconWrapAssignOn]}>
                                                            <ArrowRight size={16} color={form.assignToPartner ? '#FFFFFF' : '#8E8E93'} />
                                                        </View>
                                                        <Text style={[s.modeTitle, form.assignToPartner && s.modeTitleOn]}>Assign</Text>
                                                        <Text style={s.modeDesc}>Send to {name} to do</Text>
                                                    </Pressable>
                                                </View>
                                            );
                                        })()}
                                    </View>
                                    {!form.assignToPartner && !form.isTogether && (
                                        <View style={s.section}>
                                            <Text style={s.sectionLabel}>Visibility</Text>
                                            <View style={s.pillRow}>
                                                <Pressable
                                                    style={[s.pill, !form.isPrivate && s.pillActive]}
                                                    onPress={() => {
                                                        Haptics.selectionAsync();
                                                        form.setIsPrivate(false);
                                                    }}
                                                >
                                                    <UserPlus size={14} color={!form.isPrivate ? '#007AFF' : '#8E8E93'} />
                                                    <Text style={[s.pillText, !form.isPrivate && s.pillTextActive]}>Shared</Text>
                                                </Pressable>
                                                <Pressable
                                                    style={[s.pill, form.isPrivate && s.pillWarn]}
                                                    onPress={() => {
                                                        Haptics.selectionAsync();
                                                        form.setIsPrivate(true);
                                                    }}
                                                >
                                                    <Lock size={14} color={form.isPrivate ? '#FF9500' : '#8E8E93'} />
                                                    <Text style={[s.pillText, form.isPrivate && s.pillTextWarn]}>Private</Text>
                                                </Pressable>
                                            </View>
                                        </View>
                                    )}
                                </>
                            )}

                            {/* Checklist Section */}
                            <View style={s.section}>
                                <Text style={s.sectionLabel}>Checklist</Text>
                                <View style={s.checklistCard}>
                                    {form.subtasks.map((st, i) => (
                                        <View key={st.id}>
                                            {i > 0 && <View style={s.checklistSeparator} />}
                                            <Pressable
                                                style={s.checklistRow}
                                                onLongPress={() => form.startEditingSubtask(st)}
                                                delayLongPress={400}
                                            >
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
                                                <Pressable onPress={() => form.removeSubtask(st.id)} hitSlop={8} style={s.checklistRemove}>
                                                    <X size={14} color="#C7C7CC" strokeWidth={2.5} />
                                                </Pressable>
                                            </Pressable>
                                        </View>
                                    ))}
                                    {form.subtasks.length > 0 && <View style={s.checklistSeparator} />}
                                    <View style={s.checklistAddRow}>
                                        <View style={s.checklistAddIcon}>
                                            <Plus size={14} color="#007AFF" strokeWidth={2.5} />
                                        </View>
                                        <TextInput
                                            ref={subtaskInputRef}
                                            style={s.checklistInput}
                                            placeholder="Add item"
                                            placeholderTextColor="#C7C7CC"
                                            value={form.newSubtaskTitle}
                                            onChangeText={form.setNewSubtaskTitle}
                                            onSubmitEditing={() => {
                                                form.addSubtask();
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
                        </Animated.View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>

            {/* Date Picker */}
            <DatePickerModal
                visible={showDatePicker}
                onClose={() => setShowDatePicker(false)}
                selectedDate={form.dueDate}
                onSelectDate={form.setDueDate}
            />

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

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
                    {/* Preview */}
                    <View style={s.emojiPreviewArea}>
                        <View style={[s.emojiPreviewCircle, { backgroundColor: form.emojiColor || '#F5F5F5' }]}>
                            <Text style={s.emojiPreviewLarge}>{form.emoji || '🌤'}</Text>
                        </View>
                        {(form.emoji || form.emojiColor) && (
                            <Pressable style={s.emojiClearBtn} onPress={form.clearEmoji} hitSlop={8}>
                                <X size={14} color="#8E8E93" strokeWidth={2.5} />
                            </Pressable>
                        )}
                    </View>

                    {/* Emoji Grid */}
                    <View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.emojiScrollContent}>
                            <View style={s.emojiRows}>
                                <View style={s.emojiRow}>
                                    {EMOJI_OPTIONS.filter((_, i) => i % 2 === 0).map(e => {
                                        const active = form.emoji === e;
                                        return (
                                            <Pressable
                                                key={e}
                                                style={[s.emojiOption, active && s.emojiOptionActive]}
                                                onPress={() => form.pickEmoji(e)}
                                            >
                                                <Text style={s.emojiText}>{e}</Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                                <View style={s.emojiRow}>
                                    {EMOJI_OPTIONS.filter((_, i) => i % 2 === 1).map(e => {
                                        const active = form.emoji === e;
                                        return (
                                            <Pressable
                                                key={e}
                                                style={[s.emojiOption, active && s.emojiOptionActive]}
                                                onPress={() => form.pickEmoji(e)}
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

                    {/* Color Grid */}
                    <View style={s.colorGrid}>
                        <Pressable
                            style={[s.colorOption, !form.emojiColor && s.colorOptionActive]}
                            onPress={() => { Haptics.selectionAsync(); form.setEmojiColor(undefined); }}
                        >
                            <View style={s.colorNoFill}>
                                <View style={s.colorNoFillLine} />
                            </View>
                        </Pressable>
                        {EMOJI_BG_COLORS.map(c => (
                            <Pressable
                                key={c}
                                style={[s.colorOption, form.emojiColor === c && s.colorOptionActive]}
                                onPress={() => { Haptics.selectionAsync(); form.setEmojiColor(c); }}
                            >
                                <View style={[s.colorSwatch, { backgroundColor: c }]} />
                            </Pressable>
                        ))}
                    </View>
                </ScrollView>
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
                                                form.updateSubtaskEmoji(showSubtaskEmojiPicker, e);
                                                setShowSubtaskEmojiPicker(null);
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
                                                form.updateSubtaskEmoji(showSubtaskEmojiPicker, e);
                                                setShowSubtaskEmojiPicker(null);
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

            {/* Edit Subtask Sheet */}
            <AnimatedBottomSheet
                visible={form.editingSubtask !== null}
                onClose={form.saveEditingSubtask}
            >
                <View style={s.sheetHeader}>
                    <Text style={s.sheetTitle}>Edit Item</Text>
                    <Pressable onPress={form.saveEditingSubtask}>
                        <Text style={s.sheetDone}>Done</Text>
                    </Pressable>
                </View>
                {form.editingSubtask && (
                    <View style={s.editSubtaskContent}>
                        <View style={s.editSubtaskNameRow}>
                            <Pressable style={s.editSubtaskEmojiBtn}>
                                <Text style={{ fontSize: 22 }}>{form.editingSubtask.emoji}</Text>
                            </Pressable>
                            <TextInput
                                style={s.editSubtaskInput}
                                value={form.editingSubtask.title}
                                onChangeText={(text) => form.setEditingSubtask(prev => prev ? { ...prev, title: text } : null)}
                                autoFocus
                                selectTextOnFocus
                                returnKeyType="done"
                                onSubmitEditing={form.saveEditingSubtask}
                            />
                        </View>
                        <View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.emojiScrollContent}>
                                <View style={s.emojiRows}>
                                    <View style={s.emojiRow}>
                                        {EMOJI_OPTIONS.filter((_, i) => i % 2 === 0).map(e => {
                                            const active = form.editingSubtask?.emoji === e;
                                            return (
                                                <Pressable
                                                    key={e}
                                                    style={[s.emojiOption, active && s.emojiOptionActive]}
                                                    onPress={() => {
                                                        Haptics.selectionAsync();
                                                        form.setEditingSubtask(prev => prev ? { ...prev, emoji: e } : null);
                                                    }}
                                                >
                                                    <Text style={s.emojiText}>{e}</Text>
                                                </Pressable>
                                            );
                                        })}
                                    </View>
                                    <View style={s.emojiRow}>
                                        {EMOJI_OPTIONS.filter((_, i) => i % 2 === 1).map(e => {
                                            const active = form.editingSubtask?.emoji === e;
                                            return (
                                                <Pressable
                                                    key={e}
                                                    style={[s.emojiOption, active && s.emojiOptionActive]}
                                                    onPress={() => {
                                                        Haptics.selectionAsync();
                                                        form.setEditingSubtask(prev => prev ? { ...prev, emoji: e } : null);
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
                    </View>
                )}
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
    saveBtnContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 40,
    },
    saveText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#C7C7CC',
    },
    saveTextActive: {
        color: '#007AFF',
    },
    saveCheckOverlay: {
        position: 'absolute',
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
    personPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 6,
        paddingLeft: 6,
        paddingRight: 14,
        borderRadius: 100,
        backgroundColor: '#F5F5F5',
    },
    personPillSelected: {
        backgroundColor: '#F0F0F0',
        borderWidth: 1.5,
        borderColor: '#1C1C1E',
        paddingVertical: 4.5,
        paddingLeft: 4.5,
        paddingRight: 12.5,
    },
    personAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    personAvatarImg: {
        width: 28,
        height: 28,
        borderRadius: 14,
    },
    personInitial: {
        fontSize: 13,
        fontWeight: '700',
    },
    personName: {
        fontSize: 15,
        fontWeight: '500',
        color: '#3C3C43',
    },
    personNameSelected: {
        color: '#1C1C1E',
        fontWeight: '600',
    },
    modeCards: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 14,
    },
    modeCard: {
        flex: 1,
        backgroundColor: '#F8F8F8',
        borderRadius: 14,
        padding: 14,
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    modeCardOn: {
        backgroundColor: '#FFFFFF',
        borderColor: '#1C1C1E',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    modeIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#ECECEC',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    modeIconWrapOn: {
        backgroundColor: '#1C1C1E',
    },
    modeIconWrapAssignOn: {
        backgroundColor: '#1C1C1E',
    },
    modeTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#AEAEB2',
        marginBottom: 2,
    },
    modeTitleOn: {
        color: '#1C1C1E',
    },
    modeDesc: {
        fontSize: 12,
        color: '#AEAEB2',
        lineHeight: 16,
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
    pillAccent: {
        backgroundColor: 'rgba(0, 122, 255, 0.07)',
        borderColor: 'rgba(0, 122, 255, 0.28)',
    },
    pillGreen: {
        backgroundColor: 'rgba(52, 199, 89, 0.07)',
        borderColor: 'rgba(52, 199, 89, 0.28)',
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
    pillTextGreen: {
        color: '#34C759',
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

    // Emoji preview
    emojiPreviewArea: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 24,
    },
    emojiPreviewCircle: {
        width: 88,
        height: 88,
        borderRadius: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emojiPreviewLarge: {
        fontSize: 40,
    },
    emojiClearBtn: {
        position: 'absolute',
        top: 20,
        right: '30%',
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
        justifyContent: 'center',
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

    // Color grid
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        paddingHorizontal: 20,
        paddingTop: 4,
        paddingBottom: 16,
    },
    colorOption: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    colorOptionActive: {
        borderColor: '#1C1C1E',
    },
    colorSwatch: {
        width: 38,
        height: 38,
        borderRadius: 19,
    },
    colorNoFill: {
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 1.5,
        borderColor: '#C7C7CC',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    colorNoFillLine: {
        width: 52,
        height: 1.5,
        backgroundColor: '#C7C7CC',
        transform: [{ rotate: '-45deg' }],
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
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    editSubtaskInput: {
        flex: 1,
        fontSize: 17,
        fontWeight: '500',
        color: '#1C1C1E',
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
});
