import React, { useRef, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Animated,
    Alert,
    ActionSheetIOS,
} from 'react-native';
import { Check, Flame } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import type { Supplement } from '@/types/supplement';
import { useHaptics } from '@/hooks/useHaptics';

interface SupplementCardProps {
    supplement: Supplement;
    isTaken: boolean;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onEdit: (id: string) => void;
}

export function SupplementCard({
    supplement,
    isTaken,
    onToggle,
    onDelete,
    onEdit,
}: SupplementCardProps) {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const badgeScale = useRef(new Animated.Value(isTaken ? 1 : 0)).current;
    const ringColorAnim = useRef(new Animated.Value(isTaken ? 1 : 0)).current;
    const haptics = useHaptics();

    useEffect(() => {
        Animated.spring(badgeScale, {
            toValue: isTaken ? 1 : 0,
            friction: 5,
            tension: 200,
            useNativeDriver: true,
        }).start();
        Animated.timing(ringColorAnim, {
            toValue: isTaken ? 1 : 0,
            duration: 250,
            useNativeDriver: false,
        }).start();
    }, [isTaken]);

    const handlePress = useCallback(() => {
        if (!isTaken) {
            haptics.doubleTap();
        } else {
            haptics.softTick();
        }

        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 0.88,
                duration: 80,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 4,
                tension: 200,
                useNativeDriver: true,
            }),
        ]).start();

        onToggle(supplement.id);
    }, [supplement.id, isTaken, onToggle, scaleAnim, haptics]);

    const handleLongPress = useCallback(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

        ActionSheetIOS.showActionSheetWithOptions(
            {
                options: ['Edit', 'Delete', 'Cancel'],
                destructiveButtonIndex: 1,
                cancelButtonIndex: 2,
                title: supplement.name,
                message: supplement.dosage ? `Dosage: ${supplement.dosage}` : undefined,
            },
            (buttonIndex) => {
                if (buttonIndex === 0) {
                    onEdit(supplement.id);
                } else if (buttonIndex === 1) {
                    Alert.alert(
                        "Delete Supplement",
                        `Are you sure you want to delete "${supplement.name}"?`,
                        [
                            { text: "Cancel", style: "cancel" },
                            {
                                text: "Delete",
                                style: "destructive",
                                onPress: () => onDelete(supplement.id)
                            }
                        ]
                    );
                }
            }
        );
    }, [supplement.id, supplement.name, supplement.dosage, onDelete, onEdit]);

    return (
        <Pressable
            onPress={handlePress}
            onLongPress={handleLongPress}
            delayLongPress={500}
            style={styles.container}
        >
            <Animated.View
                style={[
                    styles.iconContainer,
                    isTaken ? styles.iconContainerTaken : styles.iconContainerUntaken,
                    { transform: [{ scale: scaleAnim }] }
                ]}
            >
                {/* Progress/State Ring or Background */}
                <View style={[styles.ring, isTaken && styles.ringTaken]}>
                    <Text style={styles.emoji}>{supplement.emoji || '💊'}</Text>
                </View>

                {/* Status Badge - animated */}
                <Animated.View
                    style={[
                        styles.badge,
                        {
                            transform: [{ scale: badgeScale }],
                            opacity: badgeScale,
                        },
                    ]}
                    pointerEvents={isTaken ? 'auto' : 'none'}
                >
                    <Check size={12} color="#fff" strokeWidth={4} />
                </Animated.View>

                {/* Fire Streak Badge (Optional - overlay or keep minimal) */}
                {supplement.currentStreak > 0 && !isTaken && (
                    <View style={styles.streakMiniBadge}>
                        <Flame size={10} color="#FF9500" fill="#FF9500" />
                    </View>
                )}
            </Animated.View>

            <View style={styles.textContainer}>
                <Text
                    style={[styles.name, isTaken && styles.nameTaken]}
                    numberOfLines={1}
                >
                    {supplement.name}
                </Text>
                {supplement.dosage ? (
                    <Text style={styles.dosage} numberOfLines={1}>
                        {supplement.dosage}
                    </Text>
                ) : null}
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginRight: 20,
        width: 80, // Fixed width for alignment
    },
    iconContainer: {
        width: 72,
        height: 72,
        borderRadius: 22, // Continuous curve / Squircle-ish
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    iconContainerUntaken: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    iconContainerTaken: {
        backgroundColor: '#E8F5E9', // Light green background
        borderWidth: 1,
        borderColor: '#C8E6C9',
        shadowColor: '#4CAF50',
        shadowOpacity: 0.2,
    },
    ring: {
        width: 54,
        height: 54,
        borderRadius: 27,
        borderWidth: 3,
        borderColor: '#F2F2F7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    ringTaken: {
        borderColor: '#4CAF50',
    },
    emoji: {
        fontSize: 26,
    },
    badge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        backgroundColor: '#34C759',
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    streakMiniBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#fff',
        padding: 4,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#F2F2F7',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    textContainer: {
        alignItems: 'center',
        width: '120%',
    },
    name: {
        fontSize: 13,
        fontWeight: '600',
        color: '#000',
        textAlign: 'center',
        marginBottom: 2,
    },
    nameTaken: {
        color: '#3C3C43',
        // opacity: 0.6, // Optional: fade text when taken?
    },
    dosage: {
        fontSize: 11,
        color: '#8E8E93',
        fontWeight: '500',
        textAlign: 'center',
    },
});
