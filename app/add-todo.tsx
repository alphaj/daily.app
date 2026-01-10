import { useRouter } from 'expo-router';
import { X, Mic, Square, ChevronLeft } from 'lucide-react-native';
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

export default function AddTodoScreen() {
    const router = useRouter();
    const { addTodo } = useTodos();
    const [title, setTitle] = useState('');
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
        if (title.trim()) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            addTodo(title.trim());
            router.back();
        }
    };

    const handleCancel = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
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
                        style={styles.saveButton}
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
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : isRecording ? (
                                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                                        <Square size={20} color="#fff" fill="#fff" />
                                    </Animated.View>
                                ) : (
                                    <Mic size={20} color="#fff" />
                                )}
                            </Pressable>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
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
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#F2F2F7',
        borderBottomWidth: 0.5,
        borderBottomColor: '#C7C7CC',
    },
    closeButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000',
        letterSpacing: -0.4,
    },
    saveButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    saveButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#007AFF',
    },
    saveButtonTextDisabled: {
        opacity: 0.3,
    },
    content: {
        padding: 24,
        gap: 28,
    },
    section: {
        gap: 10,
    },
    label: {
        fontSize: 15,
        color: '#000',
        fontWeight: '500',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    input: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        fontSize: 17,
        color: '#000',
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    voiceButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    voiceButtonRecording: {
        backgroundColor: '#FF3B30',
    },
});
