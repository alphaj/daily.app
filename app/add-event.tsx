import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Mic, Square } from 'lucide-react-native';
import React, { useState, useRef, useCallback } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    ScrollView,
    Modal,
    Alert,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withRepeat,
    withSequence,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { useCalendarEvents } from '@/contexts/CalendarEventContext';
import { EVENT_COLORS } from '@/types/event';
import { format, isToday, isTomorrow, parse, addDays } from 'date-fns';
import { DatePickerModal } from '@/components/DatePickerModal';

export default function AddEventScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ date?: string; startTime?: string }>();
    const { addEvent } = useCalendarEvents();

    const [title, setTitle] = useState('');
    const [selectedDate, setSelectedDate] = useState<Date>(
        params.date ? parse(params.date, 'yyyy-MM-dd', new Date()) : new Date()
    );
    const [isAllDay, setIsAllDay] = useState(!params.startTime);
    const [startTime, setStartTime] = useState(params.startTime || '09:00');
    const [endTime, setEndTime] = useState(() => {
        if (params.startTime) {
            const [hours] = params.startTime.split(':').map(Number);
            const endHour = Math.min(hours + 1, 23);
            return `${endHour.toString().padStart(2, '0')}:00`;
        }
        return '10:00';
    });
    const [selectedColor, setSelectedColor] = useState(EVENT_COLORS[4]);
    const [notes, setNotes] = useState('');

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);

    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const recordingRef = useRef<Audio.Recording | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // Reanimated pulse for voice recording
    const pulseScale = useSharedValue(1);

    const startPulse = useCallback(() => {
        pulseScale.value = withRepeat(
            withSequence(
                withSpring(1.2, { damping: 8, stiffness: 120 }),
                withSpring(1, { damping: 8, stiffness: 120 })
            ),
            -1
        );
    }, []);

    const stopPulse = useCallback(() => {
        pulseScale.value = withSpring(1, { damping: 14, stiffness: 200 });
    }, []);

    const pulseAnimStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }],
    }));

    // --- Voice recording ---
    const startRecording = async () => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            if (Platform.OS === 'web') {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mediaRecorder = new MediaRecorder(stream);
                mediaRecorderRef.current = mediaRecorder;
                audioChunksRef.current = [];

                mediaRecorder.ondataavailable = (event) => {
                    audioChunksRef.current.push(event.data);
                };

                mediaRecorder.start();
            } else {
                await Audio.requestPermissionsAsync();
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: true,
                    playsInSilentModeIOS: true,
                });

                const recording = new Audio.Recording();
                await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
                await recording.startAsync();
                recordingRef.current = recording;
            }

            setIsRecording(true);
            startPulse();
        } catch (error) {
            console.log('Error starting recording:', error);
        }
    };

    const stopRecording = async () => {
        try {
            stopPulse();
            setIsRecording(false);
            setIsTranscribing(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

            let formData = new FormData();

            if (Platform.OS === 'web') {
                const mediaRecorder = mediaRecorderRef.current;
                if (mediaRecorder) {
                    await new Promise<void>((resolve) => {
                        mediaRecorder.onstop = () => resolve();
                        mediaRecorder.stop();
                    });

                    mediaRecorder.stream.getTracks().forEach(track => track.stop());

                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    formData.append('audio', audioBlob, 'recording.webm');
                }
            } else {
                const recording = recordingRef.current;
                if (recording) {
                    await recording.stopAndUnloadAsync();
                    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

                    const uri = recording.getURI();
                    if (uri) {
                        const uriParts = uri.split('.');
                        const fileType = uriParts[uriParts.length - 1];

                        const audioFile = {
                            uri,
                            name: 'recording.' + fileType,
                            type: 'audio/' + fileType,
                        };

                        formData.append('audio', audioFile as unknown as Blob);
                    }
                }
                recordingRef.current = null;
            }

            const response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                if (data.text) {
                    setTitle(prev => prev ? `${prev} ${data.text}` : data.text);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                Alert.alert('Transcription Failed', 'Voice transcription is temporarily unavailable. Please type your event instead.');
            }
        } catch (error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('No Connection', 'Unable to transcribe voice. Please check your internet connection.');
        } finally {
            setIsTranscribing(false);
        }
    };

    const handleVoicePress = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    // --- Save ---
    const handleSave = async () => {
        if (title.trim()) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await addEvent(
                title.trim(),
                format(selectedDate, 'yyyy-MM-dd'),
                isAllDay,
                selectedColor,
                isAllDay ? undefined : startTime,
                isAllDay ? undefined : endTime,
                notes.trim() || undefined
            );
            router.back();
        }
    };

    // --- Date helpers ---
    const getDateTag = (): string => {
        if (isToday(selectedDate)) return 'Today';
        if (isTomorrow(selectedDate)) return 'Tomorrow';
        return 'Pick Date';
    };

    const getDateLabel = (): string => {
        if (isToday(selectedDate)) return 'Today';
        if (isTomorrow(selectedDate)) return 'Tomorrow';
        return format(selectedDate, 'MMM d, yyyy');
    };

    const handleDateTagPress = (tag: string) => {
        Haptics.selectionAsync();
        if (tag === 'Today') {
            setSelectedDate(new Date());
        } else if (tag === 'Tomorrow') {
            setSelectedDate(addDays(new Date(), 1));
        } else {
            setShowDatePicker(true);
        }
    };

    // --- Time helpers ---
    const timeStringToDate = (timeStr: string): Date => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(hours);
        date.setMinutes(minutes);
        return date;
    };

    const formatTimeDisplay = (timeStr: string): string => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    const handleStartTimeChange = (event: any, selectedDate?: Date) => {
        if (selectedDate) {
            const hours = selectedDate.getHours().toString().padStart(2, '0');
            const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
            setStartTime(`${hours}:${minutes}`);
        }
    };

    const handleEndTimeChange = (event: any, selectedDate?: Date) => {
        if (selectedDate) {
            const hours = selectedDate.getHours().toString().padStart(2, '0');
            const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
            setEndTime(`${hours}:${minutes}`);
        }
    };

    const confirmStartTime = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setShowStartTimePicker(false);
    };

    const confirmEndTime = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setShowEndTimePicker(false);
    };

    // Determine which "When?" tag is active
    const activeWhenTag = getDateTag();
    // If the date is neither today nor tomorrow, show the formatted date as the "Pick Date" label
    const pickDateLabel = (!isToday(selectedDate) && !isTomorrow(selectedDate))
        ? format(selectedDate, 'MMM d, yyyy')
        : 'Pick Date';

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.iconBtn}>
                        <ArrowLeft size={24} color="#000" />
                    </Pressable>
                    <Text style={styles.headerTitle}>Add Event</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="interactive"
                >
                    {/* Hero Card */}
                    <LinearGradient
                        colors={['#FFF3E0', '#FFE0B2']}
                        style={styles.heroCard}
                    >
                        <View style={styles.mainEmojiContainer}>
                            <Text style={{ fontSize: 48 }}>📅</Text>
                        </View>
                        <TextInput
                            style={styles.heroInput}
                            placeholder="Event name..."
                            placeholderTextColor="rgba(0,0,0,0.3)"
                            value={title}
                            onChangeText={setTitle}
                            textAlign="center"
                            autoFocus
                        />

                        {/* Mic button at bottom-right of hero card */}
                        <Pressable
                            style={[
                                styles.voiceButton,
                                isRecording && styles.voiceButtonRecording,
                            ]}
                            onPress={handleVoicePress}
                            disabled={isTranscribing}
                        >
                            {isTranscribing ? (
                                <ActivityIndicator size="small" color={isRecording ? '#fff' : '#E65100'} />
                            ) : isRecording ? (
                                <Animated.View style={pulseAnimStyle}>
                                    <Square size={14} color="#fff" fill="#fff" />
                                </Animated.View>
                            ) : (
                                <Mic size={20} color="#E65100" />
                            )}
                        </Pressable>
                    </LinearGradient>

                    {/* When? Section */}
                    <View style={styles.pickerSection}>
                        <Text style={styles.sectionTitle}>When?</Text>
                        <View style={styles.tagContainer}>
                            {['Today', 'Tomorrow', 'Pick Date'].map(tag => {
                                const isActive = (tag === 'Pick Date')
                                    ? activeWhenTag === 'Pick Date'
                                    : activeWhenTag === tag;
                                const label = tag === 'Pick Date' ? pickDateLabel : tag;
                                return (
                                    <Pressable
                                        key={tag}
                                        style={[styles.tag, isActive && styles.tagActive]}
                                        onPress={() => handleDateTagPress(tag)}
                                    >
                                        <Text style={[styles.tagText, isActive && styles.tagTextActive]}>
                                            {label}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>

                    {/* All Day? Section */}
                    <View style={styles.pickerSection}>
                        <Text style={styles.sectionTitle}>All Day?</Text>
                        <View style={styles.tagContainer}>
                            {['Yes', 'No'].map(opt => {
                                const isActive = (opt === 'Yes') === isAllDay;
                                return (
                                    <Pressable
                                        key={opt}
                                        style={[styles.tag, isActive && styles.tagActive]}
                                        onPress={() => {
                                            Haptics.selectionAsync();
                                            setIsAllDay(opt === 'Yes');
                                        }}
                                    >
                                        <Text style={[styles.tagText, isActive && styles.tagTextActive]}>
                                            {opt}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>

                    {/* Time Section (only when not all-day) */}
                    {!isAllDay && (
                        <View style={styles.pickerSection}>
                            <Text style={styles.sectionTitle}>Time</Text>
                            <View style={styles.tagContainer}>
                                <Pressable
                                    style={[styles.tag, styles.tagActive]}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setShowStartTimePicker(true);
                                    }}
                                >
                                    <Text style={[styles.tagText, styles.tagTextActive]}>
                                        Starts {formatTimeDisplay(startTime)}
                                    </Text>
                                </Pressable>
                                <Pressable
                                    style={[styles.tag, styles.tagActive]}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setShowEndTimePicker(true);
                                    }}
                                >
                                    <Text style={[styles.tagText, styles.tagTextActive]}>
                                        Ends {formatTimeDisplay(endTime)}
                                    </Text>
                                </Pressable>
                            </View>
                        </View>
                    )}

                    {/* Color Section */}
                    <View style={styles.pickerSection}>
                        <Text style={styles.sectionTitle}>Color</Text>
                        <View style={styles.colorRow}>
                            {EVENT_COLORS.map((color) => (
                                <Pressable
                                    key={color}
                                    style={[
                                        styles.colorDot,
                                        { backgroundColor: color },
                                        selectedColor === color && styles.colorDotSelected,
                                    ]}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setSelectedColor(color);
                                    }}
                                />
                            ))}
                        </View>
                    </View>

                    {/* Notes Section */}
                    <View style={styles.pickerSection}>
                        <Text style={styles.sectionTitle}>Notes</Text>
                        <View style={styles.notesCard}>
                            <TextInput
                                style={styles.notesInput}
                                placeholder="Add any additional details..."
                                placeholderTextColor="rgba(0,0,0,0.3)"
                                value={notes}
                                onChangeText={setNotes}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Footer: Done button */}
            <View style={styles.footer}>
                <Pressable
                    style={styles.bigButton}
                    onPress={handleSave}
                >
                    <Text style={styles.bigButtonText}>Done</Text>
                </Pressable>
            </View>

            {/* Date Picker Modal */}
            <DatePickerModal
                visible={showDatePicker}
                onClose={() => setShowDatePicker(false)}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
            />

            {/* Start Time Picker Modal */}
            <Modal
                visible={showStartTimePicker}
                transparent
                animationType="slide"
                onRequestClose={() => setShowStartTimePicker(false)}
            >
                <View style={styles.timePickerOverlay}>
                    <Pressable
                        style={styles.timePickerBackdrop}
                        onPress={() => setShowStartTimePicker(false)}
                    />
                    <View style={styles.timePickerModal}>
                        <View style={styles.timePickerHeader}>
                            <Pressable onPress={() => setShowStartTimePicker(false)}>
                                <Text style={styles.timePickerCancel}>Cancel</Text>
                            </Pressable>
                            <Text style={styles.timePickerTitle}>Start Time</Text>
                            <Pressable onPress={confirmStartTime}>
                                <Text style={styles.timePickerDone}>Done</Text>
                            </Pressable>
                        </View>
                        <View style={styles.timePickerContent}>
                            <DateTimePicker
                                value={timeStringToDate(startTime)}
                                mode="time"
                                display="spinner"
                                onChange={handleStartTimeChange}
                                themeVariant="light"
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* End Time Picker Modal */}
            <Modal
                visible={showEndTimePicker}
                transparent
                animationType="slide"
                onRequestClose={() => setShowEndTimePicker(false)}
            >
                <View style={styles.timePickerOverlay}>
                    <Pressable
                        style={styles.timePickerBackdrop}
                        onPress={() => setShowEndTimePicker(false)}
                    />
                    <View style={styles.timePickerModal}>
                        <View style={styles.timePickerHeader}>
                            <Pressable onPress={() => setShowEndTimePicker(false)}>
                                <Text style={styles.timePickerCancel}>Cancel</Text>
                            </Pressable>
                            <Text style={styles.timePickerTitle}>End Time</Text>
                            <Pressable onPress={confirmEndTime}>
                                <Text style={styles.timePickerDone}>Done</Text>
                            </Pressable>
                        </View>
                        <View style={styles.timePickerContent}>
                            <DateTimePicker
                                value={timeStringToDate(endTime)}
                                mode="time"
                                display="spinner"
                                onChange={handleEndTimeChange}
                                themeVariant="light"
                            />
                        </View>
                    </View>
                </View>
            </Modal>
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
        position: 'relative',
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
        color: '#E65100',
        width: '100%',
    },
    voiceButton: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    voiceButtonRecording: {
        backgroundColor: '#FF3B30',
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
        backgroundColor: '#E65100',
        borderColor: '#E65100',
    },
    tagText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#555',
    },
    tagTextActive: {
        color: '#fff',
    },
    colorRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    colorDot: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    colorDotSelected: {
        borderWidth: 3,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    notesCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    notesInput: {
        fontSize: 16,
        color: '#000',
        minHeight: 100,
        textAlignVertical: 'top',
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
    // Time picker modal styles
    timePickerOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    timePickerBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    timePickerModal: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 34,
    },
    timePickerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E5E5EA',
    },
    timePickerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000',
    },
    timePickerCancel: {
        fontSize: 17,
        color: '#8E8E93',
    },
    timePickerDone: {
        fontSize: 17,
        fontWeight: '600',
        color: '#E65100',
    },
    timePickerContent: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        minHeight: 200,
    },
});
