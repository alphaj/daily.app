import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const REDEEMED_CODES_KEY = 'daily_redeemed_codes';

export default function RedeemScreen() {
    const router = useRouter();
    const [code, setCode] = useState('');

    const handleRedeem = async () => {
        const trimmed = code.trim();
        if (!trimmed) {
            Alert.alert('Enter a Code', 'Please enter a promo code to redeem.');
            return;
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        try {
            const stored = await AsyncStorage.getItem(REDEEMED_CODES_KEY);
            const codes: string[] = stored ? JSON.parse(stored) : [];
            if (!codes.includes(trimmed)) {
                codes.push(trimmed);
                await AsyncStorage.setItem(REDEEMED_CODES_KEY, JSON.stringify(codes));
            }
        } catch (error) {
            console.log('Error storing redeemed code:', error);
        }

        Alert.alert(
            'Coming Soon',
            'Promo code redemption will be available with Daily Premium. Your code has been saved.',
            [{ text: 'OK', onPress: () => router.back() }]
        );
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <View style={styles.header}>
                        <Pressable style={styles.closeButton} onPress={() => router.back()} hitSlop={20}>
                            <X size={20} color="#000" strokeWidth={2.5} />
                        </Pressable>
                        <Text style={styles.headerTitle}>Redeem Code</Text>
                        <View style={{ width: 36 }} />
                    </View>

                    <View style={styles.content}>
                        <Text style={styles.description}>
                            Enter a promo code to unlock features or extend your subscription.
                        </Text>

                        <TextInput
                            style={styles.input}
                            value={code}
                            onChangeText={(text) => setCode(text.toUpperCase())}
                            placeholder="PROMO CODE"
                            placeholderTextColor="#C7C7CC"
                            autoCapitalize="characters"
                            autoCorrect={false}
                            maxLength={16}
                            textAlign="center"
                        />

                        <Pressable
                            style={({ pressed }) => [
                                styles.redeemButton,
                                !code.trim() && styles.redeemButtonDisabled,
                                pressed && code.trim() && styles.redeemButtonPressed,
                            ]}
                            onPress={handleRedeem}
                            disabled={!code.trim()}
                        >
                            <Text style={[styles.redeemButtonText, !code.trim() && styles.redeemButtonTextDisabled]}>
                                Redeem
                            </Text>
                        </Pressable>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F8F8' },
    safeArea: { flex: 1 },
    header: {
        paddingHorizontal: 16, paddingVertical: 12,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    closeButton: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 17, fontWeight: '600', color: '#000',
        position: 'absolute', left: 0, right: 0, textAlign: 'center', zIndex: -1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 48,
        alignItems: 'center',
    },
    description: {
        fontSize: 15, color: '#8E8E93', textAlign: 'center',
        lineHeight: 22, marginBottom: 32,
    },
    input: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingVertical: 18,
        paddingHorizontal: 24,
        fontSize: 20,
        fontWeight: '600',
        color: '#000',
        letterSpacing: 4,
        textAlign: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    redeemButton: {
        width: '100%',
        backgroundColor: '#000',
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
    },
    redeemButtonDisabled: { backgroundColor: '#E5E5EA' },
    redeemButtonPressed: { opacity: 0.8 },
    redeemButtonText: { fontSize: 17, fontWeight: '600', color: '#fff' },
    redeemButtonTextDisabled: { color: '#C7C7CC' },
});
