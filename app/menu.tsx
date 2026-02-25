import { useRouter } from 'expo-router';
import { useGoBack } from '@/lib/useGoBack';
import {
    ChevronRight,
    Bell,
    Settings,
    LifeBuoy,
    ArrowLeft,
    Users,
} from 'lucide-react-native';
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Alert,
} from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from '@/lib/haptics';

import { Camera } from 'lucide-react-native';

import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTodos } from '@/contexts/TodoContext';
import { AmbientBackground } from '@/components/AmbientBackground';
import { Avatar } from '@/components/Avatar';
import { CircleAlert } from 'lucide-react-native';

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
    const goBack = useGoBack();
    const { resetOnboarding } = useOnboarding();
    const { signOut, profile, uploadAvatar, removeAvatar } = useAuth();
    const { incompleteDateMap } = useTodos();

    const totalIncomplete = Object.values(incompleteDateMap).reduce((sum, d) => sum + d.incomplete, 0);

    const handleAvatarPress = () => {
        const options: { text: string; onPress?: () => void; style?: 'cancel' | 'destructive' }[] = [
            {
                text: 'Choose from Library',
                onPress: async () => {
                    const { error } = await uploadAvatar('gallery');
                    if (error) Alert.alert('Error', error);
                },
            },
            {
                text: 'Take Photo',
                onPress: async () => {
                    const { error } = await uploadAvatar('camera');
                    if (error) Alert.alert('Error', error);
                },
            },
        ];

        if (profile?.avatar_url) {
            options.push({
                text: 'Remove Photo',
                style: 'destructive',
                onPress: async () => {
                    const { error } = await removeAvatar();
                    if (error) Alert.alert('Error', error);
                },
            });
        }

        options.push({ text: 'Cancel', style: 'cancel' });

        Alert.alert('Profile Photo', undefined, options);
    };

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
                            await signOut();
                            router.replace('/login');
                        } catch (error) {
                            console.log('Error signing out:', error);
                        }
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <AmbientBackground />
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable
                        style={styles.backButtonCircle}
                        onPress={goBack}
                        hitSlop={20}
                    >
                        <ArrowLeft size={20} color="#000" strokeWidth={2.5} />
                    </Pressable>

                    <Text style={styles.headerTitle}>Settings</Text>

                    <View style={{ width: 36 }} />
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Profile */}
                    <View style={styles.profileSection}>
                        <Pressable onPress={handleAvatarPress} style={styles.profileAvatarWrap}>
                            <Avatar
                                uri={profile?.avatar_url}
                                name={profile?.name}
                                size={68}
                            />
                            <View style={styles.cameraOverlay}>
                                <Camera size={14} color="#fff" strokeWidth={2.5} />
                            </View>
                        </Pressable>
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>{profile?.name ?? ''}</Text>
                            <Text style={styles.profileEmail}>{profile?.email ?? ''}</Text>
                        </View>
                    </View>

                    {/* Incomplete Tasks */}
                    {totalIncomplete > 0 && (
                        <View style={styles.section}>
                            <MenuItem
                                icon={<CircleAlert size={22} color="#FF9500" strokeWidth={2} />}
                                title="Incomplete Tasks"
                                subtitle={`${totalIncomplete} task${totalIncomplete !== 1 ? 's' : ''} need attention`}
                                onPress={() => router.push('/incomplete')}
                                isLast
                            />
                        </View>
                    )}

                    {/* Partner Mode */}
                    <View style={styles.section}>
                        <MenuItem
                            icon={<Users size={22} color="#007AFF" strokeWidth={2} />}
                            title="Partner Mode"
                            subtitle={profile?.partner_code ? `Code: ${profile.partner_code}` : undefined}
                            onPress={() => router.push('/partner-settings')}
                            isLast
                        />
                    </View>

                    {/* Main Settings List */}
                    <View style={styles.section}>
                        <MenuItem
                            icon={<Bell size={22} color="#000" strokeWidth={2} />}
                            title="Notifications"
                            onPress={() => router.push('/settings-notifications')}
                        />
                        <MenuItem
                            icon={<Settings size={22} color="#000" strokeWidth={2} />}
                            title="Preferences"
                            onPress={() => router.push('/settings-preferences')}
                        />
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
        backgroundColor: 'rgba(255,255,255,0.8)',
        alignItems: 'center',
        justifyContent: 'center',
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
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 16,
        overflow: 'hidden',
    },
    sectionHeader: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 4,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: 'transparent',
    },
    menuItemPressed: {
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    menuItemBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(60,60,67,0.1)',
        marginLeft: 54,
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
        fontWeight: '500',
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
    versionText: {
        textAlign: 'center',
        fontSize: 13,
        color: 'rgba(60,60,67,0.5)',
        marginTop: 12,
        marginBottom: 20,
    },
    profileSection: {
        marginHorizontal: 16,
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileAvatarWrap: {
        position: 'relative',
    },
    cameraOverlay: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.55)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    profileInfo: {
        flex: 1,
        marginLeft: 16,
    },
    profileName: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000',
        letterSpacing: -0.3,
    },
    profileEmail: {
        fontSize: 14,
        color: '#8E8E93',
        marginTop: 2,
    },
});
