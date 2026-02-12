/**
 * V3 — "Quick Start"
 * Minimal: single input + smart preset chips.
 * One tap on a chip fills name + destination + selects template.
 * Advanced options (dates, destination) tucked behind "More details".
 * Inspired by Things 3 quick add / Todoist.
 */
import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    LayoutAnimation,
    UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
    ChevronLeft,
    Plane,
    Briefcase,
    Palmtree,
    Mountain,
    ChevronDown,
    ChevronUp,
    MapPin,
    Calendar,
    Bookmark,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTravel } from '@/contexts/TravelContext';
import { VariantPicker } from '@/components/VariantPicker';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const animate = () =>
    LayoutAnimation.configureNext(
        LayoutAnimation.create(250, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity)
    );

const PRESETS = [
    { emoji: '🏖️', label: 'Beach Trip', icon: Palmtree, color: '#34C759' },
    { emoji: '🏔️', label: 'Mountain Trip', icon: Mountain, color: '#5856D6' },
    { emoji: '💼', label: 'Work Travel', icon: Briefcase, color: '#FF9500' },
    { emoji: '✈️', label: 'Weekend Away', icon: Plane, color: '#007AFF' },
];

export default function AddTripV3() {
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
    const [showMore, setShowMore] = useState(isEditing);
    const [activePreset, setActivePreset] = useState<number | null>(null);

    const isValid = name.trim().length > 0;

    const handlePreset = (idx: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (activePreset === idx) {
            setActivePreset(null);
            setName('');
            return;
        }
        setActivePreset(idx);
        setName(PRESETS[idx].label);
    };

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
        <VariantPicker group="add-trip" current={3} />
        <SafeAreaView style={s.container} edges={['top']}>
            <KeyboardAvoidingView
                style={s.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* Header */}
                <View style={s.header}>
                    <Pressable
                        style={s.backBtn}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.back();
                        }}
                        hitSlop={8}
                    >
                        <ChevronLeft size={22} color="#000" strokeWidth={2} />
                    </Pressable>
                    <Pressable
                        style={[s.saveBtn, !isValid && s.saveBtnDisabled]}
                        onPress={handleSave}
                        disabled={!isValid}
                    >
                        <Text style={[s.saveBtnText, !isValid && s.saveBtnTextDisabled]}>
                            {isEditing ? 'Save' : 'Create'}
                        </Text>
                    </Pressable>
                </View>

                <ScrollView
                    style={s.flex}
                    contentContainerStyle={s.scroll}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="interactive"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Title */}
                    <Text style={s.pageTitle}>
                        {isEditing ? 'Edit trip' : 'Plan a trip'}
                    </Text>

                    {/* Big name input */}
                    <View style={s.nameCard}>
                        <TextInput
                            style={s.nameInput}
                            placeholder="Trip name..."
                            placeholderTextColor="#C7C7CC"
                            value={name}
                            onChangeText={(text) => {
                                setName(text);
                                setActivePreset(null);
                            }}
                            autoFocus
                            maxLength={50}
                        />
                    </View>

                    {/* Quick presets */}
                    {!isEditing && (
                        <>
                            <Text style={s.quickLabel}>Quick start</Text>
                            <View style={s.presetRow}>
                                {PRESETS.map((p, i) => {
                                    const active = activePreset === i;
                                    return (
                                        <Pressable
                                            key={p.label}
                                            style={[
                                                s.presetChip,
                                                active && { backgroundColor: p.color, borderColor: p.color },
                                            ]}
                                            onPress={() => handlePreset(i)}
                                        >
                                            <Text style={s.presetEmoji}>{p.emoji}</Text>
                                            <Text style={[
                                                s.presetLabel,
                                                active && s.presetLabelActive,
                                            ]}>{p.label}</Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </>
                    )}

                    {/* More details toggle */}
                    <Pressable
                        style={s.moreToggle}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            animate();
                            setShowMore(!showMore);
                        }}
                    >
                        <Text style={s.moreToggleText}>More details</Text>
                        {showMore ? (
                            <ChevronUp size={16} color="#8E8E93" />
                        ) : (
                            <ChevronDown size={16} color="#8E8E93" />
                        )}
                    </Pressable>

                    {showMore && (
                        <View style={s.moreSection}>
                            {/* Destination */}
                            <View style={s.fieldRow}>
                                <MapPin size={18} color="#8E8E93" strokeWidth={1.5} />
                                <TextInput
                                    style={s.fieldInput}
                                    placeholder="Destination"
                                    placeholderTextColor="#C7C7CC"
                                    value={destination}
                                    onChangeText={setDestination}
                                    maxLength={50}
                                />
                            </View>

                            <View style={s.fieldSep} />

                            {/* Start date */}
                            <View style={s.fieldRow}>
                                <Calendar size={18} color="#8E8E93" strokeWidth={1.5} />
                                <TextInput
                                    style={s.fieldInput}
                                    placeholder="Start date (YYYY-MM-DD)"
                                    placeholderTextColor="#C7C7CC"
                                    value={startDate}
                                    onChangeText={setStartDate}
                                    maxLength={10}
                                />
                            </View>

                            <View style={s.fieldSep} />

                            {/* End date */}
                            <View style={s.fieldRow}>
                                <Calendar size={18} color="#8E8E93" strokeWidth={1.5} />
                                <TextInput
                                    style={s.fieldInput}
                                    placeholder="End date (YYYY-MM-DD)"
                                    placeholderTextColor="#C7C7CC"
                                    value={endDate}
                                    onChangeText={setEndDate}
                                    maxLength={10}
                                />
                            </View>

                            {/* Template selector */}
                            {!isEditing && templates.length > 0 && (
                                <>
                                    <View style={s.fieldSep} />
                                    <View style={s.templateSection}>
                                        <View style={s.fieldRow}>
                                            <Bookmark size={18} color="#8E8E93" strokeWidth={1.5} />
                                            <Text style={s.templateTitle}>Packing template</Text>
                                        </View>
                                        <ScrollView
                                            horizontal
                                            showsHorizontalScrollIndicator={false}
                                            contentContainerStyle={s.templateScroll}
                                        >
                                            {templates.map(t => {
                                                const selected = selectedTemplateId === t.id;
                                                return (
                                                    <Pressable
                                                        key={t.id}
                                                        style={[
                                                            s.templateChip,
                                                            selected && s.templateChipActive,
                                                        ]}
                                                        onPress={() => {
                                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                            setSelectedTemplateId(selected ? null : t.id);
                                                        }}
                                                    >
                                                        <Text style={[
                                                            s.templateChipText,
                                                            selected && s.templateChipTextActive,
                                                        ]} numberOfLines={1}>{t.name}</Text>
                                                        <Text style={[
                                                            s.templateChipCount,
                                                            selected && s.templateChipCountActive,
                                                        ]}>{t.items.length}</Text>
                                                    </Pressable>
                                                );
                                            })}
                                        </ScrollView>
                                    </View>
                                </>
                            )}
                        </View>
                    )}

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
        </View>
    );
}

