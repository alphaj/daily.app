import { useRouter } from 'expo-router';
import { ArrowLeft, Calendar, X } from 'lucide-react-native';
import React, { useState, useCallback } from 'react';
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
import { useProjects } from '@/contexts/ProjectContext';
import { PROJECT_COLORS, PROJECT_ICONS } from '@/types/project';
import DatePickerWrapper from '@/components/DatePickerWrapper';

export default function AddProjectScreen() {
    const router = useRouter();
    const { addProject } = useProjects();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedColor, setSelectedColor] = useState<string>(PROJECT_COLORS[0]);
    const [selectedIcon, setSelectedIcon] = useState<string>(PROJECT_ICONS[0]);
    const [type, setType] = useState<'project' | 'goal'>('project');
    const [deadline, setDeadline] = useState<Date | undefined>(undefined);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [hasDeadline, setHasDeadline] = useState(false);

    const handleClose = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    }, [router]);

    const handleCreate = useCallback(async () => {
        if (!name.trim()) return;

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const projectId = await addProject(
            name.trim(),
            description.trim(),
            selectedColor,
            selectedIcon,
            type,
            deadline?.toISOString(),
            false
        );
        router.replace(`/project/${projectId}` as const);
    }, [name, description, selectedColor, selectedIcon, type, deadline, addProject, router]);

    const handleColorSelect = (color: string) => {
        Haptics.selectionAsync();
        setSelectedColor(color);
    };

    const handleIconSelect = (icon: string) => {
        Haptics.selectionAsync();
        setSelectedIcon(icon);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
            <View style={styles.header}>
                <Pressable onPress={handleClose} style={styles.iconBtn}>
                    <ArrowLeft size={24} color="#000" />
                </Pressable>
                <Text style={styles.headerTitle}>
                    {type === 'project' ? 'New Project' : 'New Goal'}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
            >
                <LinearGradient
                    colors={['#F3E5F5', '#E1BEE7']}
                    style={styles.heroCard}
                >
                    <View style={styles.mainEmojiContainer}>
                        <Text style={styles.heroEmoji}>{selectedIcon}</Text>
                    </View>
                    <TextInput
                        style={styles.heroInput}
                        placeholder={type === 'goal' ? 'Goal Name...' : 'Project Name...'}
                        placeholderTextColor="rgba(74,20,140,0.3)"
                        value={name}
                        onChangeText={setName}
                        textAlign="center"
                        autoFocus
                    />
                </LinearGradient>

                {/* Type */}
                <View style={styles.pickerSection}>
                    <Text style={styles.sectionTitle}>Type</Text>
                    <View style={styles.tagContainer}>
                        {(['Project', 'Goal'] as const).map((opt) => {
                            const val = opt.toLowerCase() as 'project' | 'goal';
                            const active = type === val;
                            return (
                                <Pressable
                                    key={opt}
                                    style={[styles.tag, active && styles.tagActive]}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setType(val);
                                    }}
                                >
                                    <Text style={[styles.tagText, active && styles.tagTextActive]}>
                                        {opt}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                {/* Description */}
                <View style={styles.pickerSection}>
                    <Text style={styles.sectionTitle}>Description</Text>
                    <View style={styles.descriptionCard}>
                        <TextInput
                            style={styles.descriptionInput}
                            placeholder={
                                type === 'goal'
                                    ? 'Brief description of your goal...'
                                    : 'Brief description of your project...'
                            }
                            placeholderTextColor="#C7C7CC"
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            maxLength={100}
                        />
                    </View>
                </View>

                {/* Icon */}
                <View style={styles.pickerSection}>
                    <Text style={styles.sectionTitle}>Icon</Text>
                    <View style={styles.iconGrid}>
                        {PROJECT_ICONS.map((icon) => (
                            <Pressable
                                key={icon}
                                style={[
                                    styles.iconOption,
                                    selectedIcon === icon && styles.iconOptionSelected,
                                ]}
                                onPress={() => handleIconSelect(icon)}
                            >
                                <Text style={styles.iconText}>{icon}</Text>
                            </Pressable>
                        ))}
                    </View>
                </View>

                {/* Color */}
                <View style={styles.pickerSection}>
                    <Text style={styles.sectionTitle}>Color</Text>
                    <View style={styles.colorGrid}>
                        {PROJECT_COLORS.map((color) => (
                            <Pressable
                                key={color}
                                style={[
                                    styles.colorDot,
                                    { backgroundColor: color },
                                    selectedColor === color && styles.colorDotSelected,
                                ]}
                                onPress={() => handleColorSelect(color)}
                            />
                        ))}
                    </View>
                </View>

                {/* Target Date - Only for Goals */}
                {type === 'goal' && (
                    <View style={styles.pickerSection}>
                        <Text style={styles.sectionTitle}>Target Date</Text>
                        {!hasDeadline ? (
                            <Pressable
                                style={styles.tag}
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    setHasDeadline(true);
                                    setDeadline(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
                                }}
                            >
                                <View style={styles.deadlineTagInner}>
                                    <Calendar size={16} color="#555" />
                                    <Text style={styles.tagText}>Add end date</Text>
                                </View>
                            </Pressable>
                        ) : (
                            <View style={styles.deadlineContainer}>
                                <View style={styles.deadlineHeader}>
                                    <View style={styles.deadlineLabel}>
                                        <Calendar size={18} color="#4A148C" />
                                        <Text style={styles.deadlineLabelText}>Due by</Text>
                                    </View>
                                    <Pressable
                                        style={styles.removeDeadlineButton}
                                        onPress={() => {
                                            Haptics.selectionAsync();
                                            setHasDeadline(false);
                                            setDeadline(undefined);
                                        }}
                                        hitSlop={8}
                                    >
                                        <X size={18} color="#8E8E93" />
                                    </Pressable>
                                </View>
                                <DatePickerWrapper
                                    value={deadline || new Date()}
                                    onChange={(date) => setDeadline(date)}
                                    minimumDate={new Date()}
                                    show={showDatePicker}
                                    onClose={() => setShowDatePicker(false)}
                                />
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
            </KeyboardAvoidingView>

            <View style={styles.footer}>
                <Pressable
                    style={styles.bigButton}
                    onPress={handleCreate}
                >
                    <Text style={styles.bigButtonText}>Create</Text>
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
    heroEmoji: {
        fontSize: 48,
    },
    heroInput: {
        fontSize: 28,
        fontWeight: '800',
        color: '#4A148C',
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
        backgroundColor: '#4A148C',
        borderColor: '#4A148C',
    },
    tagText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#555',
    },
    tagTextActive: {
        color: '#fff',
    },
    descriptionCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    descriptionInput: {
        fontSize: 16,
        color: '#333',
        minHeight: 80,
        textAlignVertical: 'top',
    },
    iconGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    iconOption: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    iconOptionSelected: {
        borderColor: '#4A148C',
        transform: [{ scale: 1.08 }],
    },
    iconText: {
        fontSize: 24,
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    colorDot: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 3,
        borderColor: 'transparent',
    },
    colorDotSelected: {
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    deadlineTagInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    deadlineContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
        overflow: 'hidden',
    },
    deadlineHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 4,
    },
    deadlineLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    deadlineLabelText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#4A148C',
    },
    removeDeadlineButton: {
        padding: 4,
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
