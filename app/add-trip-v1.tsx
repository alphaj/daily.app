/**
 * V1 — "Conversational Stepper"
 * One question at a time. Progress dots. Big friendly typography.
 * Inspired by Airbnb/Booking creation flows.
 * Never overwhelming — each step is a single decision.
 */
import React, { useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    LayoutAnimation,
    UIManager,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, ArrowRight, ArrowLeft, MapPin, Calendar, Bookmark } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTravel } from '@/contexts/TravelContext';
import { VariantPicker } from '@/components/VariantPicker';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_W } = Dimensions.get('window');

const animate = () =>
    LayoutAnimation.configureNext(
        LayoutAnimation.create(300, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity)
    );

export default function AddTripV1() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id?: string }>();
    const { trips, templates, addTrip, updateTrip, createTripFromTemplate } = useTravel();

    const existingTrip = id ? trips.find(t => t.id === id) : null;
    const isEditing = !!existingTrip;

    const [step, setStep] = useState(0);
    const [name, setName] = useState(existingTrip?.name || '');
    const [destination, setDestination] = useState(existingTrip?.destination || '');
    const [startDate, setStartDate] = useState(existingTrip?.startDate || '');
    const [endDate, setEndDate] = useState(existingTrip?.endDate || '');
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

    const nameRef = useRef<TextInput>(null);
    const destRef = useRef<TextInput>(null);

    const STEPS = [
        { key: 'name', label: "What's this trip called?", sub: 'Give it a name you\'ll remember' },
        { key: 'destination', label: 'Where are you headed?', sub: 'Skip if you\'re not sure yet' },
        { key: 'dates', label: 'When are you going?', sub: 'You can always change this later' },
        ...(templates.length > 0 && !isEditing
            ? [{ key: 'template', label: 'Start from a template?', sub: 'Pre-fill your packing list' }]
            : []),
    ];

    const totalSteps = STEPS.length;
    const currentStep = STEPS[step];
    const canGoNext = step === 0 ? name.trim().length > 0 : true;
    const isLastStep = step === totalSteps - 1;

    const goNext = useCallback(() => {
        if (isLastStep) {
            handleSave();
            return;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        animate();
        setStep(s => Math.min(s + 1, totalSteps - 1));
    }, [step, totalSteps, isLastStep]);

    const goBack = useCallback(() => {
        if (step === 0) {
            router.back();
            return;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        animate();
        setStep(s => s - 1);
    }, [step, router]);

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
        <VariantPicker group="add-trip" current={1} />
        <SafeAreaView style={s.container} edges={['top', 'bottom']}>
            <KeyboardAvoidingView
                style={s.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* Top bar */}
                <View style={s.topBar}>
                    <Pressable onPress={goBack} hitSlop={12} style={s.navBtn}>
                        {step === 0 ? (
                            <X size={20} color="#000" strokeWidth={2} />
                        ) : (
                            <ArrowLeft size={20} color="#000" strokeWidth={2} />
                        )}
                    </Pressable>

                    {/* Progress dots */}
                    <View style={s.dots}>
                        {STEPS.map((_, i) => (
                            <View
                                key={i}
                                style={[
                                    s.dot,
                                    i <= step && s.dotActive,
                                    i === step && s.dotCurrent,
                                ]}
                            />
                        ))}
                    </View>

                    {/* Skip (for optional steps) */}
                    {step > 0 && !isLastStep ? (
                        <Pressable onPress={goNext} hitSlop={12}>
                            <Text style={s.skipText}>Skip</Text>
                        </Pressable>
                    ) : (
                        <View style={{ width: 40 }} />
                    )}
                </View>

                {/* Content */}
                <View style={s.body}>
                    <Text style={s.question}>{currentStep?.label}</Text>
                    <Text style={s.subtext}>{currentStep?.sub}</Text>

                    <View style={s.inputArea}>
                        {currentStep?.key === 'name' && (
                            <View style={s.inputCard}>
                                <Text style={s.inputEmoji}>✈️</Text>
                                <TextInput
                                    ref={nameRef}
                                    style={s.bigInput}
                                    placeholder="Summer in Italy..."
                                    placeholderTextColor="#C7C7CC"
                                    value={name}
                                    onChangeText={setName}
                                    autoFocus
                                    maxLength={50}
                                    returnKeyType="next"
                                    onSubmitEditing={goNext}
                                />
                            </View>
                        )}

                        {currentStep?.key === 'destination' && (
                            <View style={s.inputCard}>
                                <MapPin size={24} color="#007AFF" strokeWidth={1.5} />
                                <TextInput
                                    ref={destRef}
                                    style={s.bigInput}
                                    placeholder="Rome, Barcelona, Tokyo..."
                                    placeholderTextColor="#C7C7CC"
                                    value={destination}
                                    onChangeText={setDestination}
                                    autoFocus
                                    maxLength={50}
                                    returnKeyType="next"
                                    onSubmitEditing={goNext}
                                />
                            </View>
                        )}

                        {currentStep?.key === 'dates' && (
                            <View style={s.dateCards}>
                                <View style={s.dateCard}>
                                    <Calendar size={18} color="#007AFF" strokeWidth={1.5} />
                                    <Text style={s.dateLabel}>From</Text>
                                    <TextInput
                                        style={s.dateInput}
                                        placeholder="YYYY-MM-DD"
                                        placeholderTextColor="#C7C7CC"
                                        value={startDate}
                                        onChangeText={setStartDate}
                                        autoFocus
                                        maxLength={10}
                                    />
                                </View>
                                <View style={s.dateDivider} />
                                <View style={s.dateCard}>
                                    <Calendar size={18} color="#FF9500" strokeWidth={1.5} />
                                    <Text style={s.dateLabel}>To</Text>
                                    <TextInput
                                        style={s.dateInput}
                                        placeholder="YYYY-MM-DD"
                                        placeholderTextColor="#C7C7CC"
                                        value={endDate}
                                        onChangeText={setEndDate}
                                        maxLength={10}
                                    />
                                </View>
                            </View>
                        )}

                        {currentStep?.key === 'template' && (
                            <View style={s.templateGrid}>
                                <Pressable
                                    style={[
                                        s.templateOption,
                                        !selectedTemplateId && s.templateOptionSelected,
                                    ]}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setSelectedTemplateId(null);
                                    }}
                                >
                                    <Text style={s.templateEmoji}>📝</Text>
                                    <Text style={[
                                        s.templateName,
                                        !selectedTemplateId && s.templateNameSelected,
                                    ]}>Start fresh</Text>
                                    <Text style={s.templateCount}>Empty list</Text>
                                </Pressable>
                                {templates.map(t => (
                                    <Pressable
                                        key={t.id}
                                        style={[
                                            s.templateOption,
                                            selectedTemplateId === t.id && s.templateOptionSelected,
                                        ]}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            setSelectedTemplateId(t.id);
                                        }}
                                    >
                                        <Bookmark
                                            size={20}
                                            color={selectedTemplateId === t.id ? '#007AFF' : '#8E8E93'}
                                            strokeWidth={2}
                                        />
                                        <Text style={[
                                            s.templateName,
                                            selectedTemplateId === t.id && s.templateNameSelected,
                                        ]} numberOfLines={1}>{t.name}</Text>
                                        <Text style={s.templateCount}>{t.items.length} items</Text>
                                    </Pressable>
                                ))}
                            </View>
                        )}
                    </View>
                </View>

                {/* Bottom CTA */}
                <View style={s.bottom}>
                    <Pressable
                        style={[s.cta, !canGoNext && s.ctaDisabled]}
                        onPress={goNext}
                        disabled={!canGoNext}
                    >
                        <Text style={[s.ctaText, !canGoNext && s.ctaTextDisabled]}>
                            {isLastStep ? 'Create Trip' : 'Continue'}
                        </Text>
                        {!isLastStep && canGoNext && (
                            <ArrowRight size={18} color="#fff" strokeWidth={2.5} />
                        )}
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

    // Top bar
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    navBtn: {
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
    dots: {
        flexDirection: 'row',
        gap: 6,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E5E5EA',
    },
    dotActive: {
        backgroundColor: '#007AFF',
    },
    dotCurrent: {
        width: 24,
        borderRadius: 4,
    },
    skipText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#8E8E93',
    },

    // Body
    body: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 40,
    },
    question: {
        fontSize: 28,
        fontWeight: '700',
        color: '#000',
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    subtext: {
        fontSize: 16,
        color: '#8E8E93',
        marginBottom: 36,
    },
    inputArea: {
        flex: 1,
    },

    // Input card
    inputCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 6,
        gap: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },
    inputEmoji: {
        fontSize: 28,
    },
    bigInput: {
        flex: 1,
        fontSize: 20,
        fontWeight: '500',
        color: '#000',
        paddingVertical: 16,
        letterSpacing: -0.3,
    },

    // Date cards
    dateCards: {
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },
    dateCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
    },
    dateLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#8E8E93',
        width: 40,
    },
    dateInput: {
        flex: 1,
        fontSize: 17,
        fontWeight: '500',
        color: '#000',
    },
    dateDivider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#E5E5EA',
        marginLeft: 48,
    },

    // Templates
    templateGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    templateOption: {
        width: (SCREEN_W - 60) / 2,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        gap: 8,
        borderWidth: 2,
        borderColor: 'transparent',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 1,
    },
    templateOptionSelected: {
        borderColor: '#007AFF',
        backgroundColor: '#F0F7FF',
    },
    templateEmoji: {
        fontSize: 24,
    },
    templateName: {
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

    // Bottom CTA
    bottom: {
        paddingHorizontal: 24,
        paddingBottom: 12,
    },
    cta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000',
        borderRadius: 16,
        paddingVertical: 18,
        gap: 8,
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
