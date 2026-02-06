import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React, { useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSupplements } from '@/contexts/SupplementContext';
import type { Supplement } from '@/types/supplement';

export default function AddSupplementScreen() {
    const router = useRouter();
    const { addSupplement } = useSupplements();

    const [name, setName] = useState('');
    const [selectedEmoji, setSelectedEmoji] = useState<string>('💊');
    const [frequency, setFrequency] = useState<Supplement['frequency']>('daily');

    const handleSave = async () => {
        if (name.trim()) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await addSupplement(
                name.trim(),
                selectedEmoji,
                undefined,
                frequency,
                undefined
            );
            router.back();
        }
    };

    const EMOJIS = ['💊', '💉', '🩹', '🧴', '🥛', '🧪', '🌿', '⚗️', '🧘', '✨', '⚡'];

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
                <Text style={styles.headerTitle}>Add Habit</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
            >
                <LinearGradient
                    colors={['#E0F2F1', '#B2DFDB']}
                    style={styles.heroCard}
                >
                    <View style={styles.mainEmojiContainer}>
                        <Text style={styles.mainEmoji}>{selectedEmoji}</Text>
                    </View>
                    <TextInput
                        style={styles.heroInput}
                        placeholder="Name..."
                        placeholderTextColor="rgba(0,0,0,0.3)"
                        value={name}
                        onChangeText={setName}
                        textAlign="center"
                    />
                </LinearGradient>

                <View style={styles.pickerSection}>
                    <Text style={styles.sectionTitle}>Choose Icon</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.emojiList}>
                        {EMOJIS.map(emoji => (
                            <Pressable
                                key={emoji}
                                style={[
                                    styles.emojiItem,
                                    selectedEmoji === emoji && styles.emojiItemActive
                                ]}
                                onPress={() => setSelectedEmoji(emoji)}
                            >
                                <Text style={styles.emojiItemText}>{emoji}</Text>
                            </Pressable>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.pickerSection}>
                    <Text style={styles.sectionTitle}>How Often?</Text>
                    <View style={styles.tagContainer}>
                        {['Daily', 'Twice Daily', 'Weekly', 'As Needed'].map(opt => {
                            const val = opt.toLowerCase().replace(' ', '_') as any;
                            const active = frequency === val;
                            return (
                                <Pressable
                                    key={opt}
                                    style={[
                                        styles.tag,
                                        active && styles.tagActive
                                    ]}
                                    onPress={() => setFrequency(val)}
                                >
                                    <Text style={[styles.tagText, active && styles.tagTextActive]}>{opt}</Text>
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
    mainEmoji: {
        fontSize: 60,
    },
    heroInput: {
        fontSize: 28,
        fontWeight: '800',
        color: '#004D40',
        width: '100%',
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
    emojiList: {
        paddingRight: 20,
        gap: 12,
    },
    emojiItem: {
        width: 60,
        height: 60,
        borderRadius: 20,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    emojiItemActive: {
        borderColor: '#004D40',
        backgroundColor: '#E0F2F1',
    },
    emojiItemText: {
        fontSize: 30,
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
        backgroundColor: '#004D40',
        borderColor: '#004D40',
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
});
