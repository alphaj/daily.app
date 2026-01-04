import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTodos } from '@/contexts/TodoContext';

export default function AddTodoScreen() {
    const router = useRouter();
    const { addTodo } = useTodos();
    const [title, setTitle] = useState('');

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
                    <Pressable style={styles.closeButton} onPress={handleCancel}>
                        <X size={28} color="#000" strokeWidth={2} />
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
    input: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        fontSize: 17,
        color: '#000',
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
});
