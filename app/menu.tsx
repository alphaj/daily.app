import { useRouter } from 'expo-router';
import {
    ChevronRight,
    Bell,
    Settings,
    LifeBuoy,
    Users,
    Pencil,
    LogOut,
    CircleAlert,
} from 'lucide-react-native';
import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    Pressable,
    ScrollView,
    Alert,
    Keyboard,
} from 'react-native';
import Constants from 'expo-constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from '@/lib/haptics';

import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTodos } from '@/contexts/TodoContext';
import { AmbientBackground } from '@/components/AmbientBackground';
import { Avatar } from '@/components/Avatar';
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
    const { resetOnboarding } = useOnboarding();
    const { signOut, profile, uploadAvatar, removeAvatar, updateName } = useAuth();
    const { incompleteDateMap } = useTodos();
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState(profile?.name ?? '');
    const nameInputRef = useRef<TextInput>(null);

    const totalIncomplete = Object.values(incompleteDateMap).reduce((sum, d) => sum + d.incomplete, 0);

    const handleSaveName = async () => {
        Keyboard.dismiss();
        const trimmed = editedName.trim();
        if (!trimmed || trimmed === profile?.name) {
            setIsEditingName(false);
            return;
        }
        const { error } = await updateName(trimmed);
        if (error) {
            Alert.alert('Error', error);
            setEditedName(profile?.name ?? '');
        }
        setIsEditingName(false);
    };

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
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Large title */}
                    <Text style={styles.largeTitle}>Settings</Text>

                    {/* Profile row — iOS Settings style */}
                    <View style={styles.section}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.profileRow,
                                pressed && styles.menuItemPressed,
                            ]}
                            onPress={handleAvatarPress}
                        >
                            <Avatar
                                uri={profile?.avatar_url}
                                name={profile?.name}
                                size={60}
                            />
                            <View style={styles.profileInfo}>
                                {isEditingName ? (
                                    <TextInput
                                        ref={nameInputRef}
                                        style={styles.profileNameInput}
                                        value={editedName}
                                        onChangeText={setEditedName}
                                        autoFocus
                                        returnKeyType="done"
                                        selectTextOnFocus
                                        maxLength={50}
                                        onSubmitEditing={handleSaveName}
                                        onBlur={handleSaveName}
                                    />
                                ) : (
                                    <Pressable
                                        style={styles.nameRow}
                                        onPress={() => {
                                            Haptics.selectionAsync();
                                            setEditedName(profile?.name ?? '');
                                            setIsEditingName(true);
                                        }}
                                        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                                    >
                                        <Text style={styles.profileName} numberOfLines={1}>{profile?.name ?? ''}</Text>
                                        <Pencil size={12} color="#C7C7CC" strokeWidth={2} />
                                    </Pressable>
                                )}
                                <Text style={styles.profileEmail} numberOfLines={1}>{profile?.email ?? ''}</Text>
                            </View>
                            <ChevronRight size={18} color="#C7C7CC" strokeWidth={2} />
                        </Pressable>
                    </View>

                    {/* Partner & Tasks */}
                    <View style={styles.section}>
                        <MenuItem
                            icon={<Users size={22} color="#007AFF" strokeWidth={2} />}
                            title="Partner Mode"
                            subtitle={profile?.partner_code ? `Code: ${profile.partner_code}` : undefined}
                            onPress={() => router.push('/partner-settings')}
                            isLast={totalIncomplete === 0}
                        />
                        {totalIncomplete > 0 && (
                            <MenuItem
                                icon={<CircleAlert size={22} color="#FF9500" strokeWidth={2} />}
                                title="Incomplete Tasks"
                                subtitle={`${totalIncomplete} task${totalIncomplete !== 1 ? 's' : ''} need attention`}
                                onPress={() => router.push('/incomplete')}
                                isLast
                            />
                        )}
                    </View>

                    {/* General */}
                    <Text style={styles.sectionLabel}>GENERAL</Text>
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

                    {/* Account */}
                    <Text style={styles.sectionLabel}>ACCOUNT</Text>
                    <View style={styles.section}>
                        <MenuItem
                            icon={<LogOut size={22} color="#FF3B30" strokeWidth={2} />}
                            title="Sign Out"
                            onPress={handleSignOut}
                            danger
                            showChevron={false}
                            isLast
                        />
                    </View>

                    <Text style={styles.versionText}>
                        Version {Constants.expoConfig?.version ?? '1.0.0'}
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
    },
    safeArea: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    largeTitle: {
        fontSize: 34,
        fontWeight: '700',
        color: '#000',
        letterSpacing: -0.5,
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 16,
    },
    section: {
        marginHorizontal: 16,
        marginBottom: 24,
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 12,
        overflow: 'hidden',
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '400',
        color: 'rgba(60,60,67,0.6)',
        letterSpacing: -0.08,
        marginHorizontal: 32,
        marginBottom: 6,
        textTransform: 'uppercase',
    },
    // Profile row
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        paddingRight: 16,
    },
    profileInfo: {
        flex: 1,
        marginLeft: 14,
        justifyContent: 'center',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    profileName: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000',
        letterSpacing: -0.3,
    },
    profileNameInput: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000',
        letterSpacing: -0.3,
        paddingVertical: 0,
        paddingHorizontal: 0,
    },
    profileEmail: {
        fontSize: 14,
        color: '#8E8E93',
        marginTop: 2,
    },
    // Menu items
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
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
        fontWeight: '400',
        color: '#000',
        letterSpacing: -0.4,
    },
    menuSubtitle: {
        fontSize: 13,
        color: '#8E8E93',
        marginTop: 1,
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
});
