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
import { GroceryIcon } from '@/components/GroceryIcon';
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

    const handleRemoveFromList = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onToggleList(item.id);
    }, [item.id, onToggleList]);

    const handleAddToList = useCallback(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onToggleList(item.id);
    }, [item.id, onToggleList]);

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
                    {/* Category accent */}
                    <View style={[styles.categoryAccent, { backgroundColor: categoryConfig.color }]} />

                    {/* Icon */}
                    <View style={[styles.iconContainer, { backgroundColor: categoryConfig.color + '15' }]}>
                        <GroceryIcon
                            name={item.name}
                            category={item.category}
                            size={20}
                            color={categoryConfig.color}
                        />
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
        paddingVertical: 11,
        paddingHorizontal: 16,
        paddingLeft: 4,
        gap: 10,
        minHeight: 44,
    },
    cardFirst: {
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
    },
    cardLast: {
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
    },
    categoryAccent: {
        width: 3,
        height: 28,
        borderRadius: 1.5,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
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
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#34C759',
        alignItems: 'center',
        justifyContent: 'center',
    },
    separator: {
        position: 'absolute',
        bottom: 0,
        left: 64,
        right: 0,
        height: StyleSheet.hairlineWidth,
        backgroundColor: 'rgba(60, 60, 67, 0.12)',
    },
});
