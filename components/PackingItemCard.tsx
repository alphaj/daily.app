import React, { useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
} from 'react-native';
import { Check } from 'lucide-react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import SwipeableRow from '@/components/SwipeableRow';
import type { PackingItem } from '@/types/travel';
import { PACKING_CATEGORY_CONFIG } from '@/types/travel';
import { getPackingIcon } from '@/lib/packingIcons';

interface PackingItemCardProps {
    item: PackingItem;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    isFirst?: boolean;
    isLast?: boolean;
}

export function PackingItemCard({
    item,
    onToggle,
    onDelete,
    isFirst = false,
    isLast = false,
}: PackingItemCardProps) {
    const handlePress = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onToggle(item.id);
    }, [item.id, onToggle]);

    const handleDelete = useCallback(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onDelete(item.id);
    }, [item.id, onDelete]);

    const categoryColor = PACKING_CATEGORY_CONFIG[item.category].color;
    const iconName = getPackingIcon(item.name, item.category);

    return (
        <SwipeableRow onDelete={handleDelete}>
            <Pressable onPress={handlePress}>
                <View
                    style={[
                        styles.card,
                        isFirst && styles.cardFirst,
                        isLast && styles.cardLast,
                    ]}
                >
                    {/* Circle indicator */}
                    {item.packed ? (
                        <View style={[styles.checkCircle, { backgroundColor: categoryColor }]}>
                            <Check size={13} color="#fff" strokeWidth={3} />
                        </View>
                    ) : (
                        <View style={[styles.emptyCircle, { borderColor: categoryColor }]} />
                    )}

                    {/* Item icon (only when a specific match exists) */}
                    {iconName && (
                        <View style={[styles.iconContainer, { backgroundColor: categoryColor + '10' }]}>
                            <MaterialCommunityIcons
                                name={iconName as any}
                                size={18}
                                color={item.packed ? '#C7C7CC' : categoryColor}
                            />
                        </View>
                    )}

                    {/* Content */}
                    <View style={styles.content}>
                        <Text
                            style={[
                                styles.name,
                                item.packed && styles.namePacked,
                            ]}
                            numberOfLines={1}
                        >
                            {item.name}
                        </Text>
                    </View>

                    {/* Quantity badge */}
                    {item.quantity > 1 && (
                        <View style={styles.quantityBadge}>
                            <Text style={styles.quantityText}>x{item.quantity}</Text>
                        </View>
                    )}

                    {/* Separator */}
                    {!isLast && <View style={styles.separator} />}
                </View>
            </Pressable>
        </SwipeableRow>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.85)',
        paddingVertical: 13,
        paddingHorizontal: 16,
        gap: 12,
        minHeight: 48,
    },
    cardFirst: {
        borderTopLeftRadius: 14,
        borderTopRightRadius: 14,
    },
    cardLast: {
        borderBottomLeftRadius: 14,
        borderBottomRightRadius: 14,
    },
    checkCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
    },
    iconContainer: {
        width: 30,
        height: 30,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    name: {
        fontSize: 17,
        fontWeight: '500',
        color: '#000',
        letterSpacing: -0.4,
    },
    namePacked: {
        textDecorationLine: 'line-through',
        color: '#8E8E93',
        opacity: 0.6,
    },
    quantityBadge: {
        backgroundColor: '#F2F2F7',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    quantityText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#8E8E93',
    },
    separator: {
        position: 'absolute',
        bottom: 0,
        left: 80,
        right: 0,
        height: StyleSheet.hairlineWidth,
        backgroundColor: 'rgba(60, 60, 67, 0.12)',
    },
});
