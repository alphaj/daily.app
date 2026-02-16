import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    TextInput,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    interpolate,
    runOnJS,
} from 'react-native-reanimated';
import { CheckCircle2, Repeat, Pill, X, ArrowUp } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useTodos } from '@/contexts/TodoContext';
import { useWorkMode } from '@/contexts/WorkModeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type CaptureMode = 'task';

interface CaptureBarProps {
    visible: boolean;
    onClose: () => void;
}

const MODES: { mode: CaptureMode | 'habit' | 'supplement'; icon: typeof CheckCircle2; label: string; color: string }[] = [
    { mode: 'task', icon: CheckCircle2, label: 'Task', color: '#007AFF' },
    { mode: 'habit', icon: Repeat, label: 'Habit', color: '#5AC8FA' },
    { mode: 'supplement', icon: Pill, label: 'Supplement', color: '#AF52DE' },
];

const SPRING_OPEN = { damping: 28, stiffness: 340, mass: 0.7 };
const SPRING_CLOSE = { damping: 26, stiffness: 380, mass: 0.6 };

export function CaptureBar({
    visible,
    onClose,
}: CaptureBarProps) {
    const [mode, setMode] = useState<CaptureMode>('task');
    const [tempInput, setTempInput] = useState('');
    const [mounted, setMounted] = useState(false);
    const { addTodo } = useTodos();
    const { isWorkMode } = useWorkMode();
    const router = useRouter();

    const progress = useSharedValue(0);
    const inputRef = useRef<TextInput>(null);

    const resetState = useCallback(() => {
        setMode('task');
        setTempInput('');
        Keyboard.dismiss();
    }, []);

    const finishClose = useCallback(() => {
        setMounted(false);
        onClose();
        resetState();
    }, [onClose, resetState]);

    const handleClose = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        progress.value = withSpring(0, SPRING_CLOSE, (finished) => {
            if (finished) {
                runOnJS(finishClose)();
            }
        });
    }, [onClose, progress, finishClose]);

    useEffect(() => {
        if (visible) {
            setMounted(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            progress.value = withSpring(1, SPRING_OPEN);
            setTimeout(() => inputRef.current?.focus(), 150);
        } else if (mounted) {
            handleClose();
        }
    }, [visible]);

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: progress.value,
    }));

    const panelStyle = useAnimatedStyle(() => ({
        opacity: progress.value,
        transform: [
            { translateY: interpolate(progress.value, [0, 1], [40, 0]) },
            { scale: interpolate(progress.value, [0, 1], [0.97, 1]) },
        ],
    }));

    const handleModeSwitch = (newMode: CaptureMode | 'habit' | 'supplement') => {
        Haptics.selectionAsync();
        if (newMode === 'habit') {
            handleClose();
            setTimeout(() => router.push('/add-habit'), 200);
            return;
        }
        if (newMode === 'supplement') {
            handleClose();
            setTimeout(() => router.push('/add-supplement'), 200);
            return;
        }
        if (newMode === mode) return;
        setMode(newMode);
        setTimeout(() => inputRef.current?.focus(), 80);
    };

    const handleSubmit = () => {
        if (!tempInput?.trim()) return;

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        addTodo(tempInput.trim(), new Date(), undefined, isWorkMode);
        handleClose();
    };

    const hasText = !!tempInput?.trim();

    if (!mounted) return null;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {/* Backdrop */}
            <Animated.View
                style={[styles.backdrop, backdropStyle]}
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
                <Animated.View style={[styles.panelOuter, panelStyle]}>
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

                            {/* Input area */}
                            <View style={styles.inputArea}>
                                <TextInput
                                    ref={inputRef}
                                    style={styles.textInput}
                                    placeholder="What needs to be done?"
                                    placeholderTextColor="rgba(60,60,67,0.3)"
                                    multiline
                                    value={tempInput}
                                    onChangeText={setTempInput}
                                    textAlignVertical="top"
                                    onSubmitEditing={handleSubmit}
                                    returnKeyType="done"
                                />
                            </View>

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
