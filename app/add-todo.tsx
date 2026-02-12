import { useRouter } from 'expo-router';
import { ArrowLeft, Mic, Square } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
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
    Modal,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { useTodos } from '@/contexts/TodoContext';
import { useWorkMode } from '@/contexts/WorkModeContext';
import { format, isToday, isTomorrow, addDays } from 'date-fns';
import { DatePickerModal } from '@/components/DatePickerModal';

export default function AddTodoScreen() {
    const router = useRouter();
    const { addTodo } = useTodos();
    const { isWorkMode } = useWorkMode();
    const [title, setTitle] = useState('');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high' | undefined>(undefined);
    const [dueDate, setDueDate] = useState<Date | null>(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [dueTime, setDueTime] = useState<string | undefined>(undefined);
    const [showTimePicker, setShowTimePicker] = useState(false);

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
                Alert.alert('Transcription Failed', 'Voice transcription is temporarily unavailable. Please type your task instead.');
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

    const handleSave = () => {
        if (title.trim()) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            addTodo(title.trim(), dueDate || new Date(), priority, isWorkMode, dueTime);
            router.back();
        }
    };

    const getWhenLabel = (): string => {
        if (!dueDate) return 'No Date';
        if (isToday(dueDate)) return 'Today';
        if (isTomorrow(dueDate)) return 'Tomorrow';
        return format(dueDate, 'MMM d');
    };

    const getTimeLabel = (): string => {
        if (!dueTime) return 'No Time';
        const [h, m] = dueTime.split(':').map(Number);
        const period = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 || 12;
        return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
    };

    const whenOptions = () => {
        const options: { label: string; key: string }[] = [];
        options.push({ label: 'Today', key: 'today' });
        options.push({ label: 'Tomorrow', key: 'tomorrow' });

        if (dueDate && !isToday(dueDate) && !isTomorrow(dueDate)) {
            options.push({ label: format(dueDate, 'MMM d'), key: 'picked' });
        } else {
            options.push({ label: 'Pick Date', key: 'pick' });
        }

        options.push({ label: 'No Date', key: 'nodate' });
        return options;
    };

    const isWhenActive = (key: string): boolean => {
        if (key === 'today') return dueDate !== null && isToday(dueDate);
        if (key === 'tomorrow') return dueDate !== null && isTomorrow(dueDate);
        if (key === 'picked') return dueDate !== null && !isToday(dueDate) && !isTomorrow(dueDate);
        if (key === 'pick') return false;
        if (key === 'nodate') return dueDate === null;
        return false;
    };

    const handleWhenPress = (key: string) => {
        Haptics.selectionAsync();
        if (key === 'today') {
            setDueDate(new Date());
        } else if (key === 'tomorrow') {
            setDueDate(addDays(new Date(), 1));
        } else if (key === 'pick' || key === 'picked') {
            setShowDatePicker(true);
        } else if (key === 'nodate') {
            setDueDate(null);
        }
    };

    const priorityOptions: { label: string; value: 'low' | 'medium' | 'high' | undefined }[] = [
        { label: 'None', value: undefined },
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
    ];

    const timeOptions = () => {
        if (dueTime) {
            return [
                { label: 'No Time', key: 'notime' },
                { label: getTimeLabel(), key: 'settime' },
            ];
        }
        return [
            { label: 'No Time', key: 'notime' },
            { label: 'Set Time', key: 'settime' },
        ];
    };

    const isTimeActive = (key: string): boolean => {
        if (key === 'notime') return !dueTime;
        if (key === 'settime') return !!dueTime;
        return false;
    };

    const handleTimePress = (key: string) => {
        Haptics.selectionAsync();
        if (key === 'notime') {
            setDueTime(undefined);
        } else if (key === 'settime') {
            if (!dueTime) {
                setDueTime('09:00');
            }
            setShowTimePicker(true);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.iconBtn}>
                    <ArrowLeft size={24} color="#000" />
                </Pressable>
                <Text style={styles.headerTitle}>Add Task</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
            >
                <LinearGradient
                    colors={['#E3F2FD', '#BBDEFB']}
                    style={styles.heroCard}
                >
                    <View style={styles.mainEmojiContainer}>
                        <Text style={{ fontSize: 48 }}>📝</Text>
                    </View>
                    <TextInput
                        style={styles.heroInput}
                        placeholder="Task name..."
                        placeholderTextColor="rgba(13,71,161,0.3)"
                        value={title}
                        onChangeText={setTitle}
                        textAlign="center"
                        autoFocus
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
                            <ActivityIndicator size="small" color={isRecording ? "#fff" : "#0D47A1"} />
                        ) : isRecording ? (
                            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                                <Square size={14} color="#fff" fill="#fff" />
                            </Animated.View>
                        ) : (
                            <Mic size={18} color="#0D47A1" />
                        )}
                    </Pressable>
                </LinearGradient>

                {/* When? section */}
                <View style={styles.pickerSection}>
                    <Text style={styles.sectionTitle}>When?</Text>
                    <View style={styles.tagContainer}>
                        {whenOptions().map(opt => {
                            const active = isWhenActive(opt.key);
                            return (
                                <Pressable
                                    key={opt.key}
                                    style={[
                                        styles.tag,
                                        active && styles.tagActive,
                                    ]}
                                    onPress={() => handleWhenPress(opt.key)}
                                >
                                    <Text style={[styles.tagText, active && styles.tagTextActive]}>{opt.label}</Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                {/* Priority section */}
                <View style={styles.pickerSection}>
                    <Text style={styles.sectionTitle}>Priority</Text>
                    <View style={styles.tagContainer}>
                        {priorityOptions.map(opt => {
                            const active = priority === opt.value;
                            return (
                                <Pressable
                                    key={opt.label}
                                    style={[
                                        styles.tag,
                                        active && styles.tagActive,
                                    ]}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setPriority(opt.value);
                                    }}
                                >
                                    <Text style={[styles.tagText, active && styles.tagTextActive]}>{opt.label}</Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                {/* Time section */}
                <View style={styles.pickerSection}>
                    <Text style={styles.sectionTitle}>Time</Text>
                    <View style={styles.tagContainer}>
                        {timeOptions().map(opt => {
                            const active = isTimeActive(opt.key);
                            return (
                                <Pressable
                                    key={opt.key}
                                    style={[
                                        styles.tag,
                                        active && styles.tagActive,
                                    ]}
                                    onPress={() => handleTimePress(opt.key)}
                                >
                                    <Text style={[styles.tagText, active && styles.tagTextActive]}>{opt.label}</Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>
            </ScrollView>
            </KeyboardAvoidingView>

            <View style={styles.footer}>
                <Pressable
                    style={styles.bigButton}
                    onPress={handleSave}
                >
                    <Text style={styles.bigButtonText}>Done</Text>
                </Pressable>
            </View>

            <DatePickerModal
                visible={showDatePicker}
                onClose={() => setShowDatePicker(false)}
                selectedDate={dueDate}
                onSelectDate={setDueDate}
            />

            {/* Time Picker Modal */}
            <Modal
                visible={showTimePicker}
                transparent
                animationType="slide"
                onRequestClose={() => setShowTimePicker(false)}
            >
                <View style={styles.modalOverlay}>
                    <Pressable
                        style={StyleSheet.absoluteFill}
                        onPress={() => setShowTimePicker(false)}
                    />
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHeader}>
                            <Pressable onPress={() => {
                                setDueTime(undefined);
                                setShowTimePicker(false);
                            }}>
                                <Text style={styles.modalRemove}>Remove</Text>
                            </Pressable>
                            <Text style={styles.modalTitle}>Due Time</Text>
                            <Pressable onPress={() => setShowTimePicker(false)}>
                                <Text style={styles.modalDone}>Done</Text>
                            </Pressable>
                        </View>
                        <View style={styles.modalBody}>
                            <DateTimePicker
                                value={(() => {
                                    const [h, m] = (dueTime || '09:00').split(':').map(Number);
                                    const d = new Date();
                                    d.setHours(h);
                                    d.setMinutes(m);
                                    return d;
                                })()}
                                mode="time"
                                display="spinner"
                                onChange={(event: any, selectedDate?: Date) => {
                                    if (selectedDate) {
                                        const hours = selectedDate.getHours().toString().padStart(2, '0');
                                        const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
                                        setDueTime(`${hours}:${minutes}`);
                                    }
                                }}
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
        color: '#0D47A1',
        width: '100%',
    },
    voiceButton: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        width: 36,
        height: 36,
        borderRadius: 18,
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
        backgroundColor: '#0D47A1',
        borderColor: '#0D47A1',
    },
    tagText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#555',
    },
    tagTextActive: {
        color: '#fff',
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
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    modalSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 34,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 0.5,
        borderBottomColor: '#E5E5EA',
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000',
    },
    modalRemove: {
        fontSize: 17,
        color: '#FF3B30',
    },
    modalDone: {
        fontSize: 17,
        fontWeight: '600',
        color: '#007AFF',
    },
    modalBody: {
        paddingHorizontal: 20,
        paddingVertical: 8,
    },
});
