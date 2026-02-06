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
    Activity,
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

import { useTodos } from '@/contexts/TodoContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { BlurView } from 'expo-blur';
import { AmbientBackground } from '@/components/AmbientBackground';
import { BottomNavBar } from '@/components/BottomNavBar';

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


export default function MenuScreen() {
    const router = useRouter();
    const { completedCount } = useTodos();
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
                    {/* Dashboard / Journey Card */}
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
                                <Text style={styles.completionBadgeEmoji}>🔥</Text>
                                <Text style={styles.completionBadgeText}>{completedCount}</Text>
                            </View>
                        </View>
                    </View>



                    {/* Preferences */}
                    <MenuSection title="PREFERENCES">
                        <MenuItem
                            icon={<View style={[styles.iconBox, { backgroundColor: '#FF9500' }]}><Bell size={19} color="white" strokeWidth={2.5} /></View>}
                            title="Notifications"
                        />
                        <MenuItem
                            icon={<View style={[styles.iconBox, { backgroundColor: '#FF3B30' }]}><Activity size={19} color="white" strokeWidth={2.5} /></View>}
                            title="Apple Health"
                            subtitle="Steps, calories, sleep"
                            onPress={() => router.push('/health')}
                            isLast
                        />
                    </MenuSection>

                    {/* Support */}
                    <MenuSection title="SUPPORT">
                        <MenuItem
                            icon={<View style={[styles.iconBox, { backgroundColor: '#5856D6' }]}><HelpCircle size={19} color="white" strokeWidth={2.5} /></View>}
                            title="Help & FAQ"
                            onPress={() => Linking.openURL('https://trydailyapp.com')}
                        />
                        <MenuItem
                            icon={<View style={[styles.iconBox, { backgroundColor: '#34C759' }]}><MessageSquare size={19} color="white" strokeWidth={2.5} /></View>}
                            title="Contact Us"
                            onPress={() => Linking.openURL('mailto:support@trydailyapp.com?subject=Daily%20App%20Support')}
                        />
                        <MenuItem
                            icon={<View style={[styles.iconBox, { backgroundColor: '#FFCC00' }]}><Star size={19} color="white" strokeWidth={2.5} /></View>}
                            title="Rate the App"
                            onPress={handleRateApp}
                            isLast
                            value={`v${Constants.expoConfig?.version || '1.0.0'}`}
                        />
                    </MenuSection>

                    {/* Legal */}
                    <MenuSection title="LEGAL">
                        <MenuItem
                            icon={<View style={[styles.iconBox, { backgroundColor: '#8E8E93' }]}><Shield size={19} color="white" strokeWidth={2.5} /></View>}
                            title="Privacy Policy"
                            onPress={() => router.push('/privacy-policy')}
                            isLast
                        />
                    </MenuSection>

                    {/* Danger Zone */}
                    <MenuSection>
                        <MenuItem
                            icon={<View style={[styles.iconBox, { backgroundColor: '#FF3B30' }]}><LogOut size={19} color="white" strokeWidth={2.5} /></View>}
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
            <BottomNavBar />
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
        paddingHorizontal: 16, // Standard iOS padding
        paddingVertical: 16,
        paddingBottom: 8, // Reduced bottom padding
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
        paddingBottom: 120,
        paddingHorizontal: 0,
    },
    largeTitle: {
        fontSize: 34,
        fontWeight: '700',
        color: '#000',
        letterSpacing: -1,
        marginLeft: 16,
        marginBottom: 20,
        marginTop: 10,
    },
    dashboardContainer: {
        marginHorizontal: 16, // Standard 16px
        marginBottom: 24,
        // Removed shadows and background color for a cleaner header look
        padding: 0,
    },
    dashboardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16, // Add space between profile and badge if needed, or adjust
    },
    avatarCircle: {
        width: 60, // Slightly larger for header impact
        height: 60,
        borderRadius: 30,
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    avatarInitial: {
        fontSize: 24,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    dashboardHeaderText: {
        flex: 1,
        justifyContent: 'center',
    },
    dashboardTitle: {
        fontSize: 20, // Slightly larger
        fontWeight: '600',
        color: '#1C1C1E',
        letterSpacing: -0.4,
        marginBottom: 2,
    },
    dashboardSubtitle: {
        fontSize: 15, // Standard body size
        color: '#8E8E93',
        fontWeight: '400',
        letterSpacing: -0.2,
    },
    completionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF8E6', // Keep the pill but maybe move it?
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 100, // Fully round
        gap: 4,
    },
    completionBadgeEmoji: {
        fontSize: 14,
    },
    completionBadgeText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FF9500',
        letterSpacing: -0.3,
    },
    statsContainer: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginBottom: 24,
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12, // Tighter radius
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        // Removed shadows
    },
    statCardIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#E0F2FE',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statCardContent: {
        flex: 1,
    },
    statCardValue: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1C1C1E',
        letterSpacing: -0.5,
        marginBottom: 2,
    },
    statCardLabel: {
        fontSize: 13,
        color: '#8E8E93',
        fontWeight: '500',
        letterSpacing: -0.2,
    },
    section: {
        marginBottom: 28, // Tighter spacing between sections
        marginHorizontal: 16, // Standard inset margin
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '400', // Standard iOS section header weight
        color: '#636366', // Standard iOS gray
        marginBottom: 8,
        marginLeft: 16, // Indent text slightly relative to card
        textTransform: 'uppercase',
        letterSpacing: -0.1,
    },
    sectionContent: {
        backgroundColor: '#fff',
        borderRadius: 10, // iOS standard is usually 10-12 for inset grouped
        overflow: 'hidden',
        // Start NO SHADOWS
        // shadowColor: '#000',
        // shadowOffset: { width: 0, height: 3 },
        // shadowOpacity: 0.04,
        // shadowRadius: 10,
        // elevation: 2,
        // End NO SHADOWS
    },
    focusSection: {
        marginBottom: 32,
        marginHorizontal: 16,
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 4,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12, // Slightly taller click area? 11-12 is good.
        paddingHorizontal: 16,
        minHeight: 48, // Compact
    },
    menuItemPressed: {
        backgroundColor: '#E5E5EA', // Standard iOS press color
    },
    menuItemBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#C6C6C8', // Standard separator
        marginLeft: 60, // Align with text start (30 icon + 14 margin + 16 pad) -> 16+30+14 = 60
    },
    menuIconContainer: {
        width: 30, // 30px
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    iconBox: {
        width: 30, // 30px
        height: 30,
        borderRadius: 7, // ~22% of width
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuContent: {
        flex: 1,
        // marginLeft: 12, // Handled by container gap now
        justifyContent: 'center',
    },
    menuRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    menuTitle: {
        fontSize: 17,
        fontWeight: '400',
        color: '#000000', // Pure black often better in light mode
        letterSpacing: -0.24, // San Francisco tracking
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
        fontSize: 17, // Match title size
        color: '#8E8E93',
        fontWeight: '400',
    },
    footerText: {
        textAlign: 'center',
        color: '#8E8E93',
        fontSize: 13,
        lineHeight: 18,
        marginTop: 8, // closer to last element
        marginBottom: 30,
        fontWeight: '400',
        opacity: 1,
    },
});
