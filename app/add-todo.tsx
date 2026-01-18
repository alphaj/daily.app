import { useRouter } from 'expo-router';
import { X, Mic, Square, ChevronLeft, Calendar, Flag, ChevronRight } from 'lucide-react-native';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { useTodos } from '@/contexts/TodoContext';
import { useWorkMode } from '@/contexts/WorkModeContext';
import { format, isToday, isTomorrow, addDays } from 'date-fns';
import { DatePickerModal } from '@/components/DatePickerModal';
import { PriorityPickerModal } from '@/components/PriorityPickerModal';

export default function AddTodoScreen() {
    const router = useRouter();
    const { addTodo } = useTodos();
    const { isWorkMode } = useWorkMode();
    const [title, setTitle] = useState('');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high' | undefined>(undefined);
    const [dueDate, setDueDate] = useState<Date | null>(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showPriorityPicker, setShowPriorityPicker] = useState(false);

    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const recordingRef = useRef<Audio.Recording | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // ... (keep existing pulse/recording functions unchanged) ...

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
            }
        } catch (error) {
            console.log('Error stopping recording:', error);
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
        console.log('[AddTodo] handleSave called', { title, dueDate, priority, isWorkMode });
        if (title.trim()) {
            console.log('[AddTodo] title is valid, adding todo...');
            try {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                addTodo(title.trim(), dueDate || new Date(), priority, isWorkMode);
                console.log('[AddTodo] todo added, navigating back...');
                router.back();
            } catch (error) {
                console.error('[AddTodo] Error in handleSave:', error);
            }
        } else {
            console.log('[AddTodo] title is empty, not saving');
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

    const openPriorityPicker = () => {
        Haptics.selectionAsync();
        setShowPriorityPicker(true);
    };

    const openDatePicker = () => {
        Haptics.selectionAsync();
        setShowDatePicker(true);
    };

    const getPriorityColor = () => {
        switch (priority) {
            case 'high': return '#FF3B30';
            case 'medium': return '#FF9500';
            case 'low': return '#34C759';
            default: return '#8E8E93';
        }
    };

    const getPriorityLabel = () => {
        if (!priority) return 'None';
        return priority.charAt(0).toUpperCase() + priority.slice(1);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.header}>
                    <Pressable style={[styles.closeButton, { backgroundColor: '#fff', borderRadius: 22, alignItems: 'center' }]} onPress={handleCancel}>
                        <ChevronLeft size={24} color="#000" strokeWidth={1.5} />
                    </Pressable>
                    <Text style={styles.headerTitle}>New Task</Text>
                    <Pressable
                        style={[
                            styles.saveButton,
                            !title.trim() && styles.saveButtonDisabled,
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

                <View style={styles.content}>
                    <View style={styles.section}>
                        <Text style={styles.label}>What do you need to do today?</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Call mom, Buy groceries"
                                placeholderTextColor="#C7C7CC"
                                value={title}
                                onChangeText={setTitle}
                                autoFocus
                                returnKeyType="done"
                                onSubmitEditing={handleSave}
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
                                    <Mic size={20} color="#007AFF" />
                                )}
                            </Pressable>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.label}>Details</Text>
                        <View style={styles.detailsCard}>
                            <Pressable style={styles.detailRow} onPress={openDatePicker}>
                                <View style={styles.detailLeft}>
                                    <View style={[styles.iconContainer, { backgroundColor: '#007AFF' }]}>
                                        <Calendar size={18} color="#fff" />
                                    </View>
                                    <Text style={styles.detailLabel}>Due Date</Text>
                                </View>
                                <View style={styles.detailRight}>
                                    <Text style={styles.detailValue}>
                                        {!dueDate ? 'No Date' : isToday(dueDate) ? 'Today' : isTomorrow(dueDate) ? 'Tomorrow' : format(dueDate, 'MMM d')}
                                    </Text>
                                    <ChevronRight size={16} color="#C7C7CC" />
                                </View>
                            </Pressable>

                            <View style={styles.separator} />

                            <Pressable style={styles.detailRow} onPress={openPriorityPicker}>
                                <View style={styles.detailLeft}>
                                    <View style={[styles.iconContainer, { backgroundColor: getPriorityColor() }]}>
                                        <Flag size={18} color="#fff" />
                                    </View>
                                    <Text style={styles.detailLabel}>Priority</Text>
                                </View>
                                <View style={styles.detailRight}>
                                    <Text style={styles.detailValue}>{getPriorityLabel()}</Text>
                                    <ChevronRight size={16} color="#C7C7CC" />
                                </View>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>

            <DatePickerModal
                visible={showDatePicker}
                onClose={() => setShowDatePicker(false)}
                selectedDate={dueDate}
                onSelectDate={setDueDate}
            />

            <PriorityPickerModal
                visible={showPriorityPicker}
                onClose={() => setShowPriorityPicker(false)}
                selectedPriority={priority}
                onSelectPriority={setPriority}
            />
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
        height: 40,
        paddingHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#007AFF', // Filled button for "Add"
        borderRadius: 20,
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    saveButtonTextDisabled: {
        color: '#8E8E93',
    },
    saveButtonDisabled: {
        backgroundColor: '#E5E5EA', // Gray when disabled
        shadowOpacity: 0,
        elevation: 0,
    },
    content: {
        padding: 20,
        gap: 24,
    },
    section: {
        gap: 8,
    },
    label: {
        fontSize: 13,
        textTransform: 'uppercase',
        color: '#6e6e73',
        fontWeight: '500',
        marginLeft: 12, // Indent slightly for section header look
        marginBottom: 4,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 20, // Rounded unified card
        paddingHorizontal: 16,
        paddingVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        minHeight: 60, // Ensure good touch target
    },
    input: {
        flex: 1,
        fontSize: 17,
        color: '#000',
        paddingVertical: 8,
        marginRight: 8,
    },
    voiceButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F2F2F7', // Subtle background inside card
        justifyContent: 'center',
        alignItems: 'center',
    },
    voiceButtonRecording: {
        backgroundColor: '#FF3B30',
        shadowColor: '#FF3B30',
    },
    detailsCard: {
        backgroundColor: '#fff',
        borderRadius: 12, // Slightly tighter radius for inner items usually, keeping 16 or 12 based on pref. Screenshot looks like 12-14. Let's stick to 12.
        paddingLeft: 16,
        // Common grouped style shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        overflow: 'hidden', // Ensure separator doesn't bleed if we had one at bottom
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16, // Increased spacing
        paddingRight: 16,
        minHeight: 56, // Taller minimum height
    },
    detailLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        width: 30,
        height: 30,
        borderRadius: 7, // Smooth squircle 
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 17,
        color: '#000',
        fontWeight: '400', // Regular weight matches screenshot
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
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#C6C6C8',
    },
});
