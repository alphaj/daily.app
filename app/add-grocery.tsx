import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useGroceries } from '@/contexts/GroceryContext';
import {
    CATEGORY_CONFIG,
    FREQUENCY_CONFIG,
    type GroceryCategory,
    type ReplenishFrequency,
} from '@/types/grocery';

const CATEGORIES = Object.entries(CATEGORY_CONFIG) as [GroceryCategory, typeof CATEGORY_CONFIG[GroceryCategory]][];
const FREQUENCIES = Object.entries(FREQUENCY_CONFIG) as [ReplenishFrequency, typeof FREQUENCY_CONFIG[ReplenishFrequency]][];

export default function AddGroceryScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id?: string }>();
    const { groceries, addItem, updateItem, autoCategorizeName } = useGroceries();

    const existingItem = id ? groceries.find(g => g.id === id) : null;
    const isEditing = !!existingItem;

    const [name, setName] = useState(existingItem?.name || '');
    const [category, setCategory] = useState<GroceryCategory>(existingItem?.category || 'pantry');
    const [quantity, setQuantity] = useState(existingItem?.quantity || '');
    const [brand, setBrand] = useState(existingItem?.brand || '');
    const [notes, setNotes] = useState(existingItem?.notes || '');
    const [frequency, setFrequency] = useState<ReplenishFrequency>(existingItem?.frequency || 'as_needed');
    const [isStaple, setIsStaple] = useState(existingItem?.isStaple || false);
    const [addToListNow, setAddToListNow] = useState(!isEditing);

    // Auto-categorize as user types
    useEffect(() => {
        if (!isEditing && name.length >= 3) {
            const suggestedCategory = autoCategorizeName(name);
            if (suggestedCategory !== category) {
                setCategory(suggestedCategory);
            }
        }
    }, [name, isEditing, autoCategorizeName]);

    const handleClose = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    }, [router]);

    const handleSave = useCallback(async () => {
        if (!name.trim()) return;

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        if (isEditing && existingItem) {
            await updateItem(existingItem.id, {
                name: name.trim(),
                category,
                quantity: quantity.trim() || undefined,
                brand: brand.trim() || undefined,
                notes: notes.trim() || undefined,
                frequency,
                isStaple,
            });
        } else {
            await addItem(name.trim(), {
                category,
                quantity: quantity.trim() || undefined,
                brand: brand.trim() || undefined,
                notes: notes.trim() || undefined,
                frequency,
                isStaple,
                addToListNow,
            });
        }

        router.back();
    }, [
        name, category, quantity, brand, notes, frequency, isStaple,
        addToListNow, isEditing, existingItem, addItem, updateItem, router
    ]);

    const handleCategorySelect = (cat: GroceryCategory) => {
        Haptics.selectionAsync();
        setCategory(cat);
    };

    const handleFrequencySelect = (freq: ReplenishFrequency) => {
        Haptics.selectionAsync();
        setFrequency(freq);
        if (freq !== 'one_time' && freq !== 'as_needed') {
            setIsStaple(true);
        }
    };

    const isValid = name.trim().length > 0;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Pressable style={styles.closeButton} onPress={handleClose} hitSlop={10}>
                        <ChevronLeft size={24} color="#000" strokeWidth={1.5} />
                    </Pressable>
                    <Text style={styles.headerTitle}>
                        {isEditing ? 'Edit Item' : 'Add Item'}
                    </Text>
                    <Pressable
                        style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}
                        onPress={handleSave}
                        disabled={!isValid}
                    >
                        <Text style={[styles.saveButtonText, !isValid && styles.saveButtonTextDisabled]}>
                            {isEditing ? 'Save' : 'Add'}
                        </Text>
                    </Pressable>
                </View>

                <ScrollView
                    style={styles.content}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Preview Card */}
                    <View style={styles.previewCard}>
                        <View style={[styles.previewAccent, { backgroundColor: CATEGORY_CONFIG[category].color }]} />
                        <View style={styles.previewContent}>
                            <View style={[styles.previewEmojiContainer, { backgroundColor: CATEGORY_CONFIG[category].color + '15' }]}>
                                <Text style={styles.previewEmoji}>{CATEGORY_CONFIG[category].emoji}</Text>
                            </View>
                            <Text style={styles.previewName} numberOfLines={1}>
                                {name || 'Item Name'}
                            </Text>
                            <Text style={styles.previewMeta}>
                                {CATEGORY_CONFIG[category].label}
                                {quantity ? ` • ${quantity}` : ''}
                            </Text>
                        </View>
                    </View>

                    {/* Name Input */}
                    <View style={styles.inputSection}>
                        <Text style={styles.inputLabel}>Item Name</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="What do you need?"
                            placeholderTextColor="#C7C7CC"
                            value={name}
                            onChangeText={setName}
                            autoFocus
                            maxLength={50}
                        />
                    </View>

                    {/* Category Picker */}
                    <View style={styles.inputSection}>
                        <Text style={styles.inputLabel}>Category</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.categoryScroll}
                        >
                            {CATEGORIES.map(([cat, config]) => (
                                <Pressable
                                    key={cat}
                                    style={[
                                        styles.categoryChip,
                                        category === cat && styles.categoryChipSelected,
                                        category === cat && { borderColor: config.color },
                                    ]}
                                    onPress={() => handleCategorySelect(cat)}
                                >
                                    <Text style={styles.categoryChipEmoji}>{config.emoji}</Text>
                                    <Text style={[
                                        styles.categoryChipText,
                                        category === cat && styles.categoryChipTextSelected,
                                    ]}>
                                        {config.label}
                                    </Text>
                                </Pressable>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Quantity & Brand Row */}
                    <View style={styles.rowInputs}>
                        <View style={[styles.inputSection, { flex: 1 }]}>
                            <Text style={styles.inputLabel}>Quantity</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="e.g. 2 lbs"
                                placeholderTextColor="#C7C7CC"
                                value={quantity}
                                onChangeText={setQuantity}
                                maxLength={20}
                            />
                        </View>
                        <View style={[styles.inputSection, { flex: 1 }]}>
                            <Text style={styles.inputLabel}>Brand</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Optional"
                                placeholderTextColor="#C7C7CC"
                                value={brand}
                                onChangeText={setBrand}
                                maxLength={30}
                            />
                        </View>
                    </View>

                    {/* Notes */}
                    <View style={styles.inputSection}>
                        <Text style={styles.inputLabel}>Notes</Text>
                        <TextInput
                            style={[styles.textInput, styles.textInputMultiline]}
                            placeholder="e.g. Get the organic one"
                            placeholderTextColor="#C7C7CC"
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                            maxLength={100}
                        />
                    </View>

                    {/* Frequency */}
                    <View style={styles.inputSection}>
                        <Text style={styles.inputLabel}>How Often?</Text>
                        <View style={styles.frequencyGrid}>
                            {FREQUENCIES.map(([freq, config]) => (
                                <Pressable
                                    key={freq}
                                    style={[
                                        styles.frequencyOption,
                                        frequency === freq && styles.frequencyOptionSelected,
                                    ]}
                                    onPress={() => handleFrequencySelect(freq)}
                                >
                                    <Text style={[
                                        styles.frequencyText,
                                        frequency === freq && styles.frequencyTextSelected,
                                    ]}>
                                        {config.label}
                                    </Text>
                                    {frequency === freq && (
                                        <Check size={14} color="#007AFF" strokeWidth={3} />
                                    )}
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    {/* Staple Toggle */}
                    <View style={styles.toggleSection}>
                        <View style={styles.toggleRow}>
                            <View>
                                <Text style={styles.toggleLabel}>Pantry Staple</Text>
                                <Text style={styles.toggleHint}>Track for regular restocking</Text>
                            </View>
                            <Switch
                                value={isStaple}
                                onValueChange={(value) => {
                                    Haptics.selectionAsync();
                                    setIsStaple(value);
                                }}
                                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                                thumbColor="#fff"
                            />
                        </View>
                    </View>

                    {/* Add to List Now Toggle (only for new items) */}
                    {!isEditing && (
                        <View style={styles.toggleSection}>
                            <View style={styles.toggleRow}>
                                <View>
                                    <Text style={styles.toggleLabel}>Add to Shopping List</Text>
                                    <Text style={styles.toggleHint}>Include in current trip</Text>
                                </View>
                                <Switch
                                    value={addToListNow}
                                    onValueChange={(value) => {
                                        Haptics.selectionAsync();
                                        setAddToListNow(value);
                                    }}
                                    trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                                    thumbColor="#fff"
                                />
                            </View>
                        </View>
                    )}

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    keyboardView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    closeButton: {
        padding: 4,
        backgroundColor: '#fff',
        borderRadius: 20,
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000',
    },
    saveButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#000',
        borderRadius: 100,
    },
    saveButtonDisabled: {
        backgroundColor: '#E5E5EA',
    },
    saveButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
    saveButtonTextDisabled: {
        color: '#8E8E93',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    previewCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 4,
    },
    previewAccent: {
        height: 4,
    },
    previewContent: {
        alignItems: 'center',
        padding: 24,
    },
    previewEmojiContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    previewEmoji: {
        fontSize: 28,
    },
    previewName: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000',
        marginBottom: 4,
    },
    previewMeta: {
        fontSize: 14,
        color: '#8E8E93',
    },
    inputSection: {
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 10,
    },
    textInput: {
        fontSize: 17,
        color: '#000',
        backgroundColor: '#fff',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    textInputMultiline: {
        minHeight: 80,
        textAlignVertical: 'top',
        paddingTop: 14,
    },
    rowInputs: {
        flexDirection: 'row',
        gap: 12,
    },
    categoryScroll: {
        paddingVertical: 4,
        gap: 8,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        gap: 6,
        borderWidth: 2,
        borderColor: 'transparent',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
    },
    categoryChipSelected: {
        backgroundColor: '#fff',
    },
    categoryChipEmoji: {
        fontSize: 16,
    },
    categoryChipText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#8E8E93',
    },
    categoryChipTextSelected: {
        color: '#000',
        fontWeight: '600',
    },
    frequencyGrid: {
        backgroundColor: '#fff',
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
    },
    frequencyOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E5E5EA',
    },
    frequencyOptionSelected: {
        backgroundColor: '#007AFF08',
    },
    frequencyText: {
        fontSize: 16,
        color: '#000',
    },
    frequencyTextSelected: {
        fontWeight: '600',
        color: '#007AFF',
    },
    toggleSection: {
        backgroundColor: '#fff',
        borderRadius: 14,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    toggleLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000',
        marginBottom: 2,
    },
    toggleHint: {
        fontSize: 13,
        color: '#8E8E93',
    },
});
