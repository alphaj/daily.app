import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    TextInput,
    Animated,
    Keyboard,
    Dimensions,
    Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { X, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSpending } from '@/contexts/SpendingContext';
import { QUICK_AMOUNTS, formatCurrency, SpendingCategory } from '@/types/spending';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface QuickSpendModalProps {
    visible: boolean;
    category: SpendingCategory | null;
    onClose: () => void;
}

export function QuickSpendModal({ visible, category, onClose }: QuickSpendModalProps) {
    const { addTransaction } = useSpending();
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');

    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const backdropAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Reset state
            setAmount('');
            setNote('');

            // Animate in
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 65,
                    friction: 11,
                }),
                Animated.timing(backdropAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            // Animate out
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: SCREEN_HEIGHT,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(backdropAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    const handleQuickAmount = (quickAmount: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setAmount(quickAmount.toString());
    };

    const handleSubmit = () => {
        if (!category || !amount) return;

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) return;

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        addTransaction(category.id, numAmount, note || undefined, category.isWork);
        onClose();
    };

    const handleClose = () => {
        Keyboard.dismiss();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onClose();
    };

    if (!visible) return null;

    return (
        <View style={StyleSheet.absoluteFill}>
            {/* Backdrop */}
            <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
                <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
            </Animated.View>

            {/* Modal */}
            <Animated.View
                style={[
                    styles.modalContainer,
                    { transform: [{ translateY: slideAnim }] },
                ]}
            >
                <BlurView intensity={90} tint="light" style={styles.modal}>
                    {/* Handle bar */}
                    <View style={styles.handleBar} />

                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.categoryInfo}>
                            <Text style={styles.emoji}>{category?.emoji}</Text>
                            <Text style={styles.categoryName}>{category?.name}</Text>
                        </View>
                        <Pressable onPress={handleClose} hitSlop={12}>
                            <X size={24} color="#8E8E93" />
                        </Pressable>
                    </View>

                    {/* Amount input */}
                    <View style={styles.amountContainer}>
                        <Text style={styles.currencySymbol}>$</Text>
                        <TextInput
                            style={styles.amountInput}
                            value={amount}
                            onChangeText={setAmount}
                            placeholder="0"
                            placeholderTextColor="#C7C7CC"
                            keyboardType="decimal-pad"
                            autoFocus
                            selectTextOnFocus
                        />
                    </View>

                    {/* Quick amounts */}
                    <View style={styles.quickAmounts}>
                        {QUICK_AMOUNTS.map((quickAmount) => (
                            <Pressable
                                key={quickAmount}
                                style={[
                                    styles.quickAmountButton,
                                    amount === quickAmount.toString() && styles.quickAmountButtonActive,
                                ]}
                                onPress={() => handleQuickAmount(quickAmount)}
                            >
                                <Text
                                    style={[
                                        styles.quickAmountText,
                                        amount === quickAmount.toString() && styles.quickAmountTextActive,
                                    ]}
                                >
                                    {formatCurrency(quickAmount)}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    {/* Note input */}
                    <TextInput
                        style={styles.noteInput}
                        value={note}
                        onChangeText={setNote}
                        placeholder="Add a note (optional)"
                        placeholderTextColor="#C7C7CC"
                        returnKeyType="done"
                        onSubmitEditing={handleSubmit}
                    />

                    {/* Submit button */}
                    <Pressable
                        style={[
                            styles.submitButton,
                            (!amount || parseFloat(amount) <= 0) && styles.submitButtonDisabled,
                            { backgroundColor: category?.color || '#007AFF' },
                        ]}
                        onPress={handleSubmit}
                        disabled={!amount || parseFloat(amount) <= 0}
                    >
                        <Check size={20} color="#fff" strokeWidth={3} />
                        <Text style={styles.submitText}>Add Expense</Text>
                    </Pressable>
                </BlurView>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    modal: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        backgroundColor: Platform.OS === 'android' ? 'rgba(255,255,255,0.98)' : undefined,
    },
    handleBar: {
        width: 36,
        height: 5,
        backgroundColor: '#E5E5EA',
        borderRadius: 3,
        alignSelf: 'center',
        marginTop: 8,
        marginBottom: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    categoryInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    emoji: {
        fontSize: 28,
    },
    categoryName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
    },
    amountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    currencySymbol: {
        fontSize: 40,
        fontWeight: '700',
        color: '#8E8E93',
        marginRight: 4,
    },
    amountInput: {
        fontSize: 56,
        fontWeight: '700',
        color: '#000',
        minWidth: 100,
        textAlign: 'center',
    },
    quickAmounts: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 20,
    },
    quickAmountButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#F2F2F7',
    },
    quickAmountButtonActive: {
        backgroundColor: '#000',
    },
    quickAmountText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
    },
    quickAmountTextActive: {
        color: '#fff',
    },
    noteInput: {
        backgroundColor: '#F2F2F7',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        marginBottom: 20,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 14,
    },
    submitButtonDisabled: {
        opacity: 0.4,
    },
    submitText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#fff',
    },
});
