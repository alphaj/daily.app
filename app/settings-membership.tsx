import { useRouter } from 'expo-router';
import { ArrowLeft, Star, Cloud, BarChart3, Palette, Headphones, Lock } from 'lucide-react-native';
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

const FEATURES = [
    { icon: Cloud, title: 'Cloud Sync', description: 'Sync your data across all devices' },
    { icon: BarChart3, title: 'Advanced Analytics', description: 'Deep insights into your habits' },
    { icon: Palette, title: 'Custom Themes', description: 'Personalize your experience' },
    { icon: Headphones, title: 'Priority Support', description: 'Get help when you need it' },
];

export default function SettingsMembershipScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <AmbientBackground />
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.header}>
                    <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={20}>
                        <ArrowLeft size={20} color="#000" strokeWidth={2.5} />
                    </Pressable>
                    <Text style={styles.headerTitle}>Membership</Text>
                    <View style={{ width: 36 }} />
                </View>

                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.heroSection}>
                        <View style={styles.iconCircle}>
                            <Star size={32} color="#000" strokeWidth={2} />
                        </View>
                        <Text style={styles.heroTitle}>Daily Premium</Text>
                        <Text style={styles.heroSubtitle}>Coming Soon</Text>
                        <Text style={styles.heroDescription}>
                            We're building premium features to help you get even more out of Daily.
                        </Text>
                    </View>

                    <Text style={styles.sectionLabel}>PLANNED FEATURES</Text>
                    <View style={styles.section}>
                        {FEATURES.map((feature, index) => (
                            <View key={feature.title} style={[styles.featureRow, index < FEATURES.length - 1 && styles.featureRowBorder]}>
                                <View style={styles.featureIcon}>
                                    <feature.icon size={20} color="#000" strokeWidth={2} />
                                </View>
                                <View style={styles.featureContent}>
                                    <Text style={styles.featureTitle}>{feature.title}</Text>
                                    <Text style={styles.featureDescription}>{feature.description}</Text>
                                </View>
                                <Lock size={16} color="#C7C7CC" strokeWidth={2} />
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
    heroSection: {
        alignItems: 'center',
        paddingVertical: 32,
        paddingHorizontal: 24,
    },
    iconCircle: {
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: 'rgba(255,255,255,0.8)',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
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
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
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
