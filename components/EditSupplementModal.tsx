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
    KeyboardAvoidingView,
    ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { X, ChevronDown, ChevronUp } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSupplements } from '@/contexts/SupplementContext';
import type { Supplement } from '@/types/supplement';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Supplement-focused emojis
const QUICK_EMOJIS = ['💊', '💉', '🩹', '🧴', '🥛', '🧪', '🌿', '⚗️'];

const ALL_EMOJIS = [
    '💊', '💉', '🩹', '🧴', '🥛', '🧪', '🌿', '⚗️',
    '🍵', '🫖', '🧃', '🥤', '🌸', '🌻', '🍃', '🪴',
    '🐟', '🥚', '🥜', '🫘', '🍯', '🧈', '🥕', '🥦',
    '🏃', '💪', '🧘', '🛌', '☀️', '🌙', '⚡', '✨',
    '❤️', '🧠', '👁️', '🦴', '🩺', '🏥', '💚', '💛',
];

const TIME_OPTIONS: { label: string; value: Supplement['timeOfDay'] | undefined }[] = [
    { label: 'Any time', value: undefined },
    { label: 'Morning', value: 'morning' },
    { label: 'Afternoon', value: 'afternoon' },
    { label: 'Evening', value: 'evening' },
    { label: 'With food', value: 'with_food' },
];

