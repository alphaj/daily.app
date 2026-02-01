import { useRouter } from 'expo-router';
import {
    ChevronLeft,
    ChevronRight,
    Bell,
    HelpCircle,
    MessageSquare,
    Star,
    Shield,
    LogOut,
    Briefcase,
    Heart,
    CheckCircle2,
    Zap,
} from 'lucide-react-native';
import React, { useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Alert,
    Platform,
    Linking,
    Animated,
} from 'react-native';
import * as StoreReview from 'expo-store-review';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { WorkModeToggle } from '@/components/WorkModeToggle';
import { useTodos } from '@/contexts/TodoContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { BlurView } from 'expo-blur';
import { AmbientBackground } from '@/components/AmbientBackground';

interface MenuItemProps {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showChevron?: boolean;
    danger?: boolean;
    isLast?: boolean;
    value?: string;
}

function MenuItem({
    icon,
    title,
    subtitle,
    onPress,
    showChevron = true,
    danger,
    isLast,
    value
}: MenuItemProps) {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.menuItem,
                pressed && styles.menuItemPressed,
                !isLast && styles.menuItemBorder
            ]}
            onPress={() => {
                Haptics.selectionAsync();
                onPress?.();
            }}
        >
            <View style={styles.menuIconContainer}>
                {icon}
            </View>
            <View style={styles.menuContent}>
                <Text style={[styles.menuTitle, danger && styles.menuTitleDanger]}>
                    {title}
                </Text>
                {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
            </View>
            <View style={styles.menuRight}>
                {value && <Text style={styles.menuValue}>{value}</Text>}
                {showChevron && <ChevronRight size={18} color="#C7C7CC" strokeWidth={2} />}
            </View>
        </Pressable>
    );
}

function MenuSection({ title, children }: { title?: string; children: React.ReactNode }) {
    return (
        <View style={styles.section}>
            {title && <Text style={styles.sectionTitle}>{title}</Text>}
            <View style={styles.sectionContent}>
                {children}
            </View>
        </View>
    );
}

function StatCard({
    label,
    value,
    icon,
    color,
    subLabel
}: {
    label: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
    subLabel?: string;
}) {
    return (
        <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: `${color}15` }]}>
                {icon}
            </View>
            <View style={styles.statTextContainer}>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statLabel}>{label}</Text>
                {subLabel && <Text style={styles.statSubLabel}>{subLabel}</Text>}
            </View>
        </View>
    );
}

