import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    TextInput,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
} from 'react-native';
import { CheckCircle2, StickyNote, Smile, X, ArrowUp } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { useTodos } from '@/contexts/TodoContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type CaptureMode = 'note' | 'task' | 'mood';

interface CaptureBarProps {
    noteText: string;
    onNoteChange: (text: string) => void;
    isSaving: boolean;
    selectedDate: Date;
    isToday: boolean;
    bottomOffset?: number;
    visible: boolean;
    onClose: () => void;
}

const MODES: { mode: CaptureMode; icon: typeof CheckCircle2; label: string; color: string }[] = [
    { mode: 'task', icon: CheckCircle2, label: 'Task', color: '#007AFF' },
    { mode: 'note', icon: StickyNote, label: 'Note', color: '#FF9F0A' },
    { mode: 'mood', icon: Smile, label: 'Mood', color: '#AF52DE' },
];

const MOODS: { emoji: string; label: string }[] = [
    { emoji: '🤩', label: 'Great' },
    { emoji: '😊', label: 'Good' },
    { emoji: '🙂', label: 'Okay' },
    { emoji: '😐', label: 'Meh' },
    { emoji: '🤔', label: 'Hmm' },
    { emoji: '😓', label: 'Rough' },
    { emoji: '😡', label: 'Mad' },
];

