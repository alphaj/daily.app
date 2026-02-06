import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, ChevronLeft, Calendar, Clock, Palette, FileText } from 'lucide-react-native';
import React, { useState, useRef, useEffect, useCallback } from 'react';
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
    Switch,
    Modal,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    withRepeat,
    withSequence,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
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
    const params = useLocalSearchParams<{ date?: string; startTime?: string }>();
    const { addEvent } = useCalendarEvents();

    const [title, setTitle] = useState('');
    const [selectedDate, setSelectedDate] = useState<Date>(
        params.date ? parse(params.date, 'yyyy-MM-dd', new Date()) : new Date()
    );
    // If startTime is provided, default to non-all-day event
    const [isAllDay, setIsAllDay] = useState(!params.startTime);
    const [startTime, setStartTime] = useState(params.startTime || '09:00');
    // Calculate end time as 1 hour after start time
    const [endTime, setEndTime] = useState(() => {
        if (params.startTime) {
            const [hours] = params.startTime.split(':').map(Number);
            const endHour = Math.min(hours + 1, 23);
            return `${endHour.toString().padStart(2, '0')}:00`;
        }
        return '10:00';
    });
    const [selectedColor, setSelectedColor] = useState(EVENT_COLORS[4]); // Blue default
    const [notes, setNotes] = useState('');

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);

    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const recordingRef = useRef<Audio.Recording | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // Reanimated pulse
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

    // Color picker modal animation
    const colorModalScale = useSharedValue(0.85);
    const colorModalOpacity = useSharedValue(0);

    useEffect(() => {
        if (showColorPicker) {
            colorModalScale.value = withSpring(1, { damping: 16, stiffness: 240 });
            colorModalOpacity.value = withTiming(1, { duration: 200 });
        } else {
            colorModalScale.value = withTiming(0.85, { duration: 150 });
            colorModalOpacity.value = withTiming(0, { duration: 150 });
        }
    }, [showColorPicker]);

    const colorModalAnimStyle = useAnimatedStyle(() => ({
        transform: [{ scale: colorModalScale.value }],
        opacity: colorModalOpacity.value,
    }));

    const colorBackdropAnimStyle = useAnimatedStyle(() => ({
        opacity: colorModalOpacity.value,
    }));

    // Time picker modal animations
    const startTimeTranslateY = useSharedValue(300);
    const startTimeBackdropOpacity = useSharedValue(0);
    const endTimeTranslateY = useSharedValue(300);
    const endTimeBackdropOpacity = useSharedValue(0);

    useEffect(() => {
        if (showStartTimePicker) {
            startTimeTranslateY.value = withSpring(0, { damping: 20, stiffness: 240 });
            startTimeBackdropOpacity.value = withTiming(1, { duration: 200 });
        } else {
            startTimeTranslateY.value = withSpring(300, { damping: 20, stiffness: 200 });
            startTimeBackdropOpacity.value = withTiming(0, { duration: 200 });
        }
    }, [showStartTimePicker]);

    useEffect(() => {
        if (showEndTimePicker) {
            endTimeTranslateY.value = withSpring(0, { damping: 20, stiffness: 240 });
            endTimeBackdropOpacity.value = withTiming(1, { duration: 200 });
        } else {
            endTimeTranslateY.value = withSpring(300, { damping: 20, stiffness: 200 });
            endTimeBackdropOpacity.value = withTiming(0, { duration: 200 });
        }
    }, [showEndTimePicker]);

    const startTimeSlideStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: startTimeTranslateY.value }],
    }));

    const startTimeBackdropStyle = useAnimatedStyle(() => ({
        opacity: startTimeBackdropOpacity.value,
    }));

    const endTimeSlideStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: endTimeTranslateY.value }],
    }));

    const endTimeBackdropStyle = useAnimatedStyle(() => ({
        opacity: endTimeBackdropOpacity.value,
    }));

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

    // Convert time string (HH:mm) to Date object for picker
    const timeStringToDate = (timeStr: string): Date => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(hours);
        date.setMinutes(minutes);
        return date;
    };

    // Format time for display (e.g., "2:30 PM")
    const formatTimeDisplay = (timeStr: string): string => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    // Handle time change from picker
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

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.header}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.cancelButton,
                            pressed && styles.buttonPressed
                        ]}
                        onPress={handleCancel}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
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

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="interactive"
                >
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
                                        <Animated.View style={pulseAnimStyle}>
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
                                        <Pressable
                                            style={({ pressed }) => [
                                                styles.detailRow,
                                                pressed && styles.detailRowPressed
                                            ]}
                                            onPress={() => {
                                                Haptics.selectionAsync();
                                                setShowStartTimePicker(true);
                                            }}
                                        >
                                            <Text style={styles.timeLabel}>Starts</Text>
                                            <View style={styles.detailRight}>
                                                <Text style={styles.timeValue}>{formatTimeDisplay(startTime)}</Text>
                                                <ChevronRight size={16} color="#C7C7CC" strokeWidth={2} />
                                            </View>
                                        </Pressable>

                                        <View style={styles.separatorContainer}>
                                            <View style={styles.separator} />
                                        </View>

                                        {/* End Time */}
                                        <Pressable
                                            style={({ pressed }) => [
                                                styles.detailRow,
                                                pressed && styles.detailRowPressed
                                            ]}
                                            onPress={() => {
                                                Haptics.selectionAsync();
                                                setShowEndTimePicker(true);
                                            }}
                                        >
                                            <Text style={styles.timeLabel}>Ends</Text>
                                            <View style={styles.detailRight}>
                                                <Text style={styles.timeValue}>{formatTimeDisplay(endTime)}</Text>
                                                <ChevronRight size={16} color="#C7C7CC" strokeWidth={2} />
                                            </View>
                                        </Pressable>
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

            {/* Color Picker Modal — blur + spring */}
            <Modal
                visible={showColorPicker}
                transparent
                animationType="none"
                onRequestClose={() => setShowColorPicker(false)}
            >
                <Pressable
                    style={styles.colorModalOverlay}
                    onPress={() => setShowColorPicker(false)}
                >
                    <Animated.View style={[StyleSheet.absoluteFill, colorBackdropAnimStyle]}>
                        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                    </Animated.View>
                    <Animated.View style={[styles.colorModalContent, colorModalAnimStyle]}>
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
                    </Animated.View>
                </Pressable>
            </Modal>

            {/* Start Time Picker — spring slide-up */}
            <Modal
                visible={showStartTimePicker}
                transparent
                animationType="none"
                onRequestClose={() => setShowStartTimePicker(false)}
            >
                <View style={styles.timePickerOverlayContainer}>
                    <Animated.View style={[styles.timePickerBackdrop, startTimeBackdropStyle]}>
                        <Pressable
                            style={StyleSheet.absoluteFill}
                            onPress={() => setShowStartTimePicker(false)}
                        />
                    </Animated.View>
                    <Animated.View style={[styles.timePickerModal, startTimeSlideStyle]}>
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
                    </Animated.View>
                </View>
            </Modal>

            {/* End Time Picker — spring slide-up */}
            <Modal
                visible={showEndTimePicker}
                transparent
                animationType="none"
                onRequestClose={() => setShowEndTimePicker(false)}
            >
                <View style={styles.timePickerOverlayContainer}>
                    <Animated.View style={[styles.timePickerBackdrop, endTimeBackdropStyle]}>
                        <Pressable
                            style={StyleSheet.absoluteFill}
                            onPress={() => setShowEndTimePicker(false)}
                        />
                    </Animated.View>
                    <Animated.View style={[styles.timePickerModal, endTimeSlideStyle]}>
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
                    </Animated.View>
                </View>
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
    cancelButton: {
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    cancelButtonText: {
        fontSize: 17,
        fontWeight: '400',
        color: '#007AFF',
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
    timeValue: {
        fontSize: 17,
        color: '#007AFF',
        fontWeight: '500',
    },
    // Time Picker Modal Styles
    timePickerOverlayContainer: {
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
        color: '#007AFF',
    },
    timePickerContent: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        minHeight: 200,
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