const FREQUENCY_OPTIONS: { label: string; value: Supplement['frequency'] }[] = [
    { label: 'Daily', value: 'daily' },
    { label: 'Twice daily', value: 'twice_daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'As needed', value: 'as_needed' },
];

interface EditSupplementModalProps {
    visible: boolean;
    supplement: Supplement | null;
    onClose: () => void;
}

export function EditSupplementModal({ visible, supplement, onClose }: EditSupplementModalProps) {
    const { updateSupplement } = useSupplements();

    const [name, setName] = useState('');
    const [selectedEmoji, setSelectedEmoji] = useState<string>('💊');
    const [showAllEmojis, setShowAllEmojis] = useState(false);
    const [dosage, setDosage] = useState('');
    const [frequency, setFrequency] = useState<Supplement['frequency']>('daily');
    const [timeOfDay, setTimeOfDay] = useState<Supplement['timeOfDay'] | undefined>(undefined);
    const [notes, setNotes] = useState('');

    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const backdropAnim = useRef(new Animated.Value(0)).current;

    // Load supplement data when modal opens
    useEffect(() => {
        if (visible && supplement) {
            setName(supplement.name);
            setSelectedEmoji(supplement.emoji || '💊');
            setDosage(supplement.dosage || '');
            setFrequency(supplement.frequency);
            setTimeOfDay(supplement.timeOfDay);
            setNotes(supplement.notes || '');
            setShowAllEmojis(false);

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
    }, [visible, supplement]);

    const handleSave = async () => {
        if (name.trim() && supplement) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await updateSupplement(supplement.id, {
                name: name.trim(),
                emoji: selectedEmoji,
                dosage: dosage.trim() || undefined,
                frequency,
                timeOfDay,
                notes: notes.trim() || undefined,
            });
            onClose();
        }
    };

    const handleClose = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onClose();
    };

    const selectEmoji = (emoji: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedEmoji(emoji);
    };

    const toggleEmojiPicker = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setShowAllEmojis(!showAllEmojis);
    };

    if (!visible || !supplement) return null;

    const isValid = name.trim().length > 0;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
                <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
            </Animated.View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoid}
                pointerEvents="box-none"
            >
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
                            <View style={styles.headerInfo}>
                                <View style={styles.emojiHeaderContainer}>
                                    <Text style={styles.emojiHeader}>{selectedEmoji}</Text>
                                </View>
                                <View>
                                    <Text style={styles.headerTitle}>Edit Supplement</Text>
                                    <Text style={styles.headerSubtitle}>{supplement.name}</Text>
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

                        <ScrollView
                            style={styles.scrollView}
                            contentContainerStyle={styles.scrollContent}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            {/* Name Input */}
                            <View style={styles.formSection}>
                                <Text style={styles.sectionLabel}>Name</Text>
                                <TextInput
                                    style={styles.formInput}
                                    placeholder="Supplement name"
                                    placeholderTextColor="rgba(60, 60, 67, 0.3)"
                                    value={name}
                                    onChangeText={setName}
                                    returnKeyType="next"
                                />
                            </View>

                            {/* Emoji Picker */}
                            <View style={styles.formSection}>
                                <Text style={styles.sectionLabel}>Icon</Text>
                                <View style={styles.emojiSection}>
                                    {!showAllEmojis ? (
                                        <View style={styles.emojiRow}>
                                            {QUICK_EMOJIS.map((emoji) => (
                                                <Pressable
                                                    key={emoji}
                                                    style={({ pressed }) => [
                                                        styles.emojiButton,
                                                        selectedEmoji === emoji && styles.emojiButtonSelected,
                                                        pressed && styles.emojiButtonPressed,
                                                    ]}
                                                    onPress={() => selectEmoji(emoji)}
                                                >
                                                    <Text style={styles.emojiText}>{emoji}</Text>
                                                </Pressable>
                                            ))}
                                        </View>
                                    ) : (
                                        <View style={styles.allEmojisGrid}>
                                            {ALL_EMOJIS.map((emoji, index) => (
                                                <Pressable
                                                    key={`${emoji}-${index}`}
                                                    style={({ pressed }) => [
                                                        styles.emojiButtonSmall,
                                                        selectedEmoji === emoji && styles.emojiButtonSelected,
                                                        pressed && styles.emojiButtonPressed,
                                                    ]}
                                                    onPress={() => selectEmoji(emoji)}
                                                >
                                                    <Text style={styles.emojiTextSmall}>{emoji}</Text>
                                                </Pressable>
                                            ))}
                                        </View>
                                    )}

                                    <Pressable
                                        style={({ pressed }) => [
                                            styles.moreButton,
                                            pressed && { opacity: 0.7 }
                                        ]}
                                        onPress={toggleEmojiPicker}
                                    >
                                        <Text style={styles.moreButtonText}>
                                            {showAllEmojis ? 'Show less' : 'More icons'}
                                        </Text>
                                        {showAllEmojis ? (
                                            <ChevronUp size={14} color="#5856D6" />
                                        ) : (
                                            <ChevronDown size={14} color="#5856D6" />
                                        )}
                                    </Pressable>
                                </View>
                            </View>

                            {/* Dosage */}
                            <View style={styles.formSection}>
                                <Text style={styles.sectionLabel}>Dosage (optional)</Text>
                                <TextInput
                                    style={styles.formInput}
                                    placeholder="e.g., 500mg, 2 capsules"
                                    placeholderTextColor="rgba(60, 60, 67, 0.3)"
                                    value={dosage}
                                    onChangeText={setDosage}
                                />
                            </View>

                            {/* Frequency */}
                            <View style={styles.formSection}>
                                <Text style={styles.sectionLabel}>How often?</Text>
                                <View style={styles.optionRow}>
                                    {FREQUENCY_OPTIONS.map((option) => (
                                        <Pressable
                                            key={option.value}
                                            style={({ pressed }) => [
                                                styles.optionButton,
                                                frequency === option.value && styles.optionButtonActive,
                                                pressed && styles.optionButtonPressed,
                                            ]}
                                            onPress={() => {
                                                Haptics.selectionAsync();
                                                setFrequency(option.value);
                                            }}
                                        >
                                            <Text
                                                style={[
                                                    styles.optionText,
                                                    frequency === option.value && styles.optionTextActive,
                                                ]}
                                            >
                                                {option.label}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>

                            {/* Time of Day */}
                            <View style={styles.formSection}>
                                <Text style={styles.sectionLabel}>When to take?</Text>
                                <View style={styles.optionRow}>
                                    {TIME_OPTIONS.map((option) => (
                                        <Pressable
                                            key={option.label}
                                            style={({ pressed }) => [
                                                styles.optionButton,
                                                timeOfDay === option.value && styles.optionButtonActive,
                                                pressed && styles.optionButtonPressed,
                                            ]}
                                            onPress={() => {
                                                Haptics.selectionAsync();
                                                setTimeOfDay(option.value);
                                            }}
                                        >
                                            <Text
                                                style={[
                                                    styles.optionText,
                                                    timeOfDay === option.value && styles.optionTextActive,
                                                ]}
                                            >
                                                {option.label}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>

                            {/* Notes */}
                            <View style={styles.formSection}>
                                <Text style={styles.sectionLabel}>Notes (optional)</Text>
                                <TextInput
                                    style={[styles.formInput, styles.notesInput]}
                                    placeholder="Any instructions or reminders..."
                                    placeholderTextColor="rgba(60, 60, 67, 0.3)"
                                    value={notes}
                                    onChangeText={setNotes}
                                    multiline
                                    maxLength={200}
                                />
                            </View>
                        </ScrollView>

                        {/* Save button */}
                        <Pressable
                            style={({ pressed }) => [
                                styles.saveButton,
                                !isValid && styles.saveButtonDisabled,
                                pressed && isValid && styles.saveButtonPressed
                            ]}
                            onPress={handleSave}
                            disabled={!isValid}
                        >
                            <Text style={styles.saveText}>Save Changes</Text>
                        </Pressable>
                    </BlurView>
                </Animated.View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.25)',
    },
    keyboardAvoid: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        maxHeight: SCREEN_HEIGHT * 0.85,
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
        marginBottom: 20,
    },
    headerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    emojiHeaderContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#E8F5E9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emojiHeader: {
        fontSize: 22,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000',
        letterSpacing: -0.4,
    },
    headerSubtitle: {
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
    scrollView: {
        maxHeight: SCREEN_HEIGHT * 0.5,
    },
    scrollContent: {
        gap: 16,
        paddingBottom: 16,
    },
    formSection: {
        gap: 8,
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: 'rgba(60, 60, 67, 0.6)',
        letterSpacing: -0.1,
        marginLeft: 4,
    },
    formInput: {
        fontSize: 16,
        color: '#000',
        backgroundColor: 'rgba(120, 120, 128, 0.08)',
        borderRadius: 10,
        padding: 14,
        minHeight: 48,
    },
    notesInput: {
        minHeight: 72,
        textAlignVertical: 'top',
    },
    emojiSection: {
        alignItems: 'center',
        gap: 12,
        backgroundColor: 'rgba(120, 120, 128, 0.08)',
        borderRadius: 10,
        padding: 14,
    },
    emojiRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        flexWrap: 'wrap',
    },
    emojiButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(120, 120, 128, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emojiButtonSmall: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(120, 120, 128, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emojiButtonSelected: {
        backgroundColor: '#4CAF50',
    },
    emojiButtonPressed: {
        opacity: 0.7,
        transform: [{ scale: 0.95 }],
    },
    emojiText: {
        fontSize: 20,
    },
    emojiTextSmall: {
        fontSize: 18,
    },
    moreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    moreButtonText: {
        fontSize: 14,
        color: '#5856D6',
        fontWeight: '500',
        letterSpacing: -0.2,
    },
    allEmojisGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
    },
    optionRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    optionButton: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 100,
        backgroundColor: 'rgba(120, 120, 128, 0.12)',
    },
    optionButtonActive: {
        backgroundColor: '#4CAF50',
    },
    optionButtonPressed: {
        opacity: 0.7,
    },
    optionText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#000',
        letterSpacing: -0.2,
    },
    optionTextActive: {
        color: '#fff',
    },
    saveButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        backgroundColor: '#4CAF50',
        marginTop: 8,
    },
    saveButtonDisabled: {
        opacity: 0.35,
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
