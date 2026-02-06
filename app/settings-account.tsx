import { useRouter } from 'expo-router';
import { ArrowLeft, Download, Trash2, RotateCcw } from 'lucide-react-native';
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Alert,
    Share as RNShare,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

import { useOnboarding } from '@/contexts/OnboardingContext';
import { AmbientBackground } from '@/components/AmbientBackground';

function InfoRow({ label, value, isLast }: { label: string; value: string; isLast?: boolean }) {
    return (
        <View style={[styles.infoRow, !isLast && styles.infoRowBorder]}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value}</Text>
        </View>
    );
}

function ActionRow({ icon, title, onPress, danger, isLast }: {
    icon: React.ReactNode;
    title: string;
    onPress: () => void;
    danger?: boolean;
    isLast?: boolean;
}) {
    return (
        <Pressable
            style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed, !isLast && styles.infoRowBorder]}
            onPress={() => { Haptics.selectionAsync(); onPress(); }}
        >
            <View style={styles.actionIcon}>{icon}</View>
            <Text style={[styles.actionTitle, danger && styles.dangerText]}>{title}</Text>
        </Pressable>
    );
}

function formatFeeling(feeling: string | null): string {
    if (!feeling) return 'Not set';
    return feeling.charAt(0).toUpperCase() + feeling.slice(1);
}

function formatLosesDayAt(value: string | null): string {
    if (!value) return 'Not set';
    const map: Record<string, string> = {
        morning: 'Morning',
        afternoon: 'Afternoon',
        evening: 'Evening',
        sleep: 'At bedtime',
    };
    return map[value] ?? value;
}

export default function SettingsAccountScreen() {
    const router = useRouter();
    const { state, resetOnboarding } = useOnboarding();
    const { responses } = state;

    const handleExportData = async () => {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const entries = await AsyncStorage.multiGet(keys);
            const data: Record<string, unknown> = {};
            for (const [key, value] of entries) {
                try {
                    data[key] = value ? JSON.parse(value) : null;
                } catch {
                    data[key] = value;
                }
            }
            const json = JSON.stringify(data, null, 2);
            await RNShare.share({ message: json, title: 'Daily App Data Export' });
        } catch (error) {
            console.log('Error exporting data:', error);
        }
    };

    const handleClearData = () => {
        Alert.alert(
            'Clear All Data',
            'This will permanently delete all your habits, todos, supplements, and settings. This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear Everything',
                    style: 'destructive',
                    onPress: async () => {
                        await AsyncStorage.clear();
                        await resetOnboarding();
                        router.replace('/(onboarding)/get-started');
                    },
                },
            ]
        );
    };

    const handleRedoOnboarding = () => {
        Alert.alert(
            'Redo Onboarding',
            'This will take you back through the onboarding flow. Your data will be preserved.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Continue',
                    onPress: async () => {
                        await resetOnboarding();
                        router.replace('/(onboarding)/get-started');
                    },
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
                    <Text style={styles.headerTitle}>Account</Text>
                    <View style={{ width: 36 }} />
                </View>

                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <Text style={styles.sectionLabel}>PROFILE</Text>
                    <View style={styles.section}>
                        <InfoRow label="Notifications" value={responses.notificationsEnabled ? 'Enabled' : 'Disabled'} />
                        <InfoRow label="Loses day at" value={formatLosesDayAt(responses.losesDayAt)} />
                        <InfoRow label="Feeling" value={formatFeeling(responses.currentFeeling)} />
                        <InfoRow label="Today's win" value={responses.todayWin || 'Not set'} isLast />
                    </View>

                    <Text style={styles.sectionLabel}>DATA</Text>
                    <View style={styles.section}>
                        <ActionRow
                            icon={<Download size={20} color="#000" strokeWidth={2} />}
                            title="Export Data"
                            onPress={handleExportData}
                        />
                        <ActionRow
                            icon={<RotateCcw size={20} color="#000" strokeWidth={2} />}
                            title="Redo Onboarding"
                            onPress={handleRedoOnboarding}
                        />
                        <ActionRow
                            icon={<Trash2 size={20} color="#FF3B30" strokeWidth={2} />}
                            title="Clear All Data"
                            onPress={handleClearData}
                            danger
                            isLast
                        />
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
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
        marginHorizontal: 24, marginBottom: 6, marginTop: 16,
        letterSpacing: 0.5,
    },
    section: {
        marginHorizontal: 16,
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 16,
        overflow: 'hidden',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    infoRowBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(60,60,67,0.1)',
    },
    infoLabel: { fontSize: 16, color: '#000', fontWeight: '400' },
    infoValue: { fontSize: 16, color: '#8E8E93', fontWeight: '400', maxWidth: '60%', textAlign: 'right' },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    actionRowPressed: { backgroundColor: 'rgba(0,0,0,0.05)' },
    actionIcon: { width: 30, marginRight: 8 },
    actionTitle: { fontSize: 16, color: '#000', fontWeight: '400' },
    dangerText: { color: '#FF3B30' },
});
