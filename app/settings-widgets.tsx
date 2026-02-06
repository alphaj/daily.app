import { useRouter } from 'expo-router';
import { ArrowLeft, Puzzle, Activity, Droplets, Target } from 'lucide-react-native';
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AmbientBackground } from '@/components/AmbientBackground';

const WIDGETS = [
    { icon: Target, title: 'Habit Streak', description: 'See your current streak at a glance' },
    { icon: Droplets, title: 'Water Tracker', description: 'Track your daily water intake' },
    { icon: Activity, title: 'Daily Progress', description: 'View your overall daily completion' },
];

export default function SettingsWidgetsScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <AmbientBackground />
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.header}>
                    <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={20}>
                        <ArrowLeft size={20} color="#000" strokeWidth={2.5} />
                    </Pressable>
                    <Text style={styles.headerTitle}>Widgets</Text>
                    <View style={{ width: 36 }} />
                </View>

                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.heroSection}>
                        <View style={styles.iconCircle}>
                            <Puzzle size={32} color="#000" strokeWidth={2} />
                        </View>
                        <Text style={styles.heroTitle}>Widgets</Text>
                        <Text style={styles.heroSubtitle}>Coming Soon</Text>
                        <Text style={styles.heroDescription}>
                            Add Daily widgets to your home screen for quick access to your habits and progress.
                        </Text>
                    </View>

                    <Text style={styles.sectionLabel}>PLANNED WIDGETS</Text>
                    <View style={styles.section}>
                        {WIDGETS.map((widget, index) => (
                            <View key={widget.title} style={[styles.featureRow, index < WIDGETS.length - 1 && styles.featureRowBorder]}>
                                <View style={styles.featureIcon}>
                                    <widget.icon size={20} color="#000" strokeWidth={2} />
                                </View>
                                <View style={styles.featureContent}>
                                    <Text style={styles.featureTitle}>{widget.title}</Text>
                                    <Text style={styles.featureDescription}>{widget.description}</Text>
                                </View>
                            </View>
                        ))}
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
    heroSection: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24 },
    iconCircle: {
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: 'rgba(255,255,255,0.8)',
        alignItems: 'center', justifyContent: 'center', marginBottom: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8,
    },
    heroTitle: { fontSize: 24, fontWeight: '700', color: '#000', marginBottom: 4 },
    heroSubtitle: { fontSize: 15, fontWeight: '600', color: '#8E8E93', marginBottom: 12 },
    heroDescription: { fontSize: 15, color: '#8E8E93', textAlign: 'center', lineHeight: 22 },
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
    featureRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 14, paddingHorizontal: 16,
    },
    featureRowBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(60,60,67,0.1)',
    },
    featureIcon: { width: 30, marginRight: 10 },
    featureContent: { flex: 1 },
    featureTitle: { fontSize: 16, fontWeight: '500', color: '#000' },
    featureDescription: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
});
