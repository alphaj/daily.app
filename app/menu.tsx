import { useRouter } from 'expo-router';
import {
    ChevronRight,
    Bell,
    Settings,
    LifeBuoy,
    Users,
    Pencil,
    LogOut,
    Camera,
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
import { BottomNavBar } from '@/components/BottomNavBar';
import { Avatar } from '@/components/Avatar';
import { Fonts } from '@/lib/typography';


// ── Icon pill (iOS Settings style) ──────────────────────────────────

function IconPill({ color, children }: { color: string; children: React.ReactNode }) {
    return (
        <View style={[styles.iconPill, { backgroundColor: color }]}>
            {children}
        </View>
    );
}

// ── Menu row ────────────────────────────────────────────────────────

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
    value,
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
            {icon}
            <View style={styles.menuContent}>
                <View style={styles.menuTextRow}>
                    <Text style={[styles.menuTitle, danger && styles.menuTitleDanger]}>
                        {title}
                    </Text>
                    {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
                </View>
                <View style={styles.menuRight}>
                    {value && <Text style={styles.menuValue}>{value}</Text>}
                    {showChevron && <ChevronRight size={17} color="#C7C7CC" strokeWidth={2} />}
                </View>
            </View>
            {!isLast && <View style={styles.separator} />}
        </Pressable>
    );
}

// ── Screen ──────────────────────────────────────────────────────────

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
                <View style={styles.topRow}>
                    <Text style={styles.screenTitle}>Profile</Text>
                </View>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* ── Profile Card (centered) ── */}
                    <View style={styles.profileCard}>
                        <Pressable onPress={handleAvatarPress} style={styles.avatarWrap}>
                            <Avatar
                                uri={profile?.avatar_url}
                                name={profile?.name}
                                size={80}
                            />
                            <View style={styles.cameraBadge}>
                                <Camera size={12} color="#fff" strokeWidth={2.5} />
                            </View>
                        </Pressable>
                        <View style={styles.nameRow}>
                            {isEditingName ? (
                                <TextInput
                                    ref={nameInputRef}
                                    style={styles.nameInput}
                                    value={editedName}
                                    onChangeText={setEditedName}
                                    onBlur={handleSaveName}
                                    onSubmitEditing={handleSaveName}
                                    returnKeyType="done"
                                    autoFocus
                                    selectTextOnFocus
                                />
                            ) : (
                                <>
                                    <Text style={styles.profileName}>{profile?.name ?? ''}</Text>
                                    <Pressable
                                        onPress={() => {
                                            setEditedName(profile?.name ?? '');
                                            setIsEditingName(true);
                                        }}
                                        hitSlop={8}
                                    >
                                        <Pencil size={14} color="#8E8E93" strokeWidth={2} />
                                    </Pressable>
                                </>
                            )}
                        </View>
                        {!!profile?.email && (
                            <Text style={styles.profileEmail}>{profile.email}</Text>
                        )}
                    </View>

                    {/* ── Incomplete Tasks (conditional) ── */}
                    {totalIncomplete > 0 && (
                        <View style={styles.section}>
                            <MenuItem
                                icon={
                                    <IconPill color="#FF9500">
                                        <CircleAlert size={18} color="#fff" strokeWidth={2} />
                                    </IconPill>
                                }
                                title="Incomplete Tasks"
                                subtitle={`${totalIncomplete} task${totalIncomplete !== 1 ? 's' : ''} need attention`}
                                onPress={() => router.push('/incomplete')}
                                isLast
                            />
                        </View>
                    )}

                    {/* ── Social ── */}
                    <View style={styles.section}>
                        <MenuItem
                            icon={
                                <IconPill color="#007AFF">
                                    <Users size={18} color="#fff" strokeWidth={2} />
                                </IconPill>
                            }
                            title="Buddy Mode"
                            value={profile?.partner_code ?? undefined}
                            onPress={() => router.push('/buddy-settings')}
                            isLast
                        />
                    </View>

                    {/* ── General ── */}
                    <View style={styles.section}>
                        <MenuItem
                            icon={
                                <IconPill color="#FF3B30">
                                    <Bell size={18} color="#fff" strokeWidth={2} />
                                </IconPill>
                            }
                            title="Notifications"
                            onPress={() => router.push('/settings-notifications')}
                        />
                        <MenuItem
                            icon={
                                <IconPill color="#8E8E93">
                                    <Settings size={18} color="#fff" strokeWidth={2} />
                                </IconPill>
                            }
                            title="Preferences"
                            onPress={() => router.push('/settings-preferences')}
                        />
                        <MenuItem
                            icon={
                                <IconPill color="#AF52DE">
                                    <LifeBuoy size={18} color="#fff" strokeWidth={2} />
                                </IconPill>
                            }
                            title="Help"
                            onPress={() => router.push('/settings-help')}
                            isLast
                        />
                    </View>

                    {/* ── Sign Out ── */}
                    <View style={styles.section}>
                        <MenuItem
                            icon={
                                <IconPill color="#FF3B30">
                                    <LogOut size={18} color="#fff" strokeWidth={2} />
                                </IconPill>
                            }
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
                <BottomNavBar />
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    safeArea: {
        flex: 1,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 8,
        minHeight: 48,
        marginBottom: 12,
    },
    screenTitle: {
        fontSize: 28,
        fontFamily: Fonts.heading,
        fontWeight: '700',
        color: '#1C1C1E',
        letterSpacing: -0.5,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 12,
        paddingBottom: 100,
    },

    // ── Profile card ──
    profileCard: {
        alignItems: 'center',
        paddingTop: 20,
        paddingBottom: 28,
    },
    avatarWrap: {
        position: 'relative',
        marginBottom: 12,
    },
    cameraBadge: {
        position: 'absolute',
        bottom: 0,
        right: -2,
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: 'rgba(0,0,0,0.55)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2.5,
        borderColor: '#fff',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    nameInput: {
        fontSize: 22,
        fontWeight: '700',
        color: '#000',
        letterSpacing: -0.4,
        borderBottomWidth: 1.5,
        borderBottomColor: '#007AFF',
        paddingVertical: 2,
        paddingHorizontal: 4,
        minWidth: 120,
        textAlign: 'center',
    },
    profileName: {
        fontSize: 22,
        fontWeight: '700',
        color: '#000',
        letterSpacing: -0.4,
    },
    profileEmail: {
        fontSize: 14,
        color: '#8E8E93',
        marginTop: 3,
    },

    // ── Sections ──
    section: {
        marginHorizontal: 16,
        marginBottom: 20,
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 14,
        overflow: 'hidden',
    },

    // ── Menu items ──
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingLeft: 14,
        paddingRight: 16,
    },
    menuItemPressed: {
        backgroundColor: 'rgba(0,0,0,0.04)',
    },
    iconPill: {
        width: 30,
        height: 30,
        borderRadius: 7,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 14,
        minHeight: 28,
    },
    menuTextRow: {
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
        fontSize: 15,
        color: '#8E8E93',
        fontWeight: '400',
        marginRight: 4,
    },
    menuRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    separator: {
        position: 'absolute',
        bottom: 0,
        left: 58,
        right: 0,
        height: StyleSheet.hairlineWidth,
        backgroundColor: 'rgba(60,60,67,0.12)',
    },

    // ── Footer ──
    versionText: {
        textAlign: 'center',
        fontSize: 13,
        color: 'rgba(60,60,67,0.4)',
        marginTop: 4,
        marginBottom: 20,
    },
});
