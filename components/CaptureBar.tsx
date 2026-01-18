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
import { PenLine, ChevronDown, Flame } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CaptureBarProps {
    noteText: string;
    onNoteChange: (text: string) => void;
    isSaving: boolean;
    selectedDate: Date;
    isToday: boolean;
    bottomOffset?: number;
}

export function CaptureBar({
    noteText,
    onNoteChange,
    isSaving,
    selectedDate,
    isToday,
    bottomOffset = 90,
}: CaptureBarProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const expandAnim = useRef(new Animated.Value(0)).current;
    const insets = useSafeAreaInsets();
    const inputRef = useRef<TextInput>(null);

    const toggleExpand = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const toValue = isExpanded ? 0 : 1;

        if (!isExpanded) {
            // Expanding
            Animated.spring(expandAnim, {
                toValue: 1,
                useNativeDriver: false,
                damping: 22,
                stiffness: 90,
                mass: 1,
            }).start(() => {
                inputRef.current?.focus();
            });
        } else {
            // Collapsing
            Keyboard.dismiss();
            Animated.spring(expandAnim, {
                toValue: 0,
                useNativeDriver: false,
                damping: 22,
                stiffness: 90,
                mass: 1,
            }).start();
        }

        setIsExpanded(!isExpanded);
    }, [isExpanded, expandAnim]);

    const handleDone = useCallback(() => {
        toggleExpand();
    }, [toggleExpand]);

    // Animated values
    const containerHeight = expandAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [56, SCREEN_HEIGHT * 0.75],
    });

    const containerBottom = expandAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [bottomOffset, 0],
    });

    const borderRadius = expandAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [28, 0],
    });

    const backdropOpacity = expandAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });

    return (
        <>
            {/* Backdrop */}
            <Animated.View
                style={[
                    styles.backdrop,
                    { opacity: backdropOpacity },
                ]}
                pointerEvents={isExpanded ? 'auto' : 'none'}
            >
                <Pressable style={StyleSheet.absoluteFill} onPress={handleDone} />
            </Animated.View>

            {/* Capture Bar */}
            <Animated.View
                style={[
                    styles.container,
                    {
                        height: containerHeight,
                        bottom: containerBottom,
                        borderTopLeftRadius: borderRadius,
                        borderTopRightRadius: borderRadius,
                    },
                ]}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                    keyboardVerticalOffset={0}
                >
                    {!isExpanded ? (
                        // Collapsed State
                        <Pressable onPress={toggleExpand} style={styles.collapsedBar}>
                            <View style={styles.collapsedLeft}>
                                <View style={styles.iconCircle}>
                                    <PenLine size={16} color="#5856D6" />
                                </View>
                                <Text style={styles.collapsedPlaceholder}>
                                    {noteText.length > 0
                                        ? noteText.substring(0, 35) + (noteText.length > 35 ? '...' : '')
                                        : "What's on your mind?"
                                    }
                                </Text>
                            </View>
                            {noteText.length > 0 && (
                                <View style={styles.hasContentDot} />
                            )}
                        </Pressable>
                    ) : (
                        // Expanded State
                        <View style={[styles.expandedContainer, { paddingBottom: insets.bottom }]}>
                            {/* Header */}
                            <View style={styles.expandedHeader}>
                                <View style={styles.expandedHeaderLeft}>
                                    <Text style={styles.expandedDate}>
                                        {isToday ? 'Today' : format(selectedDate, 'MMM d, yyyy')}
                                    </Text>
                                    <Text style={styles.expandedTitle}>Daily Note</Text>
                                </View>
                                <Pressable onPress={handleDone} style={styles.doneButton}>
                                    <Text style={styles.doneButtonText}>Done</Text>
                                </Pressable>
                            </View>

                            {/* Input Area */}
                            <View style={styles.inputContainer}>
                                <TextInput
                                    ref={inputRef}
                                    style={styles.textInput}
                                    placeholder={isToday
                                        ? "How was your day? What are you grateful for? What's on your mind?"
                                        : "What happened on this day?"
                                    }
                                    placeholderTextColor="#C7C7CC"
                                    multiline
                                    value={noteText}
                                    onChangeText={onNoteChange}
                                    textAlignVertical="top"
                                    autoFocus={false}
                                />
                            </View>

                            {/* Footer */}
                            <View style={styles.expandedFooter}>
                                <View style={styles.footerStats}>
                                    {noteText.length > 0 && (
                                        <Text style={styles.characterCount}>
                                            {noteText.length} characters
                                        </Text>
                                    )}
                                </View>
                                <View style={styles.saveIndicator}>
                                    {isSaving ? (
                                        <Text style={styles.savingText}>Saving...</Text>
                                    ) : noteText.length > 0 ? (
                                        <Text style={styles.savedText}>✓ Saved</Text>
                                    ) : null}
                                </View>
                            </View>

                            {/* Dismiss Handle */}
                            <Pressable onPress={handleDone} style={styles.dismissHandle}>
                                <ChevronDown size={24} color="#C7C7CC" />
                            </Pressable>
                        </View>
                    )}
                </KeyboardAvoidingView>
            </Animated.View>
        </>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        zIndex: 99,
    },
    container: {
        position: 'absolute',
        left: 16,
        right: 16,
        backgroundColor: '#fff',
        borderRadius: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
        zIndex: 100,
        overflow: 'hidden',
    },
    keyboardView: {
        flex: 1,
    },

    // Collapsed State
    collapsedBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    collapsedLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    iconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F0EFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    collapsedPlaceholder: {
        fontSize: 15,
        color: '#8E8E93',
        flex: 1,
    },
    hasContentDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#5856D6',
    },

    // Expanded State
    expandedContainer: {
        flex: 1,
        paddingTop: 20,
    },
    expandedHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    expandedHeaderLeft: {
        flex: 1,
    },
    expandedDate: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    expandedTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#000',
        letterSpacing: -0.5,
    },
    doneButton: {
        backgroundColor: '#5856D6',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    doneButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
    },

    // Input
    inputContainer: {
        flex: 1,
        paddingHorizontal: 24,
    },
    textInput: {
        flex: 1,
        fontSize: 17,
        lineHeight: 26,
        color: '#000',
        textAlignVertical: 'top',
    },

    // Footer
    expandedFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#E5E5EA',
    },
    footerStats: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    characterCount: {
        fontSize: 13,
        color: '#8E8E93',
    },
    saveIndicator: {},
    savingText: {
        fontSize: 13,
        color: '#FF9500',
        fontWeight: '600',
    },
    savedText: {
        fontSize: 13,
        color: '#34C759',
        fontWeight: '600',
    },

    // Dismiss Handle
    dismissHandle: {
        alignItems: 'center',
        paddingVertical: 8,
    },
});
