import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PrivacyPolicyScreen() {
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
                    <Text style={styles.headerTitle}>Privacy Policy</Text>
                </View>

                <View style={styles.iconButton} />
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 60 }}
            >
                <View style={styles.card}>
                    <Text style={styles.lastUpdated}>Last Updated: January 10, 2026</Text>

                    <Text style={styles.intro}>
                        Daily Habit Tracker is committed to protecting your privacy. This policy explains how we handle your information.
                    </Text>

                    <View style={styles.highlight}>
                        <Text style={styles.highlightText}>
                            <Text style={styles.bold}>Summary: </Text>
                            We store all your data locally on your device. We do not collect, transmit, or share your personal information with any third parties.
                        </Text>
                    </View>

                    <Text style={styles.sectionTitle}>1. Information We Collect</Text>
                    <Text style={styles.paragraph}>
                        Daily Habit Tracker stores the following information locally on your device only:
                    </Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bullet}>• Account information (email and encrypted password)</Text>
                        <Text style={styles.bullet}>• Habits, completion records, and streaks</Text>
                        <Text style={styles.bullet}>• Tasks and their completion status</Text>
                        <Text style={styles.bullet}>• Projects and daily notes</Text>
                        <Text style={styles.bullet}>• Inbox items and brain dump thoughts</Text>
                    </View>

                    <Text style={styles.sectionTitle}>2. Device Permissions</Text>
                    <Text style={styles.paragraph}>Our app may request:</Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bullet}>• <Text style={styles.bold}>Face ID:</Text> For secure app access. Biometric data is processed by your device and never accessed by our app.</Text>
                        <Text style={styles.bullet}>• <Text style={styles.bold}>Microphone:</Text> For voice-to-text input when adding tasks or notes. Audio is processed locally and not recorded.</Text>
                        <Text style={styles.bullet}>• <Text style={styles.bold}>Notifications:</Text> For habit reminders you configure.</Text>
                    </View>

                    <Text style={styles.sectionTitle}>3. Data Storage</Text>
                    <Text style={styles.paragraph}>
                        All your data is stored locally on your device using secure storage mechanisms. Sensitive data like authentication tokens is stored in iOS Keychain. We do not have access to your data, and it is never transmitted to external servers.
                    </Text>

                    <Text style={styles.sectionTitle}>4. Data Sharing</Text>
                    <Text style={styles.paragraph}>
                        We do not share, sell, or transfer your personal information to any third parties. Since all data is stored locally, we have no access to it.
                    </Text>

                    <Text style={styles.sectionTitle}>5. Data Security</Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bullet}>• Passwords are encrypted using bcrypt hashing</Text>
                        <Text style={styles.bullet}>• Auth tokens use platform-native secure storage</Text>
                        <Text style={styles.bullet}>• Biometric authentication available</Text>
                    </View>

                    <Text style={styles.sectionTitle}>6. Data Deletion</Text>
                    <Text style={styles.paragraph}>
                        Your data remains on your device as long as you use the app. You can delete all data by logging out or uninstalling the app.
                    </Text>

                    <Text style={styles.sectionTitle}>7. Children's Privacy</Text>
                    <Text style={styles.paragraph}>
                        Our app does not knowingly collect personal information from children under 13.
                    </Text>

                    <Text style={styles.sectionTitle}>8. Third-Party Services</Text>
                    <Text style={styles.paragraph}>
                        Daily Habit Tracker does not integrate with any third-party analytics, advertising, or tracking services.
                    </Text>

                    <Text style={styles.sectionTitle}>9. Changes to This Policy</Text>
                    <Text style={styles.paragraph}>
                        We may update this Privacy Policy from time to time. Changes will be reflected in the "Last Updated" date above.
                    </Text>

                    <Text style={styles.sectionTitle}>10. Your Rights</Text>
                    <Text style={styles.paragraph}>
                        Since all data is stored locally, you have complete control. You can access, modify, or delete your data at any time within the app.
                    </Text>

                    <View style={styles.contact}>
                        <Text style={styles.sectionTitle}>Contact Us</Text>
                        <Text style={styles.paragraph}>
                            If you have questions about this Privacy Policy, please contact us at:
                        </Text>
                        <Text style={styles.email}>support@daily-habit-tracker.app</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    iconButton: {
        padding: 8,
        width: 40,
        height: 40,
        backgroundColor: '#fff',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: {
        alignItems: 'center',
        gap: 2,
    },
    logoText: {
        fontSize: 16,
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
        paddingHorizontal: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        marginTop: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    lastUpdated: {
        fontSize: 13,
        color: '#8E8E93',
        marginBottom: 16,
    },
    intro: {
        fontSize: 15,
        color: '#424245',
        lineHeight: 22,
        marginBottom: 16,
    },
    highlight: {
        backgroundColor: '#F0F0F5',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
    },
    highlightText: {
        fontSize: 14,
        color: '#424245',
        lineHeight: 20,
    },
    bold: {
        fontWeight: '700',
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1d1d1f',
        marginTop: 20,
        marginBottom: 8,
    },
    paragraph: {
        fontSize: 15,
        color: '#424245',
        lineHeight: 22,
        marginBottom: 8,
    },
    bulletList: {
        marginLeft: 4,
        marginBottom: 8,
    },
    bullet: {
        fontSize: 14,
        color: '#424245',
        lineHeight: 22,
        marginBottom: 4,
    },
    contact: {
        marginTop: 24,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
    },
    email: {
        fontSize: 15,
        color: '#007AFF',
        fontWeight: '500',
    },
});
