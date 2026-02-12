/**
 * V5 — "Compact Sheet"
 * Everything on one screen, no scrolling needed.
 * Name is the hero with large inline text. All fields are compact.
 * Chip-style date/destination. Templates as small avatars.
 * Inspired by Apple Freeform "new board" / Linear issue creation.
 */
import React, { useState, useCallback } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, MapPin, Calendar, Bookmark, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTravel } from '@/contexts/TravelContext';
import { VariantPicker } from '@/components/VariantPicker';

export default function AddTripV5() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id?: string }>();
    const { trips, templates, addTrip, updateTrip, createTripFromTemplate } = useTravel();

    const existingTrip = id ? trips.find(t => t.id === id) : null;
    const isEditing = !!existingTrip;

    const [name, setName] = useState(existingTrip?.name || '');
    const [destination, setDestination] = useState(existingTrip?.destination || '');
    const [startDate, setStartDate] = useState(existingTrip?.startDate || '');
    const [endDate, setEndDate] = useState(existingTrip?.endDate || '');
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

    const isValid = name.trim().length > 0;

    const handleSave = useCallback(async () => {
        if (!name.trim()) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        if (isEditing && existingTrip) {
            await updateTrip(existingTrip.id, {
                name: name.trim(),
                destination: destination.trim() || undefined,
                startDate: startDate.trim() || undefined,
                endDate: endDate.trim() || undefined,
            });
        } else if (selectedTemplateId) {
            await createTripFromTemplate(selectedTemplateId, name.trim(), {
                destination: destination.trim() || undefined,
                startDate: startDate.trim() || undefined,
                endDate: endDate.trim() || undefined,
            });
        } else {
            await addTrip(name.trim(), {
                destination: destination.trim() || undefined,
                startDate: startDate.trim() || undefined,
                endDate: endDate.trim() || undefined,
            });
        }
        router.back();
    }, [name, destination, startDate, endDate, isEditing, existingTrip, selectedTemplateId]);

    return (
        <View style={{flex: 1}}>
        <VariantPicker group="add-trip" current={5} />
        <SafeAreaView style={s.container} edges={['top', 'bottom']}>
            <KeyboardAvoidingView
                style={s.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* Top row */}
                <View style={s.topRow}>
                    <Pressable
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.back();
                        }}
                        hitSlop={12}
                    >
                        <Text style={s.cancelText}>Cancel</Text>
                    </Pressable>
                    <Text style={s.topTitle}>
                        {isEditing ? 'Edit Trip' : 'New Trip'}
                    </Text>
                    <Pressable
                        onPress={handleSave}
                        disabled={!isValid}
                        hitSlop={12}
                    >
                        <Text style={[s.doneText, !isValid && s.doneTextDisabled]}>
                            {isEditing ? 'Save' : 'Add'}
                        </Text>
                    </Pressable>
                </View>

                <ScrollView
                    style={s.flex}
                    contentContainerStyle={s.body}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="interactive"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Hero name area */}
                    <View style={s.heroArea}>
                        <View style={s.emojiCircle}>
                            <Text style={s.emoji}>✈️</Text>
                        </View>
                        <TextInput
                            style={s.heroInput}
                            placeholder="Trip name"
                            placeholderTextColor="#C7C7CC"
                            value={name}
                            onChangeText={setName}
                            autoFocus
                            maxLength={50}
                            textAlign="center"
                            returnKeyType="done"
                        />
                    </View>

                    {/* Metadata pills */}
                    <View style={s.pillsRow}>
                        <View style={s.pill}>
                            <MapPin size={14} color="#8E8E93" strokeWidth={2} />
                            <TextInput
                                style={s.pillInput}
                                placeholder="Destination"
                                placeholderTextColor="#C7C7CC"
                                value={destination}
                                onChangeText={setDestination}
                                maxLength={50}
                            />
                        </View>
                    </View>

                    <View style={s.pillsRow}>
                        <View style={s.pill}>
                            <Calendar size={14} color="#007AFF" strokeWidth={2} />
                            <TextInput
                                style={s.pillInput}
                                placeholder="Start"
                                placeholderTextColor="#C7C7CC"
                                value={startDate}
                                onChangeText={setStartDate}
                                maxLength={10}
                            />
                        </View>
                        <Text style={s.pillDivider}>—</Text>
                        <View style={s.pill}>
                            <Calendar size={14} color="#FF9500" strokeWidth={2} />
                            <TextInput
                                style={s.pillInput}
                                placeholder="End"
                                placeholderTextColor="#C7C7CC"
                                value={endDate}
                                onChangeText={setEndDate}
                                maxLength={10}
                            />
                        </View>
                    </View>

                    {/* Templates */}
                    {!isEditing && templates.length > 0 && (
                        <View style={s.templateArea}>
                            <View style={s.templateHeader}>
                                <Sparkles size={14} color="#8E8E93" strokeWidth={2} />
                                <Text style={s.templateLabel}>Templates</Text>
                            </View>
                            <View style={s.templateList}>
                                {templates.map(t => {
                                    const selected = selectedTemplateId === t.id;
                                    return (
                                        <Pressable
                                            key={t.id}
                                            style={[
                                                s.templateChip,
                                                selected && s.templateChipSelected,
                                            ]}
                                            onPress={() => {
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                setSelectedTemplateId(selected ? null : t.id);
                                                if (!selected && !name.trim()) setName(t.name);
                                            }}
                                        >
                                            <Bookmark
                                                size={13}
                                                color={selected ? '#fff' : '#8E8E93'}
                                                strokeWidth={2}
                                            />
                                            <Text
                                                style={[
                                                    s.templateChipText,
                                                    selected && s.templateChipTextSelected,
                                                ]}
                                                numberOfLines={1}
                                            >{t.name}</Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </View>
                    )}

                    {/* Helper text */}
                    <Text style={s.helperText}>
                        You can add packing items and more details after creating.
                    </Text>
                </ScrollView>

                {/* Big bottom button */}
                <View style={s.bottomArea}>
                    <Pressable
                        style={[s.bigBtn, !isValid && s.bigBtnDisabled]}
                        onPress={handleSave}
                        disabled={!isValid}
                    >
                        <Text style={[s.bigBtnText, !isValid && s.bigBtnTextDisabled]}>
                            {isEditing ? 'Save Trip' : 'Create Trip'}
                        </Text>
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
        </View>
    );
}

const s = StyleSheet.create({
    flex: { flex: 1 },
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },

    // Top row
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#F2F2F7',
    },
    cancelText: {
        fontSize: 17,
        color: '#8E8E93',
        fontWeight: '400',
    },
    topTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000',
    },
    doneText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#007AFF',
    },
    doneTextDisabled: {
        color: '#C7C7CC',
    },

    // Body
    body: {
        paddingHorizontal: 24,
        paddingTop: 32,
        alignItems: 'center',
    },

    // Hero
    heroArea: {
        alignItems: 'center',
        marginBottom: 28,
    },
    emojiCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emoji: {
        fontSize: 32,
    },
    heroInput: {
        fontSize: 24,
        fontWeight: '700',
        color: '#000',
        letterSpacing: -0.5,
        width: '100%',
        paddingVertical: 4,
    },

    // Pills
    pillsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
        width: '100%',
    },
    pill: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#F8F8FA',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    pillInput: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        color: '#000',
        paddingVertical: 0,
    },
    pillDivider: {
        fontSize: 16,
        color: '#C7C7CC',
    },

    // Templates
    templateArea: {
        width: '100%',
        marginTop: 16,
    },
    templateHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
    },
    templateLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    templateList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    templateChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F2F2F7',
        borderRadius: 100,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    templateChipSelected: {
        backgroundColor: '#007AFF',
    },
    templateChipText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#000',
    },
    templateChipTextSelected: {
        color: '#fff',
    },

    // Helper
    helperText: {
        fontSize: 14,
        color: '#AEAEB2',
        textAlign: 'center',
        marginTop: 32,
        lineHeight: 20,
    },

    // Bottom
    bottomArea: {
        paddingHorizontal: 24,
        paddingBottom: 12,
    },
    bigBtn: {
        backgroundColor: '#000',
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
    },
    bigBtnDisabled: {
        backgroundColor: '#E5E5EA',
    },
    bigBtnText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#fff',
    },
    bigBtnTextDisabled: {
        color: '#8E8E93',
    },
});