const s = StyleSheet.create({
    flex: { flex: 1 },
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    saveBtn: {
        paddingHorizontal: 18,
        paddingVertical: 8,
        backgroundColor: '#000',
        borderRadius: 100,
    },
    saveBtnDisabled: {
        backgroundColor: '#E5E5EA',
    },
    saveBtnText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
    saveBtnTextDisabled: {
        color: '#8E8E93',
    },

    // Content
    scroll: {
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    pageTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#000',
        letterSpacing: -0.8,
        marginBottom: 20,
    },

    // Name input
    nameCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingHorizontal: 18,
        paddingVertical: 6,
        marginBottom: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },
    nameInput: {
        fontSize: 22,
        fontWeight: '600',
        color: '#000',
        paddingVertical: 16,
        letterSpacing: -0.3,
    },

    // Presets
    quickLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
    },
    presetRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 24,
    },
    presetChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#fff',
        borderRadius: 100,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderWidth: 1.5,
        borderColor: '#E5E5EA',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    presetEmoji: {
        fontSize: 16,
    },
    presetLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
    },
    presetLabelActive: {
        color: '#fff',
    },

    // More details
    moreToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        marginBottom: 4,
    },
    moreToggleText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#8E8E93',
    },

    moreSection: {
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    fieldRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    fieldInput: {
        flex: 1,
        fontSize: 16,
        color: '#000',
        fontWeight: '400',
    },
    fieldSep: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#E5E5EA',
        marginLeft: 48,
    },

    // Templates
    templateSection: {
        paddingBottom: 14,
    },
    templateTitle: {
        fontSize: 16,
        color: '#000',
        fontWeight: '400',
    },
    templateScroll: {
        paddingHorizontal: 16,
        gap: 8,
    },
    templateChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F5F5F7',
        borderRadius: 100,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    templateChipActive: {
        backgroundColor: '#007AFF',
    },
    templateChipText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#000',
    },
    templateChipTextActive: {
        color: '#fff',
    },
    templateChipCount: {
        fontSize: 12,
        fontWeight: '600',
        color: '#8E8E93',
        backgroundColor: '#E5E5EA',
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 1,
        overflow: 'hidden',
    },
    templateChipCountActive: {
        color: '#007AFF',
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
});
