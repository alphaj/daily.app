import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    Pressable,
    ScrollView,
} from 'react-native';
import { Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import type { PackingCategory } from '@/types/travel';
import { PACKING_CATEGORY_CONFIG } from '@/types/travel';

const CATEGORIES = Object.entries(PACKING_CATEGORY_CONFIG) as [PackingCategory, typeof PACKING_CATEGORY_CONFIG[PackingCategory]][];

interface PackingQuickAddProps {
    onAddItem: (name: string, category: PackingCategory) => void;
}

export function PackingQuickAdd({ onAddItem }: PackingQuickAddProps) {
    const [text, setText] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<PackingCategory>('clothes');
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<TextInput>(null);

    const handleSubmit = useCallback(() => {
        const trimmed = text.trim();
        if (!trimmed) return;

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onAddItem(trimmed, selectedCategory);
        setText('');
    }, [text, selectedCategory, onAddItem]);

    const handleCategorySelect = useCallback((cat: PackingCategory) => {
        Haptics.selectionAsync();
        setSelectedCategory(cat);
    }, []);

    return (
        <View style={styles.container}>
            {/* Category pills */}
            {isFocused && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryContent}
                    style={styles.categoryRow}
                    keyboardShouldPersistTaps="always"
                >
                    {CATEGORIES.map(([cat, config]) => (
                        <Pressable
                            key={cat}
                            style={[
                                styles.categoryChip,
                                selectedCategory === cat && { backgroundColor: config.color + '18', borderColor: config.color },
                            ]}
                            onPress={() => handleCategorySelect(cat)}
                        >
                            <Text style={[
                                styles.categoryText,
                                selectedCategory === cat && { color: config.color, fontWeight: '600' },
                            ]}>
                                {config.label}
                            </Text>
                        </Pressable>
                    ))}
                </ScrollView>
            )}

            {/* Input row */}
            <View style={styles.addRow}>
                <View style={[
                    styles.plusCircle,
                    isFocused && styles.plusCircleActive,
                ]}>
                    <Plus
                        size={14}
                        color={isFocused ? '#fff' : '#C7C7CC'}
                        strokeWidth={2.5}
                    />
                </View>

                <TextInput
                    ref={inputRef}
                    style={styles.input}
                    placeholder="Add an item..."
                    placeholderTextColor="#C7C7CC"
                    value={text}
                    onChangeText={setText}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onSubmitEditing={handleSubmit}
                    returnKeyType="done"
                    blurOnSubmit={false}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {},
    categoryRow: {
        marginBottom: 8,
        maxHeight: 36,
    },
    categoryContent: {
        paddingHorizontal: 4,
        gap: 6,
    },
    categoryChip: {
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: 'transparent',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
    },
    categoryText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#8E8E93',
    },
    addRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 13,
        paddingHorizontal: 16,
        gap: 12,
        minHeight: 48,
        borderRadius: 12,
    },
    plusCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#D1D1D6',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    plusCircleActive: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
        borderStyle: 'solid',
    },
    input: {
        flex: 1,
        fontSize: 17,
        color: '#000',
        paddingVertical: 0,
        lineHeight: 22,
        fontWeight: '400',
    },
});
