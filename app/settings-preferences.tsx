import { useRouter } from 'expo-router';
import { ArrowLeft, Check } from 'lucide-react-native';
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Switch,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { AmbientBackground } from '@/components/AmbientBackground';
import { usePreferences } from '@/contexts/PreferencesContext';
import type { UserPreferences } from '@/types/preferences';

function SelectRow({ title, selected, onPress, isLast }: {
    title: string;
    selected: boolean;
    onPress: () => void;
    isLast?: boolean;
}) {
    return (
        <Pressable
            style={({ pressed }) => [styles.selectRow, pressed && styles.selectRowPressed, !isLast && styles.rowBorder]}
            onPress={() => { Haptics.selectionAsync(); onPress(); }}
        >
            <Text style={styles.selectTitle}>{title}</Text>
            {selected && <Check size={18} color="#000" strokeWidth={2.5} />}
        </Pressable>
    );
}

export default function SettingsPreferencesScreen() {
    const router = useRouter();
    const { preferences, updatePreferences, resetPreferences } = usePreferences();

    const handleReset = () => {
        Alert.alert(
            'Reset Preferences',
            'This will reset all preferences to their default values.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: () => resetPreferences(),
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <AmbientBackground />
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.header}>
                    <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={20}>
                        <ArrowLeft size={20} color="#000" strokeWidth={2.5} />
                    </Pressable>
                    <Text style={styles.headerTitle}>Preferences</Text>
                    <View style={{ width: 36 }} />
                </View>

                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <Text style={styles.sectionLabel}>APPEARANCE</Text>
                    <View style={styles.section}>
                        <SelectRow
                            title="Auto"
                            selected={preferences.theme === 'auto'}
                            onPress={() => updatePreferences({ theme: 'auto' })}
                        />
                        <SelectRow
                            title="Light"
                            selected={preferences.theme === 'light'}
                            onPress={() => updatePreferences({ theme: 'light' })}
                        />
                        <SelectRow
                            title="Dark"
                            selected={preferences.theme === 'dark'}
                            onPress={() => updatePreferences({ theme: 'dark' })}
                            isLast
                        />
                    </View>
                    <Text style={styles.sectionNote}>Theme support coming soon. Your selection will be saved.</Text>

                    <Text style={styles.sectionLabel}>INTERACTION</Text>
                    <View style={styles.section}>
                        <View style={styles.toggleRow}>
                            <Text style={styles.toggleTitle}>Haptic Feedback</Text>
                            <Switch
                                value={preferences.hapticsEnabled}
                                onValueChange={(v) => {
                                    Haptics.selectionAsync();
                                    updatePreferences({ hapticsEnabled: v });
                                }}
                                trackColor={{ false: '#E5E5EA', true: '#000' }}
                                thumbColor="#fff"
                            />
                        </View>
                    </View>

                    <Text style={styles.sectionLabel}>TIME & CALENDAR</Text>
                    <View style={styles.section}>
                        <Text style={styles.groupLabel}>Start of Week</Text>
                        <SelectRow
                            title="Sunday"
                            selected={preferences.startOfWeek === 'sunday'}
                            onPress={() => updatePreferences({ startOfWeek: 'sunday' })}
                        />
                        <SelectRow
                            title="Monday"
                            selected={preferences.startOfWeek === 'monday'}
                            onPress={() => updatePreferences({ startOfWeek: 'monday' })}
                            isLast
                        />
                    </View>
                    <View style={[styles.section, { marginTop: 12 }]}>
                        <Text style={styles.groupLabel}>Time Format</Text>
                        <SelectRow
                            title="12-hour"
                            selected={preferences.timeFormat === '12h'}
                            onPress={() => updatePreferences({ timeFormat: '12h' })}
                        />
                        <SelectRow
                            title="24-hour"
                            selected={preferences.timeFormat === '24h'}
                            onPress={() => updatePreferences({ timeFormat: '24h' })}
                            isLast
                        />
                    </View>

                    <Text style={styles.sectionLabel}>DATA</Text>
                    <View style={styles.section}>
                        <Pressable
                            style={({ pressed }) => [styles.dangerRow, pressed && styles.selectRowPressed]}
                            onPress={handleReset}
                        >
                            <Text style={styles.dangerText}>Reset Preferences</Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    header: {
        paddingHorizontal: 16, paddingVertical: 12,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    backButton: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.8)',
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
    },
    headerTitle: {
        fontSize: 17, fontWeight: '600', color: '#000',
        position: 'absolute', left: 0, right: 0, textAlign: 'center', zIndex: -1,
    },
    scrollView: { flex: 1 },
    scrollContent: { paddingTop: 24, paddingBottom: 40, gap: 8 },
    sectionLabel: {
        fontSize: 13, fontWeight: '500', color: 'rgba(60,60,67,0.6)',
        marginHorizontal: 24, marginBottom: 6, marginTop: 16, letterSpacing: 0.5,
    },
    sectionNote: {
        fontSize: 13, color: 'rgba(60,60,67,0.4)',
        marginHorizontal: 24, marginTop: 6,
    },
    section: {
        marginHorizontal: 16,
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 16,
        overflow: 'hidden',
    },
    groupLabel: {
        fontSize: 13, fontWeight: '500', color: 'rgba(60,60,67,0.6)',
        paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4,
    },
    selectRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    selectRowPressed: { backgroundColor: 'rgba(0,0,0,0.05)' },
    rowBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(60,60,67,0.1)',
    },
    selectTitle: { fontSize: 16, fontWeight: '400', color: '#000' },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    toggleTitle: { fontSize: 16, fontWeight: '500', color: '#000' },
    dangerRow: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    dangerText: { fontSize: 16, fontWeight: '500', color: '#FF3B30' },
});
