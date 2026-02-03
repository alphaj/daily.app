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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTodos } from '@/contexts/TodoContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type CaptureMode = 'menu' | 'note' | 'task' | 'mood';

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

export function CaptureBar({
    noteText,
    onNoteChange,
    isSaving,
    visible,
    onClose,
}: CaptureBarProps) {
    const [mode, setMode] = useState<CaptureMode>('menu');
    const [tempInput, setTempInput] = useState('');
    const { addTodo } = useTodos();

    // Animation Replaces
    const expandAnim = useRef(new Animated.Value(0)).current;

    // We animate opacity of content separately for smoothness
    const contentOpacity = useRef(new Animated.Value(0)).current;

    const inputRef = useRef<TextInput>(null);

    // Reset state when closing
    const resetState = useCallback(() => {
        setMode('menu');
        setTempInput('');
        Keyboard.dismiss();
    }, []);

    const handleClose = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // Animate out
        Animated.parallel([
            Animated.spring(expandAnim, {
                toValue: 0,
                base: 1, // Fix for some react-native versions needing base
                useNativeDriver: true,
                damping: 20,
                stiffness: 300,
                mass: 0.8,
            }),
            Animated.timing(contentOpacity, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            })
        ]).start(({ finished }) => {
            if (finished) {
                onClose();
                resetState();
            }
        });
    }, [onClose, expandAnim, contentOpacity, resetState]);

    useEffect(() => {
        if (visible) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            // Animate in
            // 1. Expand panel
            Animated.spring(expandAnim, {
                toValue: 1,
                useNativeDriver: true,
                damping: 20,
                stiffness: 300,
                mass: 0.8,
            }).start();

            // 2. Fade in content slightly delayed
            Animated.sequence([
                Animated.delay(50),
                Animated.timing(contentOpacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            // If visible prop changes to false from parent
            if (expandAnim._value > 0.1) {
                handleClose();
            }
        }
    }, [visible, expandAnim, contentOpacity]);


    const handleModeSelect = (newMode: CaptureMode) => {
        Haptics.selectionAsync();
        setMode(newMode);

        if (newMode === 'task' || newMode === 'note') {
            // Small delay to allow layout to settle
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    const handleSubmit = () => {
        if (!tempInput.trim() && mode === 'task') return;

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        if (mode === 'task') {
            addTodo(tempInput.trim(), new Date(), undefined, true);
        }

        handleClose();
    };

    const handleMoodSelect = (emoji: string) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const moodText = `\nMood: ${emoji}`;
        // Append to note
        onNoteChange(noteText ? noteText + moodText : `Mood: ${emoji}`);
        handleClose();
    };

    // Render Helpers
    const renderActionItem = (icon: React.ReactNode, label: string, targetMode: CaptureMode, color: string, bgColor: string) => (
        <Pressable
            style={({ pressed }) => [
                styles.actionItem,
                { backgroundColor: bgColor },
                pressed && { transform: [{ scale: 0.96 }], opacity: 0.8 }
            ]}
            onPress={() => handleModeSelect(targetMode)}
        >
            <View style={[styles.actionIconCircle, { backgroundColor: color }]}>
                {icon}
            </View>
            <Text style={styles.actionLabel}>{label}</Text>
        </Pressable>
    );

    const renderContent = () => {
        // Quick Capture Menu
        if (mode === 'menu') {
            return (
                <View style={styles.menuGrid}>
                    <Text style={styles.sectionTitle}>Quick Capture</Text>
                    <View style={styles.actionsRow}>
                        {renderActionItem(<CheckCircle2 size={24} color="#fff" strokeWidth={2.5} />, "Task", "task", "#007AFF", "rgba(0,122,255,0.1)")}
                        {renderActionItem(<StickyNote size={24} color="#fff" strokeWidth={2.5} />, "Note", "note", "#FFCC00", "rgba(255,204,0,0.1)")}
                        {renderActionItem(<Smile size={24} color="#fff" strokeWidth={2.5} />, "Mood", "mood", "#AF52DE", "rgba(175,82,222,0.1)")}
                    </View>
                </View>
            );
        }

        if (mode === 'mood') {
            return (
                <View style={styles.moodSection}>
                    <Text style={styles.modeTitle}>How are you feeling?</Text>
                    <View style={styles.emojiGrid}>
                        {['🤩', '😊', '🙂', '😐', '🤔', '😓', '😡'].map(emoji => (
                            <Pressable
                                key={emoji}
                                style={({ pressed }) => [
                                    styles.emojiBtn,
                                    pressed && { transform: [{ scale: 0.8 }], backgroundColor: 'rgba(0,0,0,0.1)' }
                                ]}
                                onPress={() => handleMoodSelect(emoji)}
                            >
                                <Text style={styles.emojiText}>{emoji}</Text>
                            </Pressable>
                        ))}
                    </View>
                </View>
            );
        }

        // Task or Note Input
        return (
            <View style={styles.inputSection}>
                <View style={styles.inputHeader}>
                    <Text style={styles.modeTitle}>
                        {mode === 'task' ? 'New Task' : 'Daily Note'}
                    </Text>
                    {mode === 'task' && (
                        <Pressable
                            style={({ pressed }) => [
                                styles.sendButton,
                                pressed && { transform: [{ scale: 0.9 }] }
                            ]}
                            onPress={handleSubmit}
                        >
                            <ArrowUp size={20} color="#fff" strokeWidth={3} />
                        </Pressable>
                    )}
                </View>
                <TextInput
                    ref={inputRef}
                    style={styles.mainInput}
                    placeholder={mode === 'task' ? "What needs to be done?" : "Write something..."}
                    placeholderTextColor="rgba(60, 60, 67, 0.3)"
                    multiline
                    value={mode === 'note' ? noteText : tempInput}
                    onChangeText={mode === 'note' ? onNoteChange : setTempInput}
                    textAlignVertical="top"
                    onSubmitEditing={mode === 'task' ? handleSubmit : undefined}
                    returnKeyType={mode === 'task' ? 'done' : 'default'}
                />
            </View>
        );
    };

    if (!visible && expandAnim._value === 0) return null;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {/* Backdrop */}
            <Animated.View
                style={[
                    styles.backdrop,
                    { opacity: expandAnim }
                ]}
                pointerEvents={visible ? 'auto' : 'none'}
            >
                <Pressable style={StyleSheet.absoluteFill} onPress={handleClose}>
                    <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
                </Pressable>
            </Animated.View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.keyboardView}
                pointerEvents="box-none"
            >
                <Animated.View
                    style={[
                        styles.panelContainer,
                        {
                            transform: [
                                {
                                    translateY: expandAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [100, 0] // Slide up slightly
                                    })
                                },
                                {
                                    scale: expandAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.95, 1] // Scale up slightly
                                    })
                                }
                            ],
                            opacity: expandAnim
                        }
                    ]}
                >
                    <BlurView
                        intensity={80}
                        tint="light"
                        style={styles.blurPanel}
                    >
                        <View style={styles.dragHandle} />

                        {/* Header Controls */}
                        <View style={styles.header}>
                            <View style={styles.headerLeft}>
                                {mode !== 'menu' && (
                                    <Pressable
                                        onPress={() => {
                                            Haptics.selectionAsync();
                                            setMode('menu');
                                            setTempInput('');
                                            Keyboard.dismiss();
                                        }}
                                        style={({ pressed }) => [
                                            styles.backButton,
                                            pressed && { opacity: 0.6 }
                                        ]}
                                        hitSlop={10}
                                    >
                                        <Text style={styles.backText}>Cancel</Text>
                                    </Pressable>
                                )}
                            </View>
                            <View style={styles.headerRight}>
                                {mode === 'note' && (
                                    <Pressable
                                        onPress={handleClose}
                                        style={({ pressed }) => [
                                            styles.doneButton,
                                            pressed && { opacity: 0.8 }
                                        ]}
                                    >
                                        <Text style={styles.doneText}>Done</Text>
                                    </Pressable>
                                )}
                            </View>
                        </View>

                        <Animated.View style={[styles.contentWrapper, { opacity: contentOpacity }]}>
                            {renderContent()}
                        </Animated.View>
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
        paddingBottom: 50, // Floating above bottom
    },
    panelContainer: {
        width: Math.min(SCREEN_WIDTH - 40, 380), // Slightly narrower than screen
        borderRadius: 40,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
        elevation: 12,
    },
    blurPanel: {
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 24,
        minHeight: 260,
        backgroundColor: 'rgba(255,255,255,0.7)',
    },
    dragHandle: {
        width: 36,
        height: 5,
        backgroundColor: 'rgba(60, 60, 67, 0.15)',
        borderRadius: 2.5,
        alignSelf: 'center',
        marginBottom: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        height: 24,
    },
    headerLeft: {
        flex: 1,
        alignItems: 'flex-start',
    },
    headerRight: {
        flex: 1,
        alignItems: 'flex-end',
    },
    backButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        marginLeft: -12,
        borderRadius: 14,
    },
    backText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#8E8E93',
    },
    doneButton: {
        paddingVertical: 6,
        paddingHorizontal: 16,
        backgroundColor: '#000',
        borderRadius: 16,
    },
    doneText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    contentWrapper: {
        flex: 1,
    },

    // Menu Mode
    menuGrid: {
        flex: 1,
        gap: 16,
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(60, 60, 67, 0.6)',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginLeft: 4,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    actionItem: {
        flex: 1,
        height: 120, // Taller buttons
        borderRadius: 28, // More rounded
        padding: 16,
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    actionIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    actionLabel: {
        fontSize: 17, // Larger text
        fontWeight: '600',
        color: '#000',
        letterSpacing: -0.4,
    },

    // Input Mode
    inputSection: {
        flex: 1,
        gap: 16,
        marginTop: 10,
    },
    inputHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modeTitle: {
        fontSize: 28, // iOS Large Title
        fontWeight: '700',
        color: '#000',
        letterSpacing: -0.6,
    },
    mainInput: {
        fontSize: 22,
        fontWeight: '400',
        lineHeight: 28,
        color: '#000',
        minHeight: 100,
        paddingTop: 0, // Align text to top without padding
    },
    sendButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#007AFF', // IOS Blue
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },

    // Mood Mode
    moodSection: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 10,
    },
    emojiGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        justifyContent: 'center',
        marginTop: 30,
        marginBottom: 20,
    },
    emojiBtn: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    emojiText: {
        fontSize: 32,
    },
});
