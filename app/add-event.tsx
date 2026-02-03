import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, ChevronLeft, Calendar, Clock, Palette, FileText } from 'lucide-react-native';
import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Animated,
    ScrollView,
    Switch,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { useCalendarEvents } from '@/contexts/CalendarEventContext';
import { EVENT_COLORS } from '@/types/event';
import { format, isToday, isTomorrow, parse } from 'date-fns';
import { DatePickerModal } from '@/components/DatePickerModal';
import { Mic, Square, ChevronRight } from 'lucide-react-native';
import { Alert } from 'react-native';

export default function AddEventScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ date?: string }>();
    const { addEvent } = useCalendarEvents();

    const [title, setTitle] = useState('');
    const [selectedDate, setSelectedDate] = useState<Date>(
        params.date ? parse(params.date, 'yyyy-MM-dd', new Date()) : new Date()
    );
    const [isAllDay, setIsAllDay] = useState(true);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');
    const [selectedColor, setSelectedColor] = useState(EVENT_COLORS[4]); // Blue default
    const [notes, setNotes] = useState('');

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);

    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const recordingRef = useRef<Audio.Recording | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    const startPulse = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    const stopPulse = () => {
        pulseAnim.stopAnimation();
        pulseAnim.setValue(1);
    };

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

    const handleCancel = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/');
        }
    };

    const openDatePicker = () => {
        Haptics.selectionAsync();
        setShowDatePicker(true);
    };

    const getDateLabel = () => {
        if (isToday(selectedDate)) return 'Today';
        if (isTomorrow(selectedDate)) return 'Tomorrow';
        return format(selectedDate, 'MMM d, yyyy');
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.header}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.closeButton,
                            pressed && styles.buttonPressed
                        ]}
                        onPress={handleCancel}
                    >
                        <ChevronLeft size={24} color="#000" strokeWidth={2} />
                    </Pressable>
                    <Text style={styles.headerTitle}>New Event</Text>
                    <Pressable
                        style={({ pressed }) => [
                            styles.saveButton,
                            !title.trim() && styles.saveButtonDisabled,
                            pressed && title.trim() && styles.buttonPressed
                        ]}
                        onPress={handleSave}
                        disabled={!title.trim()}
                    >
                        <Text
                            style={[
                                styles.saveButtonText,
                                !title.trim() && styles.saveButtonTextDisabled,
                            ]}
                        >
                            Add
                        </Text>
                    </Pressable>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.content}>
                        <View style={styles.section}>
                            <Text style={styles.label}>EVENT TITLE</Text>
                            <View style={styles.inputCard}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. Doctor's appointment, Meeting"
                                    placeholderTextColor="#C7C7CC"
                                    value={title}
                                    onChangeText={setTitle}
                                    autoFocus
                                    multiline
                                    scrollEnabled={false}
                                    onSubmitEditing={handleSave}
                                    blurOnSubmit={true}
                                    submitBehavior="submit"
                                    returnKeyType="done"
                                />
                                <Pressable
                                    style={[
                                        styles.voiceButton,
                                        isRecording && styles.voiceButtonRecording,
                                    ]}
                                    onPress={handleVoicePress}
                                    disabled={isTranscribing}
                                >
                                    {isTranscribing ? (
                                        <ActivityIndicator size="small" color={isRecording ? "#fff" : "#007AFF"} />
                                    ) : isRecording ? (
                                        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                                            <Square size={16} color="#fff" fill="#fff" />
                                        </Animated.View>
                                    ) : (
                                        <Mic size={22} color="#007AFF" />
                                    )}
                                </Pressable>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.label}>DETAILS</Text>
                            <View style={styles.detailsCard}>
                                {/* Date */}
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.detailRow,
                                        pressed && styles.detailRowPressed
                                    ]}
                                    onPress={openDatePicker}
                                >
                                    <View style={styles.detailLeft}>
                                        <View style={[styles.iconContainer, { backgroundColor: '#FF3B30' }]}>
                                            <Calendar size={18} color="#fff" strokeWidth={2.5} />
                                        </View>
                                        <Text style={styles.detailLabel}>Date</Text>
                                    </View>
                                    <View style={styles.detailRight}>
                                        <Text style={styles.detailValue}>{getDateLabel()}</Text>
                                        <ChevronRight size={16} color="#C7C7CC" strokeWidth={2} />
                                    </View>
                                </Pressable>

                                <View style={styles.separatorContainer}>
                                    <View style={styles.separator} />
                                </View>

                                {/* All Day Toggle */}
                                <View style={styles.detailRow}>
                                    <View style={styles.detailLeft}>
                                        <View style={[styles.iconContainer, { backgroundColor: '#FF9500' }]}>
                                            <Clock size={18} color="#fff" strokeWidth={2.5} />
                                        </View>
                                        <Text style={styles.detailLabel}>All-day</Text>
                                    </View>
                                    <Switch
                                        value={isAllDay}
                                        onValueChange={setIsAllDay}
                                        trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                                        thumbColor="#fff"
                                    />
                                </View>

                                {!isAllDay && (
                                    <>
                                        <View style={styles.separatorContainer}>
                                            <View style={styles.separator} />
                                        </View>

                                        {/* Start Time */}
                                        <View style={styles.detailRow}>
                                            <Text style={styles.timeLabel}>Starts</Text>
                                            <TextInput
                                                style={styles.timeInput}
                                                value={startTime}
                                                onChangeText={setStartTime}
                                                placeholder="09:00"
                                                placeholderTextColor="#C7C7CC"
                                                keyboardType="numbers-and-punctuation"
                                            />
                                        </View>

                                        <View style={styles.separatorContainer}>
                                            <View style={styles.separator} />
                                        </View>

                                        {/* End Time */}
                                        <View style={styles.detailRow}>
                                            <Text style={styles.timeLabel}>Ends</Text>
                                            <TextInput
                                                style={styles.timeInput}
                                                value={endTime}
                                                onChangeText={setEndTime}
                                                placeholder="10:00"
                                                placeholderTextColor="#C7C7CC"
                                                keyboardType="numbers-and-punctuation"
                                            />
                                        </View>
                                    </>
                                )}

                                <View style={styles.separatorContainer}>
                                    <View style={styles.separator} />
                                </View>

                                {/* Color */}
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.detailRow,
                                        pressed && styles.detailRowPressed
                                    ]}
                                    onPress={() => setShowColorPicker(true)}
                                >
                                    <View style={styles.detailLeft}>
                                        <View style={[styles.iconContainer, { backgroundColor: selectedColor }]}>
                                            <Palette size={18} color="#fff" strokeWidth={2.5} />
                                        </View>
                                        <Text style={styles.detailLabel}>Color</Text>
                                    </View>
                                    <View style={styles.detailRight}>
                                        <View style={[styles.colorPreview, { backgroundColor: selectedColor }]} />
                                        <ChevronRight size={16} color="#C7C7CC" strokeWidth={2} />
                                    </View>
                                </Pressable>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.label}>NOTES</Text>
                            <View style={styles.notesCard}>
                                <TextInput
                                    style={styles.notesInput}
                                    placeholder="Add any additional details..."
                                    placeholderTextColor="#C7C7CC"
                                    value={notes}
                                    onChangeText={setNotes}
                                    multiline
                                    numberOfLines={4}
                                    textAlignVertical="top"
                                />
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <DatePickerModal
                visible={showDatePicker}
                onClose={() => setShowDatePicker(false)}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
            />

            {/* Color Picker Modal */}
            <Modal
                visible={showColorPicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowColorPicker(false)}
            >
                <Pressable
                    style={styles.colorModalOverlay}
                    onPress={() => setShowColorPicker(false)}
                >
                    <View style={styles.colorModalContent}>
                        <Text style={styles.colorModalTitle}>Choose Color</Text>
                        <View style={styles.colorGrid}>
                            {EVENT_COLORS.map((color) => (
                                <Pressable
                                    key={color}
                                    style={[
                                        styles.colorOption,
                                        { backgroundColor: color },
                                        selectedColor === color && styles.colorOptionSelected,
                                    ]}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setSelectedColor(color);
                                        setShowColorPicker(false);
                                    }}
                                />
                            ))}
                        </View>
                    </View>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    keyboardView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#F2F2F7',
        zIndex: 10,
    },
    closeButton: {
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
        elevation: 2,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#000',
    },
    saveButton: {
        height: 36,
        paddingHorizontal: 18,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#007AFF',
        borderRadius: 18,
    },
    saveButtonDisabled: {
        backgroundColor: '#E5E5EA',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    saveButtonTextDisabled: {
        color: '#8E8E93',
    },
    buttonPressed: {
        opacity: 0.7,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    content: {
        padding: 20,
        gap: 28,
    },
    section: {
        gap: 8,
    },
    label: {
        fontSize: 13,
        color: '#8E8E93',
        fontWeight: '500',
        marginLeft: 16,
        marginBottom: 2,
    },
    inputCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 16,
        minHeight: 80,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 3,
    },
    input: {
        flex: 1,
        fontSize: 19,
        color: '#000',
        marginTop: 0,
        marginRight: 12,
        minHeight: 40,
        textAlignVertical: 'top',
        lineHeight: 24,
    },
    voiceButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F2F2F7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    voiceButtonRecording: {
        backgroundColor: '#FF3B30',
    },
    detailsCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        minHeight: 56,
    },
    detailRowPressed: {
        backgroundColor: '#F9F9F9',
    },
    detailLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 17,
        color: '#000',
        fontWeight: '500',
    },
    detailRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    detailValue: {
        fontSize: 17,
        color: '#8E8E93',
    },
    separatorContainer: {
        paddingLeft: 60,
        backgroundColor: '#fff',
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#E5E5EA',
    },
    timeLabel: {
        fontSize: 17,
        color: '#000',
        fontWeight: '500',
        marginLeft: 46,
    },
    timeInput: {
        fontSize: 17,
        color: '#007AFF',
        fontWeight: '500',
        textAlign: 'right',
        minWidth: 60,
    },
    colorPreview: {
        width: 24,
        height: 24,
        borderRadius: 12,
    },
    notesCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
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
    colorModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    colorModalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        width: '80%',
        maxWidth: 320,
    },
    colorModalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
        textAlign: 'center',
        marginBottom: 20,
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 16,
    },
    colorOption: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    colorOptionSelected: {
        borderWidth: 3,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
});
