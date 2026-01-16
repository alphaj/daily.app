import { useRouter } from 'expo-router';
import {
    ChevronLeft,
    ChevronRight,
    Bell,
    Palette,
    Download,
    HelpCircle,
    MessageSquare,
    Star,
    Shield,
    FolderKanban,
} from 'lucide-react-native';
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';


interface MenuItemProps {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showChevron?: boolean;
    danger?: boolean;
}

function MenuItem({ icon, title, subtitle, onPress, showChevron = true, danger }: MenuItemProps) {
    return (
        <Pressable
            style={styles.menuItem}
            onPress={() => {
                Haptics.selectionAsync();
                onPress?.();
            }}
        >
            <View style={styles.menuIcon}>{icon}</View>
            <View style={styles.menuContent}>
                <Text style={[styles.menuTitle, danger && styles.menuTitleDanger]}>{title}</Text>
                {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
            </View>
            {showChevron && <ChevronRight size={20} color="#C7C7CC" />}
        </Pressable>
    );
}

function MenuSection({ title, children }: { title?: string; children: React.ReactNode }) {
    return (
        <View style={styles.section}>
            {title && <Text style={styles.sectionTitle}>{title}</Text>}
            <View style={styles.sectionContent}>{children}</View>
        </View>
    );
}

export default function MenuScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable style={styles.iconButton} onPress={() => router.back()}>
                    <ChevronLeft size={24} color="#000" strokeWidth={1.5} />
                </Pressable>

                <View style={styles.headerCenter}>
                    <Text style={styles.logoText}>daily.app</Text>
                    <Text style={styles.headerTitle}>Settings</Text>
                </View>

                <View style={styles.iconButton} />
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                {/* Organize Section */}
                <MenuSection title="Organize">
                    <MenuItem
                        icon={<FolderKanban size={22} color="#007AFF" />}
                        title="Projects"
                        subtitle="Manage your projects"
                        onPress={() => router.push('/projects')}
                    />
                </MenuSection>

                {/* Preferences Section */}
                <MenuSection title="Preferences">
                    <MenuItem
                        icon={<Bell size={22} color="#FF9500" />}
                        title="Notifications"
                        subtitle="Reminders & alerts"
                    />
                    <MenuItem
                        icon={<Palette size={22} color="#34C759" />}
                        title="Appearance"
                        subtitle="Theme & display"
                    />
                </MenuSection>

                {/* Data Section */}
                <MenuSection title="Data">
                    <MenuItem
                        icon={<Download size={22} color="#007AFF" />}
                        title="Export Data"
                        subtitle="Download your data"
                    />
                    <MenuItem
                        icon={<Shield size={22} color="#8E8E93" />}
                        title="Privacy Policy"
                        subtitle="Data & security"
                        onPress={() => router.push('/privacy-policy')}
                    />
                </MenuSection>

                {/* Support Section */}
                <MenuSection title="Support">
                    <MenuItem
                        icon={<HelpCircle size={22} color="#AF52DE" />}
                        title="Help & FAQ"
                    />
                    <MenuItem
                        icon={<MessageSquare size={22} color="#5856D6" />}
                        title="Contact Us"
                    />
                    <MenuItem
                        icon={<Star size={22} color="#FFCC00" />}
                        title="Rate the App"
                    />
                </MenuSection>

                {/* App Info */}
                <View style={styles.appInfo}>
                    <Text style={styles.appInfoText}>daily.app</Text>
                    <Text style={styles.appVersion}>Version 1.0.0</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7', // System Gray 6
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 8, // Reduced vertical padding
    },
    iconButton: {
        padding: 8,
        width: 40,
        height: 40, // Fixed height for circular button
        backgroundColor: '#fff', // Added background
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    headerCenter: {
        alignItems: 'center',
        gap: 2,
    },
    logoText: {
        fontSize: 16, // Slightly smaller
        fontWeight: '800',
        color: '#000',
        letterSpacing: -0.5,
    },
    headerTitle: {
        fontSize: 13,
        fontWeight: '500',
        color: '#8E8E93',
    },
    content: {
        flex: 1,
    },
    section: {
        marginTop: 24,
        paddingHorizontal: 20, // Reduced padding to allow wider cards
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#8E8E93',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
        marginLeft: 12, // Indent title slightly
    },
    sectionContent: {
        backgroundColor: '#fff', // White card
        borderRadius: 20, // iOS Cell Radius
        overflow: 'hidden',
        // Optional Shadow for depth
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        // Separator logic is usually handled by views, but this works for simple lists in RN
        borderBottomWidth: 0.5,
        borderBottomColor: '#F2F2F7',
    },
    menuIcon: {
        width: 32,
        height: 32,
        borderRadius: 10, // Squircle
        backgroundColor: '#F2F2F7', // Gray background for icon
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    menuContent: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginBottom: 2,
    },
    menuTitleDanger: {
        color: '#FF3B30',
    },
    menuSubtitle: {
        fontSize: 13,
        color: '#8E8E93',
    },
    appInfo: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 40,
    },
    appInfoText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#C7C7CC',
        letterSpacing: -0.5,
    },
    appVersion: {
        fontSize: 13,
        color: '#C7C7CC',
        marginTop: 4,
    },
});
