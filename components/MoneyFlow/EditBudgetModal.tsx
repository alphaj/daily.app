import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    TextInput,
    Animated,
    Dimensions,
    Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { X, Minus, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSpending } from '@/contexts/SpendingContext';
import { SpendingCategory, formatCurrency } from '@/types/spending';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface EditBudgetModalProps {
    visible: boolean;
    category: SpendingCategory | null;
    onClose: () => void;
}

export function EditBudgetModal({ visible, category, onClose }: EditBudgetModalProps) {
    const { updateCategory, getSpentInCategory } = useSpending();
    const [budget, setBudget] = useState('');

    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const backdropAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible && category) {
            setBudget(category.budget.toString());

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
    }, [visible, category]);

    const adjustBudget = (amount: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const current = parseFloat(budget) || 0;
        const newBudget = Math.max(0, current + amount);
        setBudget(newBudget.toString());
    };

    const handleSave = () => {
        if (!category) return;

        const numBudget = parseFloat(budget);
        if (isNaN(numBudget) || numBudget < 0) return;

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        updateCategory(category.id, { budget: numBudget });
        onClose();
    };

    const handleClose = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onClose();
    };

    if (!visible || !category) return null;

    const spent = getSpentInCategory(category.id);
    const budgetNum = parseFloat(budget) || 0;
    const remaining = budgetNum - spent;

    const PRESETS = [100, 250, 500, 1000];

    return (
        <View style={StyleSheet.absoluteFill}>
            <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
                <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
            </Animated.View>

            <Animated.View
                style={[
                    styles.modalContainer,
                    { transform: [{ translateY: slideAnim }] },
                ]}
            >
                <BlurView intensity={80} tint="systemChromeMaterialLight" style={styles.modal}>
                    {/* Handle bar */}
                    <View style={styles.handleBar} />

                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.categoryInfo}>
                            <View style={[styles.emojiContainer, { backgroundColor: `${category.color}15` }]}>
                                <Text style={styles.emoji}>{category.emoji}</Text>
                            </View>
                            <View>
                                <Text style={styles.categoryName}>{category.name}</Text>
                                <Text style={styles.categorySubtitle}>Edit budget</Text>
                            </View>
                        </View>
                        <Pressable
                            onPress={handleClose}
                            hitSlop={12}
                            style={({ pressed }) => [
                                styles.closeButton,
                                pressed && styles.closeButtonPressed
                            ]}
                        >
                            <X size={15} color="#3C3C43" strokeWidth={2.5} />
                        </Pressable>
                    </View>

                    {/* Budget Input */}
                    <View style={styles.budgetSection}>
                        <View style={styles.budgetRow}>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.adjustButton,
                                    pressed && styles.adjustButtonPressed
                                ]}
                                onPress={() => adjustBudget(-50)}
                            >
                                <Minus size={20} color="#3C3C43" strokeWidth={2} />
                            </Pressable>

                            <View style={styles.budgetInputContainer}>
                                <Text style={styles.currencySymbol}>$</Text>
                                <TextInput
                                    style={styles.budgetInput}
                                    value={budget}
                                    onChangeText={setBudget}
                                    keyboardType="decimal-pad"
                                    selectTextOnFocus
                                />
                            </View>

                            <Pressable
                                style={({ pressed }) => [
                                    styles.adjustButton,
                                    pressed && styles.adjustButtonPressed
                                ]}
                                onPress={() => adjustBudget(50)}
                            >
                                <Plus size={20} color="#3C3C43" strokeWidth={2} />
                            </Pressable>
                        </View>

                        {/* Quick presets */}
                        <View style={styles.presets}>
                            {PRESETS.map((preset) => (
                                <Pressable
                                    key={preset}
                                    style={({ pressed }) => [
                                        styles.presetButton,
                                        budgetNum === preset && styles.presetButtonActive,
                                        pressed && styles.presetButtonPressed
                                    ]}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setBudget(preset.toString());
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.presetText,
                                            budgetNum === preset && styles.presetTextActive,
                                        ]}
                                    >
                                        {formatCurrency(preset)}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    {/* Stats */}
                    <View style={styles.stats}>
                        <View style={styles.stat}>
                            <Text style={styles.statLabel}>Spent</Text>
                            <Text style={styles.statValue}>{formatCurrency(spent)}</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.stat}>
                            <Text style={styles.statLabel}>Left</Text>
                            <Text style={[
                                styles.statValue,
                                remaining < 0 && styles.statValueNegative,
                                remaining > 0 && styles.statValuePositive,
                            ]}>
                                {formatCurrency(Math.abs(remaining))}
                            </Text>
                        </View>
                    </View>

                    {/* Save button */}
                    <Pressable
                        style={({ pressed }) => [
                            styles.saveButton,
                            { backgroundColor: category.color },
                            pressed && styles.saveButtonPressed
                        ]}
                        onPress={handleSave}
                    >
                        <Text style={styles.saveText}>Save</Text>
                    </Pressable>
                </BlurView>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.25)',
    },
    modalContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    modal: {
        borderTopLeftRadius: 14,
        borderTopRightRadius: 14,
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        overflow: 'hidden',
    },
    handleBar: {
        width: 36,
        height: 5,
        backgroundColor: 'rgba(60, 60, 67, 0.3)',
        borderRadius: 2.5,
        alignSelf: 'center',
        marginTop: 6,
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
        gap: 12,
    },
    emojiContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emoji: {
        fontSize: 22,
    },
    categoryName: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000',
        letterSpacing: -0.4,
    },
    categorySubtitle: {
        fontSize: 13,
        color: 'rgba(60, 60, 67, 0.6)',
        marginTop: 1,
        letterSpacing: -0.1,
    },
    closeButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(120, 120, 128, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButtonPressed: {
        backgroundColor: 'rgba(120, 120, 128, 0.2)',
    },
    budgetSection: {
        marginBottom: 20,
    },
    budgetRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        marginBottom: 16,
    },
    adjustButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(120, 120, 128, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    adjustButtonPressed: {
        backgroundColor: 'rgba(120, 120, 128, 0.2)',
        transform: [{ scale: 0.96 }],
    },
    budgetInputContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'center',
    },
    currencySymbol: {
        fontSize: 28,
        fontWeight: '400',
        color: 'rgba(60, 60, 67, 0.6)',
        marginRight: 2,
    },
    budgetInput: {
        fontSize: 48,
        fontWeight: '700',
        color: '#000',
        textAlign: 'center',
        letterSpacing: -1.5,
        minWidth: 80,
    },
    presets: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    presetButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 100,
        backgroundColor: 'rgba(120, 120, 128, 0.12)',
    },
    presetButtonActive: {
        backgroundColor: '#000',
    },
    presetButtonPressed: {
        opacity: 0.7,
    },
    presetText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#000',
        letterSpacing: -0.2,
    },
    presetTextActive: {
        color: '#fff',
    },
    stats: {
        flexDirection: 'row',
        backgroundColor: 'rgba(120, 120, 128, 0.08)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    stat: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: StyleSheet.hairlineWidth,
        backgroundColor: 'rgba(60, 60, 67, 0.2)',
    },
    statLabel: {
        fontSize: 13,
        color: 'rgba(60, 60, 67, 0.6)',
        marginBottom: 4,
        letterSpacing: -0.1,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000',
        letterSpacing: -0.4,
    },
    statValueNegative: {
        color: '#FF3B30',
    },
    statValuePositive: {
        color: '#34C759',
    },
    saveButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
    },
    saveButtonPressed: {
        opacity: 0.85,
        transform: [{ scale: 0.98 }],
    },
    saveText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#fff',
        letterSpacing: -0.4,
    },
});
