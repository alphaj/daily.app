import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    Pressable,
    ScrollView,
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { ArrowUp, SlidersHorizontal } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { GroceryIcon } from '@/components/GroceryIcon';
import type { GroceryItem } from '@/types/grocery';
import { CATEGORY_CONFIG } from '@/types/grocery';

interface GroceryQuickAddProps {
    onAddItem: (name: string) => void;
    suggestions: GroceryItem[];
    onAddSuggestion: (item: GroceryItem) => void;
    onExpandPress: () => void;
}

export function GroceryQuickAdd({
    onAddItem,
    suggestions,
    onAddSuggestion,
    onExpandPress,
}: GroceryQuickAddProps) {
    const [text, setText] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<TextInput>(null);
    const sendOpacity = useSharedValue(0);

    const sendStyle = useAnimatedStyle(() => ({
        opacity: sendOpacity.value,
        transform: [{ scale: sendOpacity.value }],
    }));

    const handleChangeText = useCallback((value: string) => {
        setText(value);
        sendOpacity.value = withTiming(value.trim().length > 0 ? 1 : 0, { duration: 150 });
    }, [sendOpacity]);

    const handleSubmit = useCallback(() => {
        const trimmed = text.trim();
        if (!trimmed) return;

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onAddItem(trimmed);
        setText('');
        sendOpacity.value = withTiming(0, { duration: 150 });
        // Keep keyboard open for rapid-fire entry
    }, [text, onAddItem, sendOpacity]);

    const handleSuggestionPress = useCallback((item: GroceryItem) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onAddSuggestion(item);
    }, [onAddSuggestion]);

    const showSuggestions = isFocused && suggestions.length > 0 && text.length === 0;

    return (
        <View style={styles.container}>
            {showSuggestions && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.suggestionsContent}
                    style={styles.suggestionsRow}
                    keyboardShouldPersistTaps="always"
                >
                    {suggestions.map(item => (
                        <Pressable
                            key={item.id}
                            style={({ pressed }) => [
                                styles.suggestionChip,
                                pressed && { opacity: 0.7 },
                            ]}
                            onPress={() => handleSuggestionPress(item)}
                        >
                            <GroceryIcon
                                name={item.name}
                                category={item.category}
                                size={13}
                                color={CATEGORY_CONFIG[item.category].color}
                            />
                            <Text style={styles.suggestionText} numberOfLines={1}>{item.name}</Text>
                        </Pressable>
                    ))}
                </ScrollView>
            )}

            <View style={styles.inputRow}>
                <View style={styles.inputCard}>
                    <TextInput
                        ref={inputRef}
                        style={styles.input}
                        placeholder="Add an item..."
                        placeholderTextColor="#8E8E93"
                        value={text}
                        onChangeText={handleChangeText}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        onSubmitEditing={handleSubmit}
                        returnKeyType="done"
                        blurOnSubmit={false}
                    />

                    <Pressable
                        style={({ pressed }) => [
                            styles.expandButton,
                            pressed && { opacity: 0.6 },
                        ]}
                        onPress={onExpandPress}
                        hitSlop={8}
                    >
                        <SlidersHorizontal size={18} color="#8E8E93" />
                    </Pressable>

                    <Animated.View style={[styles.sendButtonWrap, sendStyle]}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.sendButton,
                                pressed && { opacity: 0.8 },
                            ]}
                            onPress={handleSubmit}
                            hitSlop={8}
                        >
                            <ArrowUp size={18} color="#fff" strokeWidth={2.5} />
                        </Pressable>
                    </Animated.View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 90,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(242, 242, 247, 0.96)',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(60, 60, 67, 0.18)',
        paddingTop: 12,
        paddingBottom: 12,
    },
    suggestionsRow: {
        marginBottom: 8,
        maxHeight: 36,
    },
    suggestionsContent: {
        paddingHorizontal: 16,
        gap: 6,
    },
    suggestionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(118, 118, 128, 0.12)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 4,
    },
    suggestionText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#000',
        maxWidth: 100,
    },
    inputRow: {
        paddingHorizontal: 16,
    },
    inputCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 0,
        gap: 8,
        minHeight: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    input: {
        flex: 1,
        fontSize: 17,
        color: '#000',
        paddingVertical: 10,
        lineHeight: 22,
        fontWeight: '400',
    },
    expandButton: {
        padding: 4,
    },
    sendButtonWrap: {
        // Animated opacity/scale
    },
    sendButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#007AFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
