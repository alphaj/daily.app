import { useRouter } from 'expo-router';
import {
    ChevronLeft,
    ChevronRight,
    Bell,
    HelpCircle,
    MessageSquare,
    Star,
    Settings,
    User,
    Puzzle,
    Heart,
    LifeBuoy,
    BookOpen,
    Share,
    ArrowLeft,
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
    Image,
    Share as RNShare,
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
            {!isLast && <View style={[styles.menuItemBorder, { position: 'absolute', bottom: 0, right: 0, left: 0 }]} />}
        </Pressable>
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
                    <Pressable
                        style={styles.backButtonCircle}
                        onPress={() => router.back()}
                        hitSlop={20}
                    >
                        <ArrowLeft size={20} color="#000" strokeWidth={2.5} />
                    </Pressable>

                    <Text style={styles.headerTitle}>Settings</Text>

                    <Pressable style={styles.redeemButton} onPress={() => router.push('/redeem')}>
                        <Text style={styles.redeemButtonText}>Redeem</Text>
                    </Pressable>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Main Settings List */}
                    <View style={styles.section}>
                        <MenuItem
                            icon={<User size={22} color="#000" strokeWidth={2} />}
                            title="Account"
                            onPress={() => router.push('/settings-account')}
                        />
                        <MenuItem
                            icon={<Star size={22} color="#000" strokeWidth={2} />}
                            title="Membership"
                            onPress={() => router.push('/settings-membership')}
                        />
                        <MenuItem
                            icon={<Bell size={22} color="#000" strokeWidth={2} />}
                            title="Notifications"
                            onPress={() => router.push('/settings-notifications')}
                        />
                        <MenuItem
                            icon={<Puzzle size={22} color="#000" strokeWidth={2} />}
                            title="Widgets"
                            onPress={() => router.push('/settings-widgets')}
                        />
                        <MenuItem
                            icon={<Heart size={22} color="#000" strokeWidth={2} />}
                            title="Apple Health"
                            onPress={() => router.push('/settings-health')}
                        />
                        <MenuItem
                            icon={<Settings size={22} color="#000" strokeWidth={2} />}
                            title="Preferences"
                            onPress={() => router.push('/settings-preferences')}
                            isLast
                        />
                    </View>

                    {/* Share Card */}
                    <Pressable style={styles.shareCard} onPress={() => {
                        RNShare.share({
                            message: 'I use Daily to build better habits. Try it! https://apps.apple.com/app/id6740611817',
                        });
                    }}>
                        <View style={styles.shareContent}>
                            <Text style={styles.shareTitle}>
                                Share Daily, get a{'\n'}month free
                            </Text>
                            <Text style={styles.shareSubtitle}>
                                You get 1 month of Premium free when a friend joins.
                            </Text>
                        </View>
                        <View style={styles.shareIconContainer}>
                            <Share size={24} color="#000" strokeWidth={2} />
                        </View>
                    </Pressable>


                    {/* Help Section */}
                    <View style={styles.section}>
                        <MenuItem
                            icon={<LifeBuoy size={22} color="#000" strokeWidth={2} />}
                            title="Help"
                            onPress={() => router.push('/settings-help')}
                            isLast
                        />
                    </View>

                    {/* Sign Out */}
                    <View style={styles.section}>
                        <MenuItem
                            icon={<View style={{ width: 22, alignItems: 'center' }}><Text style={{ fontSize: 18 }}>🚪</Text></View>}
                            title="Sign Out"
                            onPress={handleSignOut}
                            danger
                            isLast
                        />
                    </View>

                    <Text style={styles.versionText}>
                        Version {Constants.expoConfig?.version ?? '1.0.0'}
                    </Text>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // Removed solid background to let AmbientBackground show through
    },
    safeArea: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10,
    },
    backButtonCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.8)', // Semi-transparent
        alignItems: 'center',
        justifyContent: 'center',
        // Subtle shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000',
        position: 'absolute',
        left: 0,
        right: 0,
        textAlign: 'center',
        zIndex: -1,
    },
    redeemButton: {
        backgroundColor: '#000', // Black for premium look
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    redeemButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff', // White text
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 24,
        paddingBottom: 40,
        gap: 24,
    },
    section: {
        marginHorizontal: 16,
        backgroundColor: 'rgba(255,255,255,0.7)', // Translucent glass effect
        borderRadius: 16,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: 'transparent', // Let section background show
    },
    menuItemPressed: {
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    menuItemBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(60,60,67,0.1)', // Subtle separator
        marginLeft: 54, // Align with text start
    },
    menuIconContainer: {
        width: 30,
        alignItems: 'flex-start',
        justifyContent: 'center',
        marginRight: 8,
    },
    menuContent: {
        flex: 1,
        justifyContent: 'center',
    },
    menuTitle: {
        fontSize: 17,
        fontWeight: '500', // Medium weight for cleaner look
        color: '#000',
        letterSpacing: -0.2,
    },
    menuSubtitle: {
        fontSize: 13,
        color: '#8E8E93',
        marginTop: 2,
    },
    menuTitleDanger: {
        color: '#FF3B30',
    },
    menuValue: {
        fontSize: 17,
        color: '#8E8E93',
        fontWeight: '400',
    },
    menuRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    shareCard: {
        marginHorizontal: 16,
        backgroundColor: 'rgba(255,255,255,0.7)', // Match section transparency
        borderRadius: 20,
        padding: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        // Optional shadow for card
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    shareContent: {
        flex: 1,
        paddingRight: 16,
    },
    shareTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
        marginBottom: 6,
        lineHeight: 24,
    },
    shareSubtitle: {
        fontSize: 13,
        color: '#8E8E93',
        lineHeight: 18,
    },
    shareIconContainer: {
        // No background, just the icon usually, or could add a subtle bg
    },
    versionText: {
        textAlign: 'center',
        fontSize: 13,
        color: 'rgba(60,60,67,0.5)',
        marginTop: 12,
        marginBottom: 20,
    },
});
