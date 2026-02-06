import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Alert,
    ScrollView,
    TextInput,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import { X, Check, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';

import { AmbientBackground } from '@/components/AmbientBackground';
import { VoiceRecordButton } from '@/components/VoiceRecordButton';
import { useJournal } from '@/contexts/JournalContext';
import { Mood } from '@/types/journal';

const MOOD_OPTIONS: { value: Mood; emoji: string; label: string }[] = [
    { value: 'great', emoji: '🤩', label: 'Great' },
    { value: 'good', emoji: '😊', label: 'Good' },
    { value: 'okay', emoji: '😐', label: 'Okay' },
    { value: 'low', emoji: '😔', label: 'Low' },
    { value: 'rough', emoji: '😣', label: 'Rough' },
];

export default function AddJournalScreen() {
    const router = useRouter();
    const { addEntry } = useJournal();

    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [audioUri, setAudioUri] = useState<string | null>(null);
    const [transcript, setTranscript] = useState('');
    const [selectedMood, setSelectedMood] = useState<Mood | undefined>();
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        // Request audio permissions on mount
        (async () => {
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permission Required',
                    'Please enable microphone access to record journal entries.',
                    [{ text: 'OK', onPress: () => router.back() }]
                );
            }
        })();

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [router]);

    const startRecording = async () => {
        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording: newRecording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            setRecording(newRecording);
            setIsRecording(true);
            setDuration(0);

            // Start duration timer
            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);

        } catch (error) {
            console.error('Failed to start recording:', error);
            Alert.alert('Error', 'Failed to start recording. Please try again.');
        }
    };

    const stopRecording = async () => {
        if (!recording) return;

        try {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }

            setIsRecording(false);
            await recording.stopAndUnloadAsync();

            const uri = recording.getURI();
            setAudioUri(uri);
            setRecording(null);

            // Reset audio mode
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
            });

            // Simulate transcription (replace with actual Whisper API call)
            if (uri) {
                setIsTranscribing(true);
                // TODO: Send audio to backend for Whisper transcription
                // For now, we'll use a placeholder that allows manual input
                setTimeout(() => {
                    setIsTranscribing(false);
                    // Set empty transcript so user can type or wait for API
                }, 500);
            }

        } catch (error) {
            console.error('Failed to stop recording:', error);
            Alert.alert('Error', 'Failed to stop recording. Please try again.');
        }
    };

    const handleRecordPress = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const handleSave = async () => {
        if (!audioUri && !transcript.trim()) {
            Alert.alert('Empty Entry', 'Please record something or add a note.');
            return;
        }

        setIsSaving(true);
        try {
            await addEntry(
                transcript.trim() || 'Voice note (no transcript)',
                duration,
                audioUri || undefined,
                selectedMood
            );

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
        } catch (error) {
            console.error('Failed to save entry:', error);
            Alert.alert('Error', 'Failed to save entry. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        if (isRecording) {
            Alert.alert(
                'Discard Recording?',
                'You have an active recording. Are you sure you want to discard it?',
                [
                    { text: 'Keep Recording', style: 'cancel' },
                    { text: 'Discard', style: 'destructive', onPress: () => router.back() },
                ]
            );
        } else if (audioUri || transcript.trim()) {
            Alert.alert(
                'Discard Entry?',
                'Your journal entry will be lost.',
                [
                    { text: 'Keep', style: 'cancel' },
                    { text: 'Discard', style: 'destructive', onPress: () => router.back() },
                ]
            );
        } else {
            router.back();
        }
    };

    const hasContent = audioUri || transcript.trim();

    return (
        <View style={styles.container}>
            <AmbientBackground />
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                {/* Header */}
                <View style={styles.header}>
                    <Pressable
                        style={styles.headerButton}
                        onPress={handleCancel}
                    >
                        <X size={24} color="#000" strokeWidth={2} />
                    </Pressable>

                    <View style={styles.headerCenter}>
                        <Text style={styles.headerLabel}>TODAY'S JOURNAL</Text>
                        <Text style={styles.headerDate}>{format(new Date(), 'MMMM d')}</Text>
                    </View>

                    <Pressable
                        style={[
                            styles.headerButton,
                            styles.saveButton,
                            !hasContent && styles.saveButtonDisabled
                        ]}
                        onPress={handleSave}
                        disabled={!hasContent || isSaving}
                    >
                        {isSaving ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <Check size={20} color="#FFF" strokeWidth={2.5} />
                        )}
                    </Pressable>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="interactive"
                >
                    {/* Recording Section */}
                    <View style={styles.recordingSection}>
                        <VoiceRecordButton
                            isRecording={isRecording}
                            duration={duration}
                            onPress={handleRecordPress}
                            disabled={isTranscribing || isSaving}
                        />
                    </View>

                    {/* Transcription Section */}
                    {(audioUri || isTranscribing) && (
                        <View style={styles.transcriptSection}>
                            <View style={styles.transcriptHeader}>
                                <Sparkles size={16} color="#AF52DE" strokeWidth={2} />
                                <Text style={styles.transcriptLabel}>
                                    {isTranscribing ? 'Transcribing...' : 'Transcript'}
                                </Text>
                            </View>

                            {isTranscribing ? (
                                <View style={styles.transcribingContainer}>
                                    <ActivityIndicator size="small" color="#AF52DE" />
                                    <Text style={styles.transcribingText}>
                                        Processing your voice...
                                    </Text>
                                </View>
                            ) : (
                                <TextInput
                                    style={styles.transcriptInput}
                                    value={transcript}
                                    onChangeText={setTranscript}
                                    placeholder="Add or edit transcript..."
                                    placeholderTextColor="#C7C7CC"
                                    multiline
                                    textAlignVertical="top"
                                />
                            )}
                        </View>
                    )}

                    {/* Mood Selection */}
                    {audioUri && !isRecording && (
                        <View style={styles.moodSection}>
                            <Text style={styles.moodLabel}>How are you feeling?</Text>
                            <View style={styles.moodOptions}>
                                {MOOD_OPTIONS.map((mood) => (
                                    <Pressable
                                        key={mood.value}
                                        style={[
                                            styles.moodOption,
                                            selectedMood === mood.value && styles.moodOptionSelected
                                        ]}
                                        onPress={() => {
                                            Haptics.selectionAsync();
                                            setSelectedMood(
                                                selectedMood === mood.value ? undefined : mood.value
                                            );
                                        }}
                                    >
                                        <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                                        <Text style={[
                                            styles.moodText,
                                            selectedMood === mood.value && styles.moodTextSelected
                                        ]}>
                                            {mood.label}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>
                    )}
                </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: {
        alignItems: 'center',
    },
    headerLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#8E8E93',
        letterSpacing: 0.5,
    },
    headerDate: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        letterSpacing: -0.3,
        marginTop: 2,
    },
    saveButton: {
        backgroundColor: '#34C759',
    },
    saveButtonDisabled: {
        backgroundColor: '#C7C7CC',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    recordingSection: {
        paddingTop: 60,
        paddingBottom: 48,
        alignItems: 'center',
    },
    transcriptSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 2,
    },
    transcriptHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    transcriptLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#AF52DE',
        letterSpacing: -0.2,
    },
    transcribingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 20,
    },
    transcribingText: {
        fontSize: 15,
        color: '#8E8E93',
    },
    transcriptInput: {
        fontSize: 16,
        color: '#000',
        lineHeight: 24,
        minHeight: 100,
        letterSpacing: -0.2,
    },
    moodSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 2,
    },
    moodLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginBottom: 16,
        letterSpacing: -0.3,
    },
    moodOptions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    moodOption: {
        alignItems: 'center',
        padding: 12,
        borderRadius: 16,
        minWidth: 56,
    },
    moodOptionSelected: {
        backgroundColor: 'rgba(175, 82, 222, 0.1)',
    },
    moodEmoji: {
        fontSize: 28,
        marginBottom: 6,
    },
    moodText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#8E8E93',
    },
    moodTextSelected: {
        color: '#AF52DE',
    },
});
