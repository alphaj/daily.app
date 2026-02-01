import React, { useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Animated,
    Dimensions,
} from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { Swipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { Transaction, SpendingCategory, formatCurrency } from '@/types/spending';
import { format } from 'date-fns';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TransactionRowProps {
    transaction: Transaction;
    category?: SpendingCategory;
    onDelete: (id: string) => void;
    onPress?: (transaction: Transaction) => void;
}

export function TransactionRow({
    transaction,
    category,
    onDelete,
    onPress,
}: TransactionRowProps) {
    const swipeableRef = useRef<Swipeable>(null);

    const renderRightActions = (
        progress: Animated.AnimatedInterpolation<number>,
        dragX: Animated.AnimatedInterpolation<number>
    ) => {
        const scale = dragX.interpolate({
            inputRange: [-80, 0],
            outputRange: [1, 0.5],
            extrapolate: 'clamp',
        });

        const opacity = dragX.interpolate({
            inputRange: [-80, -40, 0],
            outputRange: [1, 0.5, 0],
            extrapolate: 'clamp',
        });

        return (
            <Animated.View style={[styles.deleteAction, { opacity }]}>
                <Pressable
                    style={styles.deleteButton}
                    onPress={() => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        swipeableRef.current?.close();
                        onDelete(transaction.id);
                    }}
                >
                    <Animated.View style={{ transform: [{ scale }] }}>
                        <Trash2 size={20} color="#fff" />
                    </Animated.View>
                </Pressable>
            </Animated.View>
        );
    };

    const handleSwipeOpen = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    return (
        <Swipeable
            ref={swipeableRef}
            renderRightActions={renderRightActions}
            onSwipeableOpen={handleSwipeOpen}
            rightThreshold={40}
            overshootRight={false}
        >
            <Pressable
                style={styles.container}
                onPress={() => onPress?.(transaction)}
            >
                <Text style={styles.emoji}>{category?.emoji || '💰'}</Text>
                <View style={styles.info}>
                    <Text style={styles.name} numberOfLines={1}>
                        {transaction.note || category?.name || 'Expense'}
                    </Text>
                    <Text style={styles.time}>
                        {format(new Date(transaction.timestamp), 'MMM d, h:mm a')}
                    </Text>
                </View>
                <Text style={styles.amount}>
                    -{formatCurrency(transaction.amount)}
                </Text>
            </Pressable>
        </Swipeable>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 0.5,
        borderBottomColor: '#E5E5EA',
    },
    emoji: {
        fontSize: 24,
        marginRight: 12,
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000',
    },
    time: {
        fontSize: 13,
        color: '#8E8E93',
        marginTop: 2,
    },
    amount: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FF3B30',
    },
    deleteAction: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteButton: {
        backgroundColor: '#FF3B30',
        width: 80,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
