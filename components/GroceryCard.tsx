import React, { useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Animated,
    Alert,
} from 'react-native';
import { Check, RotateCcw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import SwipeableRow from '@/components/SwipeableRow';
import type { GroceryItem } from '@/types/grocery';
import { CATEGORY_CONFIG, FREQUENCY_CONFIG } from '@/types/grocery';

interface GroceryCardProps {
    item: GroceryItem;
    onToggleList: (id: string) => void;
    onMarkPurchased: (id: string) => void;
    onDelete: (id: string) => void;
    onEdit: (item: GroceryItem) => void;
    isShoppingMode?: boolean;
    isFirst?: boolean;
    isLast?: boolean;
}

export function GroceryCard({
    item,
    onToggleList,
    onMarkPurchased,
    onDelete,
    onEdit,
    isShoppingMode = false,
    isFirst = false,
    isLast = false,
}: GroceryCardProps) {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const categoryConfig = CATEGORY_CONFIG[item.category];

    const handlePress = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        if (isShoppingMode) {
            // In shopping mode, tap marks as purchased
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 0.95,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 100,
                    useNativeDriver: true,
                }),
            ]).start();
            onMarkPurchased(item.id);
        } else {
            // In pantry mode, tap toggles on/off list
            onToggleList(item.id);
        }
    }, [item.id, isShoppingMode, onToggleList, onMarkPurchased, scaleAnim]);

    const handleLongPress = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert(
            item.name,
            item.brand ? `${item.brand}` : undefined,
            [
                { text: 'Edit', onPress: () => onEdit(item) },
                {
                    text: item.isOnList ? 'Remove from List' : 'Add to List',
                    onPress: () => onToggleList(item.id),
                },
                { text: 'Delete', style: 'destructive', onPress: () => onDelete(item.id) },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    }, [item, onToggleList, onDelete, onEdit]);

    const handleDelete = useCallback(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onDelete(item.id);
    }, [item.id, onDelete]);

    const handleSwipeComplete = useCallback(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onMarkPurchased(item.id);
    }, [item.id, onMarkPurchased]);

    return (
        <SwipeableRow
            onDelete={handleDelete}
            {...(isShoppingMode && { onConvertToTask: handleSwipeComplete })}
        >
            <Pressable
                onPress={handlePress}
                onLongPress={handleLongPress}
                delayLongPress={300}
            >
                <Animated.View
                    style={[
                        styles.card,
                        isFirst && styles.cardFirst,
                        isLast && styles.cardLast,
                        { transform: [{ scale: scaleAnim }] },
                    ]}
                >
                    {/* Category accent */}
                    <View style={[styles.categoryAccent, { backgroundColor: categoryConfig.color }]} />

                    {/* Emoji */}
                    <View style={[styles.emojiContainer, { backgroundColor: categoryConfig.color + '15' }]}>
                        <Text style={styles.emoji}>{item.emoji || categoryConfig.emoji}</Text>
                    </View>

                    {/* Content */}
                    <View style={styles.content}>
                        <View style={styles.titleRow}>
                            <Text style={styles.name} numberOfLines={1}>
                                {item.name}
                            </Text>
                            {item.isStaple && (
                                <View style={styles.stapleBadge}>
                                    <RotateCcw size={10} color="#8E8E93" strokeWidth={2.5} />
                                </View>
                            )}
                        </View>
                        <View style={styles.metaRow}>
                            {item.quantity && (
                                <Text style={styles.quantity}>{item.quantity}</Text>
                            )}
                            {item.brand && (
                                <Text style={styles.brand}>{item.brand}</Text>
                            )}
                            {!item.quantity && !item.brand && (
                                <Text style={styles.category}>{categoryConfig.label}</Text>
                            )}
                        </View>
                    </View>

                    {/* Status indicator */}
                    {isShoppingMode ? (
                        <View style={styles.checkCircle}>
                            <Check size={16} color="#fff" strokeWidth={3} />
                        </View>
                    ) : (
                        <View style={[
                            styles.listIndicator,
                            item.isOnList && styles.listIndicatorActive,
                        ]}>
                            {item.isOnList && <Check size={14} color="#fff" strokeWidth={3} />}
                        </View>
                    )}

                    {/* Separator */}
                    {!isLast && <View style={styles.separator} />}
                </Animated.View>
            </Pressable>
        </SwipeableRow>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 14,
        paddingHorizontal: 16,
        paddingLeft: 4,
        gap: 12,
    },
    cardFirst: {
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    cardLast: {
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
    },
    categoryAccent: {
        width: 3,
        height: 32,
        borderRadius: 2,
    },
    emojiContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emoji: {
        fontSize: 20,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 2,
    },
    name: {
        fontSize: 17,
        fontWeight: '500',
        color: '#000',
        letterSpacing: -0.4,
        flex: 1,
    },
    stapleBadge: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    quantity: {
        fontSize: 13,
        fontWeight: '500',
        color: '#8E8E93',
    },
    brand: {
        fontSize: 13,
        color: '#8E8E93',
    },
    category: {
        fontSize: 13,
        color: '#C7C7CC',
    },
    listIndicator: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#D1D1D6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    listIndicatorActive: {
        backgroundColor: '#34C759',
        borderColor: '#34C759',
    },
    checkCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#34C759',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#34C759',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    separator: {
        position: 'absolute',
        bottom: 0,
        left: 72,
        right: 0,
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#E5E5EA',
    },
});
