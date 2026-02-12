/**
 * V2 — "Immersive Hero"
 * Full-width gradient hero with inline editing.
 * Trip name is the headline, destination the subtitle.
 * Details grouped below in a tight settings-style card.
 * Inspired by Apple Music playlist creation / Notion cover pages.
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, MapPin, Calendar, ChevronRight, Bookmark } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTravel } from '@/contexts/TravelContext';
import { VariantPicker } from '@/components/VariantPicker';

export default function AddTripV2() {
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

    // Pick gradient based on destination length for variety
    const gradients: [string, string, string][] = [
        ['#667EEA', '#764BA2', '#A855F7'],
        ['#F093FB', '#F5576C', '#FF6B6B'],
        ['#4FACFE', '#00F2FE', '#43E97B'],
        ['#FA709A', '#FEE140', '#F7971E'],
        ['#A18CD1', '#FBC2EB', '#F6D5F7'],
    ];
    const gradientIdx = destination.length % gradients.length;

    return (
        <View style={{flex: 1}}>
        <VariantPicker group="add-trip" current={2} />
        <SafeAreaView style={s.container} edges={['top']}>
            <KeyboardAvoidingView
                style={s.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    style={s.flex}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="interactive"
                >
                    {/* Hero */}
                    <LinearGradient
                        colors={gradients[gradientIdx]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={s.hero}
                    >
                        {/* Floating close button */}
                        <View style={s.heroTopBar}>
                            <Pressable
                                style={s.closeBtn}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    router.back();
                                }}
                                hitSlop={10}
                            >
                                <X size={18} color="#fff" strokeWidth={2.5} />
                            </Pressable>
                        </View>

                        <View style={s.heroContent}>
                            <Text style={s.heroEmoji}>✈️</Text>
                            <TextInput
                                style={s.heroNameInput}
                                placeholder="Trip name"
                                placeholderTextColor="rgba(255,255,255,0.5)"
                                value={name}
                                onChangeText={setName}
                                autoFocus
                                maxLength={50}
                                textAlign="center"
                            />
                            <View style={s.heroDestRow}>
                                <MapPin size={14} color="rgba(255,255,255,0.7)" strokeWidth={2} />
                                <TextInput
                                    style={s.heroDestInput}
                                    placeholder="Add destination"
                                    placeholderTextColor="rgba(255,255,255,0.45)"
                                    value={destination}
                                    onChangeText={setDestination}
                                    maxLength={50}
                                    textAlign="center"
                                />
                            </View>
                        </View>
                    </LinearGradient>

                    {/* Details card */}
                    <View style={s.detailsSection}>
                        <View style={s.card}>
                            {/* Dates */}
                            <View style={s.row}>
                                <View style={s.rowLeft}>
                                    <View style={[s.rowIcon, { backgroundColor: '#007AFF' }]}>
                                        <Calendar size={14} color="#fff" strokeWidth={2.5} />
                                    </View>
                                    <Text style={s.rowLabel}>Start</Text>
                                </View>
                                <TextInput
                                    style={s.rowInput}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor="#C7C7CC"
                                    value={startDate}
                                    onChangeText={setStartDate}
                                    maxLength={10}
                                    textAlign="right"
                                />
                            </View>

                            <View style={s.sep} />

                            <View style={s.row}>
                                <View style={s.rowLeft}>
                                    <View style={[s.rowIcon, { backgroundColor: '#FF9500' }]}>
                                        <Calendar size={14} color="#fff" strokeWidth={2.5} />
                                    </View>
                                    <Text style={s.rowLabel}>End</Text>
                                </View>
                                <TextInput
                                    style={s.rowInput}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor="#C7C7CC"
                                    value={endDate}
                                    onChangeText={setEndDate}
                                    maxLength={10}
                                    textAlign="right"
                                />
                            </View>
                        </View>

                        {/* Templates */}
                        {!isEditing && templates.length > 0 && (
                            <>
                                <Text style={s.sectionLabel}>Packing Template</Text>
                                <View style={s.card}>
                                    {templates.map((t, i) => (
                                        <React.Fragment key={t.id}>
                                            {i > 0 && <View style={s.sep} />}
                                            <Pressable
                                                style={s.row}
                                                onPress={() => {
                                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                    setSelectedTemplateId(
                                                        selectedTemplateId === t.id ? null : t.id
                                                    );
                                                }}
                                            >
                                                <View style={s.rowLeft}>
                                                    <View style={[s.rowIcon, {
                                                        backgroundColor: selectedTemplateId === t.id ? '#007AFF' : '#E5E5EA',
                                                    }]}>
                                                        <Bookmark
                                                            size={14}
                                                            color={selectedTemplateId === t.id ? '#fff' : '#8E8E93'}
                                                            strokeWidth={2.5}
                                                        />
                                                    </View>
                                                    <Text style={s.rowLabel}>{t.name}</Text>
                                                </View>
                                                <View style={s.rowRight}>
                                                    <Text style={s.rowMeta}>{t.items.length} items</Text>
                                                    {selectedTemplateId === t.id && (
                                                        <View style={s.checkDot} />
                                                    )}
                                                </View>
                                            </Pressable>
                                        </React.Fragment>
                                    ))}
                                </View>
                            </>
                        )}

                        <View style={{ height: 100 }} />
                    </View>
                </ScrollView>

                {/* Sticky bottom */}
                <View style={s.bottom}>
                    <Pressable
                        style={[s.cta, !isValid && s.ctaDisabled]}
                        onPress={handleSave}
                        disabled={!isValid}
                    >
                        <Text style={[s.ctaText, !isValid && s.ctaTextDisabled]}>
                            {isEditing ? 'Save Changes' : 'Create Trip'}
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
        backgroundColor: '#F2F2F7',
    },

    // Hero
    hero: {
        paddingTop: 8,
        paddingBottom: 40,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    heroTopBar: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        paddingHorizontal: 20,
        paddingVertical: 8,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroContent: {
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingTop: 16,
    },
    heroEmoji: {
        fontSize: 48,
        marginBottom: 16,
    },
    heroNameInput: {
        fontSize: 28,
        fontWeight: '700',
        color: '#fff',
        width: '100%',
        paddingVertical: 8,
        letterSpacing: -0.5,
    },
    heroDestRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    heroDestInput: {
        fontSize: 16,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.85)',
        paddingVertical: 4,
        minWidth: 140,
    },

    // Details
    detailsSection: {
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 10,
        marginTop: 24,
        marginLeft: 4,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        minHeight: 50,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    rowIcon: {
        width: 28,
        height: 28,
        borderRadius: 7,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rowLabel: {
        fontSize: 16,
        fontWeight: '400',
        color: '#000',
    },
    rowRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    rowInput: {
        fontSize: 16,
        color: '#000',
        fontWeight: '400',
        flex: 1,
        paddingVertical: 0,
    },
    rowMeta: {
        fontSize: 14,
        color: '#8E8E93',
    },
    checkDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#007AFF',
    },
    sep: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#E5E5EA',
        marginLeft: 56,
    },

    // Bottom
    bottom: {
        paddingHorizontal: 20,
        paddingBottom: 12,
        paddingTop: 8,
        backgroundColor: '#F2F2F7',
    },
    cta: {
        backgroundColor: '#000',
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
    },
    ctaDisabled: {
        backgroundColor: '#E5E5EA',
    },
    ctaText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#fff',
    },
    ctaTextDisabled: {
        color: '#8E8E93',
    },
});
