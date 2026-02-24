import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Users, X } from 'lucide-react-native';
import * as Haptics from '@/lib/haptics';
import { usePartnership } from '@/contexts/PartnershipContext';

const DISMISSED_KEY = 'daily_partner_card_dismissed';

export function PartnerDiscoveryCard() {
  const router = useRouter();
  const { hasActivePartnership, isLoading } = usePartnership();
  const [dismissed, setDismissed] = useState(true); // default hidden until loaded

  useEffect(() => {
    AsyncStorage.getItem(DISMISSED_KEY).then((val) => {
      setDismissed(val === 'true');
    });
  }, []);

  if (isLoading || dismissed || hasActivePartnership) return null;

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDismissed(true);
    AsyncStorage.setItem(DISMISSED_KEY, 'true');
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/partner-settings');
  };

  return (
    <View style={styles.wrapper}>
      <Pressable
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
        onPress={handlePress}
      >
        <View style={styles.iconCircle}>
          <Users size={20} color="#007AFF" strokeWidth={2} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Better with a partner</Text>
          <Text style={styles.subtitle}>
            Invite someone to keep each other on track
          </Text>
        </View>
        <Pressable
          style={styles.closeButton}
          onPress={handleDismiss}
          hitSlop={12}
        >
          <X size={16} color="#8E8E93" strokeWidth={2} />
        </Pressable>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,122,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 18,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
