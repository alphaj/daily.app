import { useRouter } from 'expo-router';
import {
    ChevronLeft,
    ChevronRight,
    User,
    Bell,
    Palette,
    Download,
    HelpCircle,
    MessageSquare,
    Star,
    Shield,
    Plus,
    Zap,
    Menu,
    Home,
    Brain,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

interface MenuItemProps {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showChevron?: boolean;
}

function MenuItem({ icon, title, subtitle, onPress, showChevron = true }: MenuItemProps) {
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
                <Text style={styles.menuTitle}>{title}</Text>
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
    const [addOptionsVisible, setAddOptionsVisible] = useState(false);

    const handleAddPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setAddOptionsVisible(true);
    };

    const handleAddTask = () => {
        setAddOptionsVisible(false);
        router.push('/add-todo');
    };

    const handleAddHabit = () => {
        setAddOptionsVisible(false);
        router.push('/add-habit');
    };

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
                {/* Account Section */}
                <MenuSection title="Account">
                    <MenuItem
                        icon={<User size={22} color="#5856D6" />}
                        title="Profile"
                        subtitle="Manage your account"
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
                        title="Privacy"
                        subtitle="Data & security"
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

            {/* Bottom Bar */}
            <View style={styles.bottomBar}>
                <Pressable style={styles.bottomTab} onPress={() => router.replace('/')}>
                    <Home size={24} color="#000" strokeWidth={1.5} />
                </Pressable>
                <Pressable style={styles.bottomTab} onPress={() => router.push('/brain-dump')}>
                    <Brain size={24} color="#000" strokeWidth={1.5} />
                </Pressable>

                <Pressable style={styles.fab} onPress={handleAddPress}>
                    <Plus size={28} color="#000" strokeWidth={1.5} />
                </Pressable>

                <Pressable style={styles.bottomTab} onPress={() => router.push('/habits')}>
                    <Zap size={24} color="#000" strokeWidth={1.5} />
                </Pressable>

                <Pressable style={[styles.bottomTab, styles.bottomTabActive]}>
                    <Menu size={24} color="#5856D6" strokeWidth={1.5} />
                </Pressable>
            </View>

            {/* Add Options Modal */}
            <Modal
                visible={addOptionsVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setAddOptionsVisible(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setAddOptionsVisible(false)}>
                    <View style={styles.addOptionsModal}>
                        <Text style={styles.addOptionsTitle}>What would you like to add?</Text>
                        <Pressable style={styles.addOptionButton} onPress={handleAddTask}>
                            <Text style={styles.addOptionText}>📝 Task</Text>
                        </Pressable>
                        <Pressable style={styles.addOptionButton} onPress={handleAddHabit}>
                            <Text style={styles.addOptionText}>⚡ Habit</Text>
                        </Pressable>
                    </View>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    iconButton: {
        padding: 8,
        width: 40,
    },
    headerCenter: {
        alignItems: 'center',
        gap: 4,
    },
    logoText: {
        fontSize: 20,
        fontWeight: '800',
        color: '#000',
        letterSpacing: -1.0,
    },
    headerTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#8E8E93',
    },
    content: {
        flex: 1,
    },
    section: {
        marginTop: 24,
        paddingHorizontal: 24,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
        marginLeft: 4,
    },
    sectionContent: {
        backgroundColor: '#F2F2F7',
        borderRadius: 16,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        marginBottom: 1,
    },
    menuIcon: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#F2F2F7',
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
    },
    menuSubtitle: {
        fontSize: 13,
        color: '#8E8E93',
        marginTop: 2,
    },
    appInfo: {
        alignItems: 'center',
        marginTop: 40,
    },
    appInfoText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#000',
        letterSpacing: -0.5,
    },
    appVersion: {
        fontSize: 13,
        color: '#8E8E93',
        marginTop: 4,
    },
    bottomBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 32,
        paddingVertical: 8,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#F2F2F7',
        paddingBottom: 20,
    },
    bottomTab: {
        padding: 4,
    },
    bottomTabActive: {
        opacity: 1,
    },
    fab: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addOptionsModal: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        width: 300,
        maxWidth: 300,
        alignItems: 'center',
    },
    addOptionsTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
        marginBottom: 20,
    },
    addOptionButton: {
        width: '100%',
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: '#F2F2F7',
        borderRadius: 12,
        marginBottom: 12,
    },
    addOptionText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000',
        textAlign: 'center',
    },
});
