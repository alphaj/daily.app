import React, { useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Animated,
    Alert,
} from 'react-native';
import { Check, RotateCcw, ShoppingCart, X, CheckCircle2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import SwipeableRow from '@/components/SwipeableRow';
import type { GroceryItem } from '@/types/grocery';
import { CATEGORY_CONFIG } from '@/types/grocery';

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

    const handlePress = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        if (isShoppingMode) {
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

    const handleRemoveFromList = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onToggleList(item.id);
    }, [item.id, onToggleList]);

    const handleAddToList = useCallback(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onToggleList(item.id);
    }, [item.id, onToggleList]);

    // Build meta text: quantity · brand
    const metaParts: string[] = [];
    if (item.quantity) metaParts.push(item.quantity);
    if (item.brand) metaParts.push(item.brand);
    const metaText = metaParts.join(' · ');

    return (
        <SwipeableRow
            onDelete={isShoppingMode ? handleRemoveFromList : handleDelete}
            onConvertToTask={isShoppingMode ? handleSwipeComplete : handleAddToList}
            rightActionColor={isShoppingMode ? '#FF9500' : '#FF3B30'}
            rightActionIcon={isShoppingMode
                ? <X size={24} color="#fff" strokeWidth={2.5} />
                : undefined
            }
            leftActionIcon={isShoppingMode
                ? <CheckCircle2 size={22} color="#fff" strokeWidth={2} />
                : <ShoppingCart size={22} color="#fff" strokeWidth={2} />
            }
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
                    {/* Leading circle indicator */}
                    {isShoppingMode ? (
                        <View style={styles.checkCircle}>
                            <Check size={14} color="#fff" strokeWidth={3} />
                        </View>
                    ) : (
                        <View style={[
                            styles.listIndicator,
                            item.isOnList && styles.listIndicatorActive,
                        ]}>
                            {item.isOnList && <Check size={13} color="#fff" strokeWidth={3} />}
                        </View>
                    )}

                    {/* Content */}
                    <View style={styles.content}>
                        <View style={styles.titleRow}>
                            <Text style={styles.name} numberOfLines={1}>
                                {item.name}
                            </Text>
                            {item.isStaple && (
                                <RotateCcw size={10} color="#C7C7CC" strokeWidth={2.5} />
                            )}
                        </View>
                        {metaText.length > 0 && (
                            <Text style={styles.meta} numberOfLines={1}>{metaText}</Text>
                        )}
                    </View>

                    {/* Optional quantity pill in shopping mode */}
                    {isShoppingMode && item.quantity && (
                        <View style={styles.quantityPill}>
                            <Text style={styles.quantityPillText}>{item.quantity}</Text>
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
        paddingVertical: 13,
        paddingHorizontal: 16,
        gap: 12,
        minHeight: 48,
    },
    cardFirst: {
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    cardLast: {
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    name: {
        fontSize: 17,
        fontWeight: '500',
        color: '#000',
        letterSpacing: -0.4,
        flexShrink: 1,
    },
    meta: {
        fontSize: 13,
        fontWeight: '400',
        color: '#8E8E93',
        marginTop: 2,
    },
    listIndicator: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#D1D1D6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    listIndicatorActive: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    checkCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#34C759',
        alignItems: 'center',
        justifyContent: 'center',
    },
    quantityPill: {
        backgroundColor: '#F2F2F7',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    quantityPillText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#8E8E93',
    },
    separator: {
        position: 'absolute',
        bottom: 0,
        left: 46,
        right: 0,
        height: StyleSheet.hairlineWidth,
        backgroundColor: 'rgba(60, 60, 67, 0.12)',
    },
});
