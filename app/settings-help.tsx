import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronDown, ChevronUp, Star, Mail, Shield } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Linking,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as StoreReview from 'expo-store-review';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';

import { AmbientBackground } from '@/components/AmbientBackground';

const FAQ_ITEMS = [
    {
        question: 'How do I create a new habit?',
        answer: 'Tap the + button on the habits screen to add a new habit. You can set a name, emoji, schedule, and preferred time.',
    },
    {
        question: 'How are streaks calculated?',
        answer: 'Streaks count consecutive days where you completed a habit. If a habit is scheduled for specific days, only those days count. Missing a scheduled day breaks the streak.',
    },
    {
        question: 'Where is my data stored?',
        answer: 'All your data is stored locally on your device. Nothing is sent to any server. This means your data is private but also means it won\'t transfer if you switch devices (cloud sync coming soon).',
    },
    {
        question: 'Can I track habits on specific days?',
        answer: 'Yes! When creating or editing a habit, you can select which days of the week it should be tracked. Leave all days unchecked to track every day.',
    },
    {
        question: 'How do notifications work?',
        answer: 'You can enable reminders for individual habits and supplements. Go to Settings > Notifications to manage your daily reminder and toggle habit/supplement notifications.',
    },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <Pressable
            style={styles.faqItem}
            onPress={() => { Haptics.selectionAsync(); setExpanded(!expanded); }}
        >
            <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{question}</Text>
                {expanded
                    ? <ChevronUp size={18} color="#8E8E93" strokeWidth={2} />
                    : <ChevronDown size={18} color="#8E8E93" strokeWidth={2} />
                }
            </View>
            {expanded && <Text style={styles.faqAnswer}>{answer}</Text>}
        </Pressable>
    );
}

export default function SettingsHelpScreen() {
    const router = useRouter();

    const handleRateApp = async () => {
        try {
            const isAvailable = await StoreReview.isAvailableAsync();
            if (isAvailable) {
                await StoreReview.requestReview();
            } else {
                const url = Platform.OS === 'ios'
                    ? 'https://apps.apple.com/app/id6740611817?action=write-review'
                    : 'market://details?id=app.rork.daily-habit-tracker-t8o4w6l';
                await Linking.openURL(url);
            }
        } catch (error) {
            console.log('Error requesting review:', error);
            Linking.openURL('https://apps.apple.com/app/id6740611817?action=write-review');
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
                    <Text style={styles.headerTitle}>Help</Text>
                    <View style={{ width: 36 }} />
                </View>

                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <Text style={styles.sectionLabel}>FREQUENTLY ASKED QUESTIONS</Text>
                    <View style={styles.section}>
                        {FAQ_ITEMS.map((item, index) => (
                            <View key={index}>
                                <FAQItem question={item.question} answer={item.answer} />
                                {index < FAQ_ITEMS.length - 1 && <View style={styles.separator} />}
                            </View>
                        ))}
                    </View>

                    <Text style={styles.sectionLabel}>LINKS</Text>
                    <View style={styles.section}>
                        <Pressable
                            style={({ pressed }) => [styles.linkRow, pressed && styles.linkRowPressed]}
                            onPress={() => router.push('/privacy-policy')}
                        >
                            <View style={styles.linkIcon}>
                                <Shield size={20} color="#000" strokeWidth={2} />
                            </View>
                            <Text style={styles.linkTitle}>Privacy Policy</Text>
                        </Pressable>
                        <View style={styles.separator} />
                        <Pressable
                            style={({ pressed }) => [styles.linkRow, pressed && styles.linkRowPressed]}
                            onPress={handleRateApp}
                        >
                            <View style={styles.linkIcon}>
                                <Star size={20} color="#000" strokeWidth={2} />
                            </View>
                            <Text style={styles.linkTitle}>Rate the App</Text>
                        </Pressable>
                        <View style={styles.separator} />
                        <Pressable
                            style={({ pressed }) => [styles.linkRow, pressed && styles.linkRowPressed]}
                            onPress={() => Linking.openURL('mailto:support@trydailyapp.com')}
                        >
                            <View style={styles.linkIcon}>
                                <Mail size={20} color="#000" strokeWidth={2} />
                            </View>
                            <Text style={styles.linkTitle}>Contact Support</Text>
                        </Pressable>
                    </View>

                    <Text style={styles.sectionLabel}>APP INFO</Text>
                    <View style={styles.section}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Version</Text>
                            <Text style={styles.infoValue}>{Constants.expoConfig?.version ?? '1.0.0'}</Text>
                        </View>
                        <View style={styles.separator} />
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Build</Text>
                            <Text style={styles.infoValue}>
                                {(Constants.expoConfig?.ios?.buildNumber) ?? (Constants.expoConfig?.android?.versionCode?.toString()) ?? '1'}
                            </Text>
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
    faqItem: { paddingVertical: 14, paddingHorizontal: 16 },
    faqHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    faqQuestion: { fontSize: 16, fontWeight: '500', color: '#000', flex: 1, marginRight: 8 },
    faqAnswer: { fontSize: 14, color: '#8E8E93', marginTop: 10, lineHeight: 20 },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: 'rgba(60,60,67,0.1)',
        marginLeft: 16,
    },
    linkRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 14, paddingHorizontal: 16,
    },
    linkRowPressed: { backgroundColor: 'rgba(0,0,0,0.05)' },
    linkIcon: { width: 30, marginRight: 10 },
    linkTitle: { fontSize: 16, fontWeight: '400', color: '#000' },
    infoRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: 14, paddingHorizontal: 16,
    },
    infoLabel: { fontSize: 16, color: '#000' },
    infoValue: { fontSize: 16, color: '#8E8E93' },
});
