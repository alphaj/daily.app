import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, BellOff } from 'lucide-react-native';
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Switch,
    Linking,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';

import { AmbientBackground } from '@/components/AmbientBackground';
import { usePreferences } from '@/contexts/PreferencesContext';
import { scheduleDailyReminder, cancelDailyReminder } from '@/lib/notifications';

export default function SettingsNotificationsScreen() {
    const router = useRouter();
    const { preferences, updatePreferences } = usePreferences();
    const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
    const [showTimePicker, setShowTimePicker] = useState(false);

    const checkPermissions = useCallback(async () => {
        if (Platform.OS === 'web') return;
        const { status } = await Notifications.getPermissionsAsync();
        setPermissionStatus(status as 'granted' | 'denied' | 'undetermined');
    }, []);

    useEffect(() => {
        checkPermissions();
    }, [checkPermissions]);

    const timeDate = (() => {
        const [h, m] = preferences.dailyReminderTime.split(':').map(Number);
        const d = new Date();
        d.setHours(h, m, 0, 0);
        return d;
    })();

    const formatTime = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        const d = new Date();
        d.setHours(h, m);
        return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    };

    const handleDailyReminderToggle = async (enabled: boolean) => {
        Haptics.selectionAsync();
        if (enabled) {
            if (permissionStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                setPermissionStatus(status as 'granted' | 'denied' | 'undetermined');
                if (status !== 'granted') return;
            }
            const notifId = await scheduleDailyReminder(preferences.dailyReminderTime);
            await updatePreferences({ dailyReminderEnabled: true });
        } else {
            await cancelDailyReminder();
            await updatePreferences({ dailyReminderEnabled: false });
        }
    };

    const handleTimeChange = async (_: unknown, date?: Date) => {
        setShowTimePicker(false);
        if (!date) return;
        const h = String(date.getHours()).padStart(2, '0');
        const m = String(date.getMinutes()).padStart(2, '0');
        const timeStr = `${h}:${m}`;
        await updatePreferences({ dailyReminderTime: timeStr });
        if (preferences.dailyReminderEnabled) {
            await cancelDailyReminder();
            await scheduleDailyReminder(timeStr);
        }
    };

    return (
        <View style={styles.container}>
            <AmbientBackground />
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.header}>
                    <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={20}>
                        <ArrowLeft size={20} color="#000" strokeWidth={2.5} />
                    </Pressable>
                    <Text style={styles.headerTitle}>Notifications</Text>
                    <View style={{ width: 36 }} />
                </View>

                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {permissionStatus === 'denied' && (
                        <Pressable
                            style={styles.permissionBanner}
                            onPress={() => Linking.openSettings()}
                        >
                            <BellOff size={20} color="#FF3B30" strokeWidth={2} />
                            <View style={styles.bannerContent}>
                                <Text style={styles.bannerTitle}>Notifications Disabled</Text>
                                <Text style={styles.bannerSubtitle}>Tap to enable in Settings</Text>
                            </View>
                        </Pressable>
                    )}

                    <Text style={styles.sectionLabel}>DAILY REMINDER</Text>
                    <View style={styles.section}>
                        <View style={styles.toggleRow}>
                            <View style={styles.toggleContent}>
                                <Text style={styles.toggleTitle}>Daily Reminder</Text>
                                <Text style={styles.toggleSubtitle}>Get a daily nudge to check in</Text>
                            </View>
                            <Switch
                                value={preferences.dailyReminderEnabled}
                                onValueChange={handleDailyReminderToggle}
                                trackColor={{ false: '#E5E5EA', true: '#000' }}
                                thumbColor="#fff"
                            />
                        </View>
                        {preferences.dailyReminderEnabled && (
                            <Pressable
                                style={[styles.toggleRow, styles.toggleRowBorder]}
                                onPress={() => setShowTimePicker(true)}
                            >
                                <Text style={styles.toggleTitle}>Reminder Time</Text>
                                <Text style={styles.timeValue}>{formatTime(preferences.dailyReminderTime)}</Text>
                            </Pressable>
                        )}
                    </View>

                    {showTimePicker && (
                        <DateTimePicker
                            value={timeDate}
                            mode="time"
                            display="spinner"
                            onChange={handleTimeChange}
                        />
                    )}

                    <Text style={styles.sectionLabel}>REMINDERS</Text>
                    <View style={styles.section}>
                        <View style={styles.toggleRow}>
                            <View style={styles.toggleContent}>
                                <Text style={styles.toggleTitle}>Habit Reminders</Text>
                                <Text style={styles.toggleSubtitle}>Reminders for individual habits</Text>
                            </View>
                            <Switch
                                value={preferences.habitRemindersEnabled}
                                onValueChange={(v) => {
                                    Haptics.selectionAsync();
                                    updatePreferences({ habitRemindersEnabled: v });
                                }}
                                trackColor={{ false: '#E5E5EA', true: '#000' }}
                                thumbColor="#fff"
                            />
                        </View>
                        <View style={[styles.toggleRow, styles.toggleRowBorder]}>
                            <View style={styles.toggleContent}>
                                <Text style={styles.toggleTitle}>Supplement Reminders</Text>
                                <Text style={styles.toggleSubtitle}>Reminders for supplements</Text>
                            </View>
                            <Switch
                                value={preferences.supplementRemindersEnabled}
                                onValueChange={(v) => {
                                    Haptics.selectionAsync();
                                    updatePreferences({ supplementRemindersEnabled: v });
                                }}
                                trackColor={{ false: '#E5E5EA', true: '#000' }}
                                thumbColor="#fff"
                            />
                        </View>
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
    permissionBanner: {
        marginHorizontal: 16,
        backgroundColor: 'rgba(255,59,48,0.08)',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    bannerContent: { flex: 1 },
    bannerTitle: { fontSize: 15, fontWeight: '600', color: '#FF3B30' },
    bannerSubtitle: { fontSize: 13, color: '#FF3B30', marginTop: 2 },
    sectionLabel: {
        fontSize: 13, fontWeight: '500', color: 'rgba(60,60,67,0.6)',
        marginHorizontal: 24, marginBottom: 6, marginTop: 16, letterSpacing: 0.5,
    },
    section: {
        marginHorizontal: 16,
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 16,
        overflow: 'hidden',
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    toggleRowBorder: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(60,60,67,0.1)',
    },
    toggleContent: { flex: 1, marginRight: 12 },
    toggleTitle: { fontSize: 16, fontWeight: '500', color: '#000' },
    toggleSubtitle: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
    timeValue: { fontSize: 16, color: '#8E8E93', fontWeight: '400' },
});