export function CaptureBar({
    noteText,
    onNoteChange,
    isSaving,
    visible,
    onClose,
}: CaptureBarProps) {
    const [mode, setMode] = useState<CaptureMode>('task');
    const [tempInput, setTempInput] = useState('');
    const { addTodo } = useTodos();

    const expandAnim = useRef(new Animated.Value(0)).current;
    const inputRef = useRef<TextInput>(null);

    const resetState = useCallback(() => {
        setMode('task');
        setTempInput('');
        Keyboard.dismiss();
    }, []);

    const handleClose = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Animated.spring(expandAnim, {
            toValue: 0,
            useNativeDriver: true,
            damping: 24,
            stiffness: 300,
            mass: 0.8,
        }).start(({ finished }) => {
            if (finished) {
                onClose();
                resetState();
            }
        });
    }, [onClose, expandAnim, resetState]);

    useEffect(() => {
        if (visible) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            Animated.spring(expandAnim, {
                toValue: 1,
                useNativeDriver: true,
                damping: 22,
                stiffness: 260,
                mass: 0.8,
            }).start();
            // Auto-focus the input
            setTimeout(() => inputRef.current?.focus(), 200);
        } else {
            if (expandAnim._value > 0.1) {
                handleClose();
            }
        }
    }, [visible, expandAnim]);

    const handleModeSwitch = (newMode: CaptureMode) => {
        if (newMode === mode) return;
        Haptics.selectionAsync();
        setMode(newMode);
        if (newMode === 'mood') {
            Keyboard.dismiss();
        } else {
            setTimeout(() => inputRef.current?.focus(), 80);
        }
    };

    const handleSubmit = () => {
        const text = mode === 'note' ? noteText : tempInput;
        if (!text?.trim()) return;

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (mode === 'task') {
            addTodo(tempInput.trim(), new Date(), undefined, true);
        }
        // Note mode saves via onNoteChange already
        handleClose();
    };

    const handleMoodSelect = (emoji: string) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const moodText = `\nMood: ${emoji}`;
        onNoteChange(noteText ? noteText + moodText : `Mood: ${emoji}`);
        handleClose();
    };

    const currentText = mode === 'note' ? noteText : tempInput;
    const hasText = !!currentText?.trim();
    const placeholder = mode === 'task' ? 'What needs to be done?' : 'Write something...';

    if (!visible && expandAnim._value === 0) return null;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {/* Backdrop */}
            <Animated.View
                style={[styles.backdrop, { opacity: expandAnim }]}
                pointerEvents={visible ? 'auto' : 'none'}
            >
                <Pressable style={StyleSheet.absoluteFill} onPress={handleClose}>
                    <BlurView intensity={24} style={StyleSheet.absoluteFill} tint="dark" />
                </Pressable>
            </Animated.View>

            {/* Panel */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.keyboardView}
                pointerEvents="box-none"
            >
                <Animated.View
                    style={[
                        styles.panelOuter,
                        {
                            transform: [{
                                translateY: expandAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [60, 0],
                                }),
                            }],
                            opacity: expandAnim,
                        },
                    ]}
                >
                    <BlurView intensity={50} tint="light" style={styles.panelBlur}>
                        <View style={styles.panelContent}>
                            {/* Handle + Close */}
                            <View style={styles.topRow}>
                                <View style={styles.handle} />
                                <Pressable
                                    onPress={handleClose}
                                    hitSlop={12}
                                    style={({ pressed }) => [
                                        styles.closeBtn,
                                        pressed && styles.closeBtnPressed,
                                    ]}
                                >
                                    <X size={15} color="#3C3C43" strokeWidth={2.5} />
                                </Pressable>
                            </View>

                            {/* Input / Mood area */}
                            {mode === 'mood' ? (
                                <View style={styles.moodArea}>
                                    <Text style={styles.moodPrompt}>How are you feeling?</Text>
                                    <View style={styles.moodGrid}>
                                        {MOODS.map(({ emoji, label }) => (
                                            <Pressable
                                                key={emoji}
                                                style={({ pressed }) => [
                                                    styles.moodItem,
                                                    pressed && styles.moodItemPressed,
                                                ]}
                                                onPress={() => handleMoodSelect(emoji)}
                                            >
                                                <View style={styles.moodEmojiWrap}>
                                                    <Text style={styles.moodEmoji}>{emoji}</Text>
                                                </View>
                                                <Text style={styles.moodLabel}>{label}</Text>
                                            </Pressable>
                                        ))}
                                    </View>
                                </View>
                            ) : (
                                <View style={styles.inputArea}>
                                    <TextInput
                                        ref={inputRef}
                                        style={styles.textInput}
                                        placeholder={placeholder}
                                        placeholderTextColor="rgba(60,60,67,0.3)"
                                        multiline
                                        value={mode === 'note' ? noteText : tempInput}
                                        onChangeText={mode === 'note' ? onNoteChange : setTempInput}
                                        textAlignVertical="top"
                                        onSubmitEditing={mode === 'task' ? handleSubmit : undefined}
                                        returnKeyType={mode === 'task' ? 'done' : 'default'}
                                    />
                                </View>
                            )}

                            {/* Bottom bar: mode pills + send */}
                            <View style={styles.bottomBar}>
                                <View style={styles.pillRow}>
                                    {MODES.map(({ mode: m, icon: Icon, label, color }) => {
                                        const active = mode === m;
                                        return (
                                            <Pressable
                                                key={m}
                                                onPress={() => handleModeSwitch(m)}
                                                style={({ pressed }) => [
                                                    styles.pill,
                                                    active && { backgroundColor: color },
                                                    pressed && !active && styles.pillPressed,
                                                ]}
                                            >
                                                <Icon
                                                    size={16}
                                                    color={active ? '#fff' : '#8E8E93'}
                                                    strokeWidth={2.5}
                                                />
                                                <Text style={[
                                                    styles.pillLabel,
                                                    active && styles.pillLabelActive,
                                                ]}>
                                                    {label}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>

                                {mode !== 'mood' && (
                                    <Pressable
                                        onPress={handleSubmit}
                                        disabled={!hasText}
                                        style={({ pressed }) => [
                                            styles.sendBtn,
                                            hasText && styles.sendBtnActive,
                                            pressed && hasText && { transform: [{ scale: 0.92 }] },
                                        ]}
                                    >
                                        <ArrowUp
                                            size={18}
                                            color={hasText ? '#fff' : '#C7C7CC'}
                                            strokeWidth={3}
                                        />
                                    </Pressable>
                                )}
                            </View>
                        </View>
                    </BlurView>
                </Animated.View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1000,
    },
    keyboardView: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1001,
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 130,
    },

    // Panel
    panelOuter: {
        width: SCREEN_WIDTH - 24,
        maxWidth: 420,
        borderRadius: 28,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.15,
        shadowRadius: 40,
        elevation: 16,
    },
    panelBlur: {
        overflow: 'hidden',
    },
    panelContent: {
        backgroundColor: 'rgba(255,255,255,0.82)',
        paddingTop: 10,
        paddingHorizontal: 20,
        paddingBottom: 18,
    },

    // Top row
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    handle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(60,60,67,0.15)',
    },
    closeBtn: {
        position: 'absolute',
        right: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(120,120,128,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeBtnPressed: {
        backgroundColor: 'rgba(120,120,128,0.2)',
    },

    // Input area
    inputArea: {
        minHeight: 100,
        marginBottom: 20,
    },
    textInput: {
        fontSize: 20,
        fontWeight: '400',
        lineHeight: 28,
        color: '#000',
        letterSpacing: -0.3,
        minHeight: 100,
        paddingTop: 0,
    },

    // Mood area
    moodArea: {
        alignItems: 'center',
        paddingTop: 4,
        paddingBottom: 8,
        minHeight: 100,
    },
    moodPrompt: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000',
        letterSpacing: -0.4,
        marginBottom: 24,
    },
    moodGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 6,
    },
    moodItem: {
        alignItems: 'center',
        width: 68,
        paddingVertical: 10,
        borderRadius: 16,
    },
    moodItemPressed: {
        backgroundColor: 'rgba(0,0,0,0.04)',
        transform: [{ scale: 0.93 }],
    },
    moodEmojiWrap: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.7)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
    },
    moodEmoji: {
        fontSize: 26,
    },
    moodLabel: {
        fontSize: 11,
        fontWeight: '500',
        color: '#8E8E93',
        letterSpacing: -0.1,
    },

    // Bottom bar
    bottomBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    pillRow: {
        flexDirection: 'row',
        gap: 8,
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        backgroundColor: 'rgba(120,120,128,0.08)',
    },
    pillPressed: {
        backgroundColor: 'rgba(120,120,128,0.14)',
    },
    pillLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8E8E93',
        letterSpacing: -0.2,
    },
    pillLabelActive: {
        color: '#fff',
    },

    // Send
    sendBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(120,120,128,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendBtnActive: {
        backgroundColor: '#007AFF',
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
});