export default function MenuScreen() {
    const router = useRouter();
    const { completedCount, workCompletedCount, lifeCompletedCount } = useTodos();
    const { resetOnboarding } = useOnboarding();

    const handleSignOut = () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await AsyncStorage.clear();
                            await resetOnboarding();
                            router.replace('/(onboarding)/get-started');
                        } catch (error) {
                            console.log('Error signing out:', error);
                        }
                    },
                },
            ]
        );
    };

    const handleRateApp = async () => {
        try {
            const isAvailable = await StoreReview.isAvailableAsync();
            if (isAvailable) {
                await StoreReview.requestReview();
            } else {
                const appStoreUrl = Platform.OS === 'ios'
                    ? 'https://apps.apple.com/app/id6740611817?action=write-review'
                    : 'market://details?id=app.rork.daily-habit-tracker-t8o4w6l';
                await Linking.openURL(appStoreUrl);
            }
        } catch (error) {
            console.log('Error requesting review:', error);
            const appStoreUrl = 'https://apps.apple.com/app/id6740611817?action=write-review';
            Linking.openURL(appStoreUrl);
        }
    };

    return (
        <View style={styles.container}>
            <AmbientBackground />
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitleLarge}>Settings</Text>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Dashboard / Stats */}
                    <View style={styles.dashboardContainer}>
                        <View style={styles.dashboardHeader}>
                            <View style={styles.avatarCircle}>
                                <Text style={styles.avatarInitial}>Y</Text>
                            </View>
                            <View style={styles.dashboardHeaderText}>
                                <Text style={styles.dashboardTitle}>Your Journey</Text>
                                <Text style={styles.dashboardSubtitle}>Continuous Progress</Text>
                            </View>
                            <View style={styles.completionBadge}>
                                <Zap size={14} color="#FF9500" fill="#FF9500" />
                                <Text style={styles.completionBadgeText}>{completedCount}</Text>
                            </View>
                        </View>

                        <View style={styles.statsSeparator} />

                        <View style={styles.statsGrid}>
                            <View style={styles.statItem}>
                                <View style={[styles.statIcon, { backgroundColor: '#E0F2FE' }]}>
                                    <Briefcase size={22} color="#0EA5E9" />
                                </View>
                                <View>
                                    <Text style={styles.statNumber}>{workCompletedCount}</Text>
                                    <Text style={styles.statCategory}>Work</Text>
                                </View>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <View style={[styles.statIcon, { backgroundColor: '#FFE4E6' }]}>
                                    <Heart size={22} color="#E11D48" />
                                </View>
                                <View>
                                    <Text style={styles.statNumber}>{lifeCompletedCount}</Text>
                                    <Text style={styles.statCategory}>Life</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Focus Mode */}
                    <View style={styles.focusSection}>
                        <WorkModeToggle />
                    </View>

                    {/* Preferences */}
                    <MenuSection title="PREFERENCES">
                        <MenuItem
                            icon={<View style={[styles.iconBox, { backgroundColor: '#FF9500' }]}><Bell size={18} color="white" strokeWidth={2.5} /></View>}
                            title="Notifications"
                            isLast
                        />
                    </MenuSection>

                    {/* Support */}
                    <MenuSection title="SUPPORT">
                        <MenuItem
                            icon={<View style={[styles.iconBox, { backgroundColor: '#5856D6' }]}><HelpCircle size={18} color="white" strokeWidth={2.5} /></View>}
                            title="Help & FAQ"
                            onPress={() => Linking.openURL('https://trydailyapp.com')}
                        />
                        <MenuItem
                            icon={<View style={[styles.iconBox, { backgroundColor: '#34C759' }]}><MessageSquare size={18} color="white" strokeWidth={2.5} /></View>}
                            title="Contact Us"
                            onPress={() => Linking.openURL('mailto:support@trydailyapp.com?subject=Daily%20App%20Support')}
                        />
                        <MenuItem
                            icon={<View style={[styles.iconBox, { backgroundColor: '#FFCC00' }]}><Star size={18} color="white" strokeWidth={2.5} /></View>}
                            title="Rate the App"
                            onPress={handleRateApp}
                            isLast
                            value={`v${Constants.expoConfig?.version || '1.0.0'}`}
                        />
                    </MenuSection>

                    {/* Legal */}
                    <MenuSection title="LEGAL">
                        <MenuItem
                            icon={<View style={[styles.iconBox, { backgroundColor: '#8E8E93' }]}><Shield size={18} color="white" strokeWidth={2.5} /></View>}
                            title="Privacy Policy"
                            onPress={() => router.push('/privacy-policy')}
                            isLast
                        />
                    </MenuSection>

                    {/* Danger Zone */}
                    <MenuSection>
                        <MenuItem
                            icon={<View style={[styles.iconBox, { backgroundColor: '#FF3B30' }]}><LogOut size={18} color="white" strokeWidth={2.5} /></View>}
                            title="Sign Out"
                            onPress={handleSignOut}
                            danger
                            isLast
                        />
                    </MenuSection>



                    <Text style={styles.footerText}>
                        Designed with ❤️ for us
                    </Text>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 24,
        paddingVertical: 16,
        paddingBottom: 24,
    },
    headerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 10,
    },
    headerButtonPressed: {
        opacity: 0.5,
    },
    headerBackText: {
        fontSize: 17,
        color: '#007AFF',
        marginLeft: -4,
        fontWeight: '400',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000',
    },
    headerTitleLarge: {
        fontSize: 34,
        fontWeight: '700',
        color: '#000',
        letterSpacing: -0.5,
    },
    headerRight: {
        width: 60,
    },
    headerLeft: {
        width: 60,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
        paddingHorizontal: 0, // Cards will have margin
    },
    largeTitle: {
        fontSize: 34,
        fontWeight: '700',
        color: '#000',
        letterSpacing: -1,
        marginLeft: 20,
        marginBottom: 20,
        marginTop: 10,
    },
    dashboardContainer: {
        marginHorizontal: 20,
        marginBottom: 24,
        backgroundColor: '#fff',
        borderRadius: 16, // Refined native border radius
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    dashboardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    avatarInitial: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    dashboardHeaderText: {
        flex: 1,
    },
    dashboardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1C1C1E',
        letterSpacing: -0.4,
    },
    dashboardSubtitle: {
        fontSize: 13,
        color: '#8E8E93',
        fontWeight: '400',
    },
    statsSeparator: {
        height: 1,
        backgroundColor: '#F2F2F7',
        marginBottom: 20,
    },
    completionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF8E6',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 4,
    },
    completionBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FF9500',
    },
    statsGrid: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statDivider: {
        width: 1,
        height: 36,
        backgroundColor: '#F2F2F7',
        marginHorizontal: 20,
    },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statNumber: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1C1C1E',
    },
    statCategory: {
        fontSize: 12,
        color: '#8E8E93',
        fontWeight: '500',
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    statIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statTextContainer: {
        flex: 1,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#000',
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#8E8E93',
    },
    statSubLabel: {
        fontSize: 10,
        color: '#C7C7CC',
        marginTop: 2,
    },
    section: {
        marginBottom: 24,
        marginHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
        marginBottom: 8,
        marginLeft: 16, // Align with the start of the section box
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    sectionContent: {
        backgroundColor: '#fff',
        borderRadius: 12, // Native Inset Grouped radius
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 1,
    },
    focusSection: {
        marginBottom: 32,
        marginHorizontal: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 1,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        minHeight: 48,
    },
    menuItemPressed: {
        backgroundColor: '#F2F2F7',
    },
    menuItemBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#F2F2F7',
        marginLeft: 64, // Exactly align with text start: padding(16) + icon(36) + margin(12)
    },
    menuIconContainer: {
        width: 36,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 0,
    },
    iconBox: {
        width: 28,
        height: 28,
        borderRadius: 7, // Apple style rounded corners
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuContent: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    menuRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    menuTitle: {
        fontSize: 17, // iOS Body size
        fontWeight: '500',
        color: '#1C1C1E',
        letterSpacing: -0.4,
    },
    menuTitleDanger: {
        color: '#FF3B30',
    },
    menuSubtitle: {
        fontSize: 12,
        color: '#8E8E93',
        marginTop: 2,
    },
    menuValue: {
        fontSize: 16,
        color: '#8E8E93',
    },
    footerText: {
        textAlign: 'center',
        color: '#8E8E93',
        fontSize: 13,
        lineHeight: 18,
        marginTop: 24,
        fontWeight: '500',
        opacity: 0.6,
    },
});
