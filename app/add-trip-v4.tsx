/**
 * V4 — "Boarding Pass"
 * The form IS the card. Styled like an airline ticket.
 * Torn-edge dividers, barcode-style accent, inline editable fields.
 * Fun, memorable, and on-theme with travel.
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
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Plane, Bookmark } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTravel } from '@/contexts/TravelContext';
import { VariantPicker } from '@/components/VariantPicker';

const { width: SCREEN_W } = Dimensions.get('window');

export default function AddTripV4() {
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
        <VariantPicker group="add-trip" current={4} />
        <SafeAreaView style={s.container} edges={['top']}>
            <KeyboardAvoidingView
                style={s.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* Header */}
                <View style={s.header}>
                    <Pressable
                        style={s.closeBtn}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.back();
                        }}
                        hitSlop={10}
                    >
                        <X size={20} color="#000" strokeWidth={2} />
                    </Pressable>
                    <Text style={s.headerTitle}>
                        {isEditing ? 'Edit Trip' : 'New Trip'}
                    </Text>
                    <Pressable
                        style={[s.saveBtn, !isValid && s.saveBtnDisabled]}
                        onPress={handleSave}
                        disabled={!isValid}
                    >
                        <Text style={[s.saveBtnText, !isValid && s.saveBtnTextDisabled]}>
                            {isEditing ? 'Save' : 'Done'}
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
                    {/* ── Boarding pass card ── */}
                    <View style={s.ticket}>
                        {/* Top section — Trip info */}
                        <View style={s.ticketTop}>
                            <View style={s.ticketHeader}>
                                <Plane size={16} color="#007AFF" strokeWidth={2} />
                                <Text style={s.ticketBrand}>BOARDING PASS</Text>
                            </View>

                            {/* Trip name — editable */}
                            <TextInput
                                style={s.ticketName}
                                placeholder="Trip Name"
                                placeholderTextColor="#D1D1D6"
                                value={name}
                                onChangeText={setName}
                                autoFocus
                                maxLength={50}
                            />

                            {/* Destination row */}
                            <View style={s.routeRow}>
                                <View style={s.routePoint}>
                                    <Text style={s.routeCode}>FROM</Text>
                                    <Text style={s.routeCity}>Home</Text>
                                </View>
                                <View style={s.routeLine}>
                                    <View style={s.routeDash} />
                                    <Plane size={14} color="#007AFF" strokeWidth={2} />
                                    <View style={s.routeDash} />
                                </View>
                                <View style={[s.routePoint, { alignItems: 'flex-end' }]}>
                                    <Text style={s.routeCode}>TO</Text>
                                    <TextInput
                                        style={[s.routeCity, s.routeCityInput]}
                                        placeholder="Destination"
                                        placeholderTextColor="#D1D1D6"
                                        value={destination}
                                        onChangeText={setDestination}
                                        maxLength={50}
                                        textAlign="right"
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Tear line */}
                        <View style={s.tearLine}>
                            <View style={[s.tearCircle, s.tearLeft]} />
                            <View style={s.tearDashes} />
                            <View style={[s.tearCircle, s.tearRight]} />
                        </View>

                        {/* Bottom section — Dates */}
                        <View style={s.ticketBottom}>
                            <View style={s.dateCol}>
                                <Text style={s.dateCode}>DEPART</Text>
                                <TextInput
                                    style={s.dateValue}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor="#D1D1D6"
                                    value={startDate}
                                    onChangeText={setStartDate}
                                    maxLength={10}
                                />
                            </View>
                            <View style={s.dateColDivider} />
                            <View style={s.dateCol}>
                                <Text style={s.dateCode}>RETURN</Text>
                                <TextInput
                                    style={s.dateValue}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor="#D1D1D6"
                                    value={endDate}
                                    onChangeText={setEndDate}
                                    maxLength={10}
                                />
                            </View>
                        </View>

                        {/* Barcode accent */}
                        <View style={s.barcodeRow}>
                            {Array.from({ length: 32 }).map((_, i) => (
                                <View
                                    key={i}
                                    style={[
                                        s.barcodeLine,
                                        { width: i % 3 === 0 ? 3 : 1.5, opacity: i % 5 === 0 ? 0.15 : 0.08 },
                                    ]}
                                />
                            ))}
                        </View>
                    </View>

                    {/* Templates */}
                    {!isEditing && templates.length > 0 && (
                        <View style={s.templateSection}>
                            <Text style={s.templateLabel}>Packing Template</Text>
                            <View style={s.templateGrid}>
                                {templates.map(t => {
                                    const selected = selectedTemplateId === t.id;
                                    return (
                                        <Pressable
                                            key={t.id}
                                            style={[
                                                s.templateCard,
                                                selected && s.templateCardSelected,
                                            ]}
                                            onPress={() => {
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                setSelectedTemplateId(selected ? null : t.id);
                                            }}
                                        >
                                            <Bookmark
                                                size={16}
                                                color={selected ? '#007AFF' : '#8E8E93'}
                                                strokeWidth={2}
                                            />
                                            <Text style={[
                                                s.templateName,
                                                selected && s.templateNameSelected,
                                            ]} numberOfLines={1}>{t.name}</Text>
                                            <Text style={s.templateCount}>{t.items.length} items</Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
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
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    closeBtn: {
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
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000',
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

    scroll: {
        paddingHorizontal: 20,
        paddingTop: 24,
    },

    // ── Ticket ──
    ticket: {
        backgroundColor: '#fff',
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
        elevation: 6,
    },

    ticketTop: {
        padding: 24,
    },
    ticketHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 20,
    },
    ticketBrand: {
        fontSize: 11,
        fontWeight: '700',
        color: '#007AFF',
        letterSpacing: 2,
    },
    ticketName: {
        fontSize: 26,
        fontWeight: '700',
        color: '#000',
        letterSpacing: -0.5,
        marginBottom: 24,
        paddingVertical: 0,
    },

    // Route
    routeRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    routePoint: {
        flex: 1,
    },
    routeCode: {
        fontSize: 10,
        fontWeight: '700',
        color: '#8E8E93',
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    routeCity: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        letterSpacing: -0.3,
    },
    routeCityInput: {
        paddingVertical: 0,
        minWidth: 80,
    },
    routeLine: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingBottom: 4,
        marginHorizontal: 8,
    },
    routeDash: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E5EA',
    },

    // Tear line
    tearLine: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 0,
    },
    tearCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#F2F2F7',
    },
    tearLeft: {
        marginLeft: -10,
    },
    tearRight: {
        marginRight: -10,
    },
    tearDashes: {
        flex: 1,
        height: 1,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },

    // Bottom
    ticketBottom: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 20,
    },
    dateCol: {
        flex: 1,
    },
    dateColDivider: {
        width: 1,
        backgroundColor: '#F2F2F7',
        marginHorizontal: 16,
    },
    dateCode: {
        fontSize: 10,
        fontWeight: '700',
        color: '#8E8E93',
        letterSpacing: 1.5,
        marginBottom: 6,
    },
    dateValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        paddingVertical: 0,
    },

    // Barcode
    barcodeRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 2,
        paddingVertical: 16,
        paddingHorizontal: 24,
    },
    barcodeLine: {
        height: 28,
        backgroundColor: '#000',
        borderRadius: 0.5,
    },

    // Templates
    templateSection: {
        marginTop: 32,
    },
    templateLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
    },
    templateGrid: {
        gap: 10,
    },
    templateCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#fff',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 2,
        borderColor: 'transparent',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    templateCardSelected: {
        borderColor: '#007AFF',
        backgroundColor: '#F0F7FF',
    },
    templateName: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
    },
    templateNameSelected: {
        color: '#007AFF',
    },
    templateCount: {
        fontSize: 13,
        color: '#8E8E93',
    },
});
