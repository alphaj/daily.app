import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Check } from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useSupplements } from '@/contexts/SupplementContext';
import type { Supplement } from '@/types/supplement';
import { SupplementIcon } from '@/components/SupplementIcon';

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

export default function EditSupplementScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { supplements, updateSupplement } = useSupplements();

    const supplement = supplements.find(s => s.id === id);

    const [name, setName] = useState('');
    const [dosage, setDosage] = useState('');
    const [frequency, setFrequency] = useState<Supplement['frequency']>('daily');
    const [timeOfDay, setTimeOfDay] = useState<Supplement['timeOfDay'] | undefined>(undefined);
    const [notes, setNotes] = useState('');

    // Load supplement data when component mounts
    useEffect(() => {
        if (supplement) {
            setName(supplement.name);
            setDosage(supplement.dosage || '');
            setFrequency(supplement.frequency);
            setTimeOfDay(supplement.timeOfDay);
            setNotes(supplement.notes || '');
        }
    }, [supplement]);

    const handleSave = async () => {
        if (name.trim() && id) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await updateSupplement(id, {
                name: name.trim(),
                emoji: '💊',
                dosage: dosage.trim() || undefined,
                frequency,
                timeOfDay,
                notes: notes.trim() || undefined,
            });
            router.back();
        }
    };

    const handleCancel = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    };

    const isValid = name.trim().length > 0;

    // If supplement not found, go back
    if (!supplement) {
        router.back();
        return null;
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Pressable style={styles.closeButton} onPress={handleCancel}>
                        <ChevronLeft size={24} color="#000" strokeWidth={2} />
                    </Pressable>
                    <Text style={styles.headerTitle}>Edit Supplement</Text>
                    <View style={styles.headerSpacer} />
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="interactive"
                >
                    <View style={styles.content}>
                        {/* Icon Display */}
                        <View style={styles.iconDisplay}>
                            <SupplementIcon name={name} size={40} />
                        </View>

                        {/* Name Input */}
                        <TextInput
                            style={styles.input}
                            placeholder="Supplement name"
                            placeholderTextColor="#C7C7CC"
                            value={name}
                            onChangeText={setName}
                            autoFocus={false}
                            returnKeyType="next"
                        />

                        {/* Dosage */}
                        <View style={styles.formSection}>
                            <Text style={styles.sectionLabel}>Dosage (optional)</Text>
                            <TextInput
                                style={styles.formInput}
                                placeholder="e.g., 500mg, 2 capsules"
                                placeholderTextColor="#C7C7CC"
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
                                        style={[
                                            styles.optionButton,
                                            frequency === option.value && styles.optionButtonActive,
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
                                        style={[
                                            styles.optionButton,
                                            timeOfDay === option.value && styles.optionButtonActive,
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
                                placeholderTextColor="#C7C7CC"
                                value={notes}
                                onChangeText={setNotes}
                                multiline
                                maxLength={200}
                            />
                        </View>
                    </View>
                </ScrollView>

                {/* Update Button */}
                <View style={styles.footer}>
                    <Pressable
                        style={[styles.updateButton, !isValid && styles.updateButtonDisabled]}
                        onPress={handleSave}
                        disabled={!isValid}
                    >
                        <Check size={20} color="#fff" strokeWidth={2.5} />
                        <Text style={styles.updateButtonText}>Update Supplement</Text>
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    keyboardView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    closeButton: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 18,
        backgroundColor: '#fff',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000',
    },
    headerSpacer: {
        width: 36,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 16,
        alignItems: 'center',
        gap: 24,
    },
    iconDisplay: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F5F5F7',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    input: {
        width: '100%',
        fontSize: 22,
        fontWeight: '500',
        color: '#1C1C1E',
        textAlign: 'center',
        paddingVertical: 12,
        letterSpacing: -0.3,
    },
    formSection: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
        marginBottom: 12,
        letterSpacing: -0.1,
    },
    formInput: {
        fontSize: 16,
        color: '#1C1C1E',
        backgroundColor: '#F5F5F7',
        borderRadius: 14,
        padding: 16,
        minHeight: 52,
    },
    notesInput: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    optionRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    optionButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#F5F5F7',
    },
    optionButtonActive: {
        backgroundColor: '#4CAF50',
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 2,
    },
    optionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8E8E93',
        letterSpacing: -0.2,
    },
    optionTextActive: {
        color: '#fff',
    },
    footer: {
        paddingHorizontal: 20,
        paddingBottom: 16,
        paddingTop: 12,
        backgroundColor: '#FAFAFA',
    },
    updateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#4CAF50',
        paddingVertical: 18,
        borderRadius: 16,
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 4,
    },
    updateButtonDisabled: {
        opacity: 0.35,
        shadowOpacity: 0,
    },
    updateButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#fff',
        letterSpacing: -0.2,
    },
});
