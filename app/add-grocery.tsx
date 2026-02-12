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
import { ArrowLeft } from 'lucide-react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useGroceries } from '@/contexts/GroceryContext';
import { GroceryIcon } from '@/components/GroceryIcon';
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

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
            <View style={styles.header}>
                <Pressable onPress={handleClose} style={styles.iconBtn}>
                    <ArrowLeft size={24} color="#000" />
                </Pressable>
                <Text style={styles.headerTitle}>
                    {isEditing ? 'Edit Item' : 'Add Item'}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Card */}
                <LinearGradient
                    colors={['#E0F2F1', '#B2DFDB']}
                    style={styles.heroCard}
                >
                    <View style={styles.mainEmojiContainer}>
                        <GroceryIcon
                            name={name || undefined}
                            category={category}
                            size={48}
                            color="#004D40"
                        />
                    </View>
                    <TextInput
                        style={styles.heroInput}
                        placeholder="Name..."
                        placeholderTextColor="rgba(0,0,0,0.3)"
                        value={name}
                        onChangeText={setName}
                        textAlign="center"
                        autoFocus
                        maxLength={50}
                    />
                </LinearGradient>

                {/* Category */}
                <View style={styles.pickerSection}>
                    <Text style={styles.sectionTitle}>Category</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoryScroll}
                    >
                        {CATEGORIES.map(([cat, config]) => {
                            const active = category === cat;
                            return (
                                <Pressable
                                    key={cat}
                                    style={[
                                        styles.categoryChip,
                                        active && styles.categoryChipActive,
                                    ]}
                                    onPress={() => handleCategorySelect(cat)}
                                >
                                    <MaterialCommunityIcons
                                        name={config.icon as any}
                                        size={16}
                                        color={active ? '#fff' : '#888'}
                                    />
                                    <Text style={[
                                        styles.categoryChipText,
                                        active && styles.categoryChipTextActive,
                                    ]}>
                                        {config.label}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Details */}
                <View style={styles.pickerSection}>
                    <Text style={styles.sectionTitle}>Details</Text>
                    <View style={styles.detailRow}>
                        <View style={styles.detailCard}>
                            <Text style={styles.detailLabel}>Quantity</Text>
                            <TextInput
                                style={styles.detailInput}
                                placeholder="e.g. 2 lbs"
                                placeholderTextColor="#C7C7CC"
                                value={quantity}
                                onChangeText={setQuantity}
                                maxLength={20}
                            />
                        </View>
                        <View style={styles.detailCard}>
                            <Text style={styles.detailLabel}>Brand</Text>
                            <TextInput
                                style={styles.detailInput}
                                placeholder="Optional"
                                placeholderTextColor="#C7C7CC"
                                value={brand}
                                onChangeText={setBrand}
                                maxLength={30}
                            />
                        </View>
                    </View>
                </View>

                {/* Notes */}
                <View style={styles.pickerSection}>
                    <Text style={styles.sectionTitle}>Notes</Text>
                    <View style={styles.notesCard}>
                        <TextInput
                            style={styles.notesInput}
                            placeholder="e.g. Get the organic one"
                            placeholderTextColor="#C7C7CC"
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                            maxLength={100}
                        />
                    </View>
                </View>

                {/* Frequency */}
                <View style={styles.pickerSection}>
                    <Text style={styles.sectionTitle}>How Often?</Text>
                    <View style={styles.tagContainer}>
                        {FREQUENCIES.map(([freq, config]) => {
                            const active = frequency === freq;
                            return (
                                <Pressable
                                    key={freq}
                                    style={[
                                        styles.tag,
                                        active && styles.tagActive,
                                    ]}
                                    onPress={() => handleFrequencySelect(freq)}
                                >
                                    <Text style={[styles.tagText, active && styles.tagTextActive]}>
                                        {config.label}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                {/* Options */}
                <View style={styles.pickerSection}>
                    <Text style={styles.sectionTitle}>Options</Text>
                    <View style={styles.toggleCard}>
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
                    {!isEditing && (
                        <View style={[styles.toggleCard, { marginTop: 10 }]}>
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
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
            </KeyboardAvoidingView>

            <View style={styles.footer}>
                <Pressable
                    style={styles.bigButton}
                    onPress={handleSave}
                >
                    <Text style={styles.bigButtonText}>
                        {isEditing ? 'Save' : 'Done'}
                    </Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        height: 56,
    },
    iconBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    content: {
        padding: 20,
        gap: 32,
    },
    heroCard: {
        borderRadius: 32,
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
        height: 240,
    },
    mainEmojiContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.6)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    heroInput: {
        fontSize: 28,
        fontWeight: '800',
        color: '#004D40',
        width: '100%',
    },
    pickerSection: {
        gap: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
        marginLeft: 4,
    },
    categoryScroll: {
        gap: 10,
        paddingVertical: 4,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 24,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#eee',
        gap: 6,
    },
    categoryChipActive: {
        backgroundColor: '#004D40',
        borderColor: '#004D40',
    },
    categoryChipText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
    },
    categoryChipTextActive: {
        color: '#fff',
    },
    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    tag: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#eee',
    },
    tagActive: {
        backgroundColor: '#004D40',
        borderColor: '#004D40',
    },
    tagText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#555',
    },
    tagTextActive: {
        color: '#fff',
    },
    detailRow: {
        flexDirection: 'row',
        gap: 12,
    },
    detailCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
    },
    detailLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#999',
        marginBottom: 8,
    },
    detailInput: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000',
    },
    notesCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
    },
    notesInput: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000',
        minHeight: 80,
        textAlignVertical: 'top',
    },
    toggleCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
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
    footer: {
        padding: 20,
    },
    bigButton: {
        backgroundColor: '#FF7043',
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#FF7043',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
    },
    bigButtonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});
