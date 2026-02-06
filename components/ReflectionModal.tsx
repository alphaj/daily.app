import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    Pressable,
    Animated,
    Dimensions,
} from 'react-native';
import { Heart, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import type { Habit } from '@/types/habit';

const { width } = Dimensions.get('window');

interface ReflectionModalProps {
    visible: boolean;
    habit: Habit | null;
    onDismiss: () => void;
    onKeepGoing?: () => void;
}

export function ReflectionModal({ visible, habit, onDismiss, onKeepGoing }: ReflectionModalProps) {
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                    speed: 10,
                    bounciness: 8,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            scaleAnim.setValue(0.8);
            opacityAnim.setValue(0);
        }
    }, [visible, scaleAnim, opacityAnim]);

    const animateOut = (callback: () => void) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Animated.parallel([
            Animated.timing(scaleAnim, {
                toValue: 0.8,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }),
        ]).start(() => {
            callback();
        });
    };

    const handleDismiss = () => animateOut(onDismiss);

    const handleKeepGoing = () => {
        if (onKeepGoing) {
            animateOut(onKeepGoing);
        } else {
            handleDismiss();
        }
    };

    if (!visible || !habit) return null;

    const whyStatement = habit.whyStatement || "You started this habit for a reason. Take a moment to remember why it matters to you.";

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={handleDismiss}
        >
            <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
                <Pressable style={styles.overlayPressable} onPress={handleDismiss}>
                    <Animated.View
                        style={[
                            styles.modalContainer,
                            { transform: [{ scale: scaleAnim }] }
                        ]}
                    >
                        <Pressable onPress={(e) => e.stopPropagation()}>
                            {/* Close Button */}
                            <Pressable style={styles.closeButton} onPress={handleDismiss} hitSlop={10}>
                                <X size={20} color="#8E8E93" strokeWidth={2} />
                            </Pressable>

                            {/* Emoji */}
                            <View style={styles.emojiContainer}>
                                <Text style={styles.emoji}>{habit.emoji || '💭'}</Text>
                            </View>

                            {/* Habit Name */}
                            <Text style={styles.habitName}>{habit.name}</Text>

                            {/* Streak Info */}
                            <View style={styles.streakInfo}>
                                <Text style={styles.streakText}>Your streak needs attention</Text>
                            </View>

                            {/* Divider */}
                            <View style={styles.divider} />

                            {/* Why Statement */}
                            <View style={styles.whySection}>
                                <View style={styles.whyHeader}>
                                    <Heart size={16} color="#FF6B6B" fill="#FF6B6B" />
                                    <Text style={styles.whyLabel}>Remember why you started</Text>
                                </View>
                                <Text style={styles.whyStatement}>"{whyStatement}"</Text>
                            </View>

                            {/* Action Buttons */}
                            <Pressable style={styles.actionButton} onPress={handleKeepGoing}>
                                <Text style={styles.actionButtonText}>I've got this</Text>
                            </Pressable>

                            <Pressable style={styles.dismissButton} onPress={handleDismiss}>
                                <Text style={styles.dismissButtonText}>Dismiss</Text>
                            </Pressable>
                        </Pressable>
                    </Animated.View>
                </Pressable>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlayPressable: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: width - 48,
        maxWidth: 340,
        backgroundColor: '#fff',
        borderRadius: 28,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 8,
    },
    closeButton: {
        position: 'absolute',
        top: 0,
        right: 0,
        padding: 8,
    },
    emojiContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emoji: {
        fontSize: 40,
    },
    habitName: {
        fontSize: 22,
        fontWeight: '700',
        color: '#000',
        textAlign: 'center',
        marginBottom: 8,
    },
    streakInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 20,
    },
    streakText: {
        fontSize: 14,
        color: '#FF9500',
        fontWeight: '600',
    },
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: '#F2F2F7',
        marginBottom: 20,
    },
    whySection: {
        width: '100%',
        marginBottom: 24,
    },
    whyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    whyLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    whyStatement: {
        fontSize: 18,
        fontWeight: '500',
        color: '#000',
        lineHeight: 26,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    actionButton: {
        width: '100%',
        backgroundColor: '#000',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        marginBottom: 8,
    },
    actionButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#fff',
    },
    dismissButton: {
        width: '100%',
        paddingVertical: 12,
        alignItems: 'center',
    },
    dismissButtonText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#8E8E93',
    },
});
