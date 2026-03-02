import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { X } from 'lucide-react-native';
import * as Haptics from '@/lib/haptics';
import { useBuddy } from '@/contexts/BuddyContext';

const DISMISSED_KEY = 'daily_partner_card_dismissed';
const SNOOZED_KEY = 'daily_partner_card_snoozed_until';
const SNOOZE_DAYS = 3;

export function BuddyDiscoveryCard() {
  const router = useRouter();
  const { hasActiveBuddy, isLoading } = useBuddy();
  const [hidden, setHidden] = useState(true); // default hidden until loaded

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(DISMISSED_KEY),
      AsyncStorage.getItem(SNOOZED_KEY),
    ]).then(([dismissed, snoozedUntil]) => {
      if (dismissed === 'true') {
        setHidden(true);
      } else if (snoozedUntil && new Date(snoozedUntil) > new Date()) {
        setHidden(true);
      } else {
        setHidden(false);
      }
    });
  }, []);

  if (isLoading || hidden || hasActiveBuddy) return null;

  const handleSnooze = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setHidden(true);
    const until = new Date();
    until.setDate(until.getDate() + SNOOZE_DAYS);
    AsyncStorage.setItem(SNOOZED_KEY, until.toISOString());
  };

  const handleDismissForever = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setHidden(true);
    AsyncStorage.setItem(DISMISSED_KEY, 'true');
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/buddy-settings');
  };

  return (
    <View style={styles.wrapper}>
      <Pressable
        style={({ pressed }) => [pressed && { opacity: 0.95, transform: [{ scale: 0.98 }] }]}
        onPress={handlePress}
      >
        <LinearGradient
          colors={['#EEF1FF', '#F0EAFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.card}
        >
          <Pressable
            style={styles.closeButton}
            onPress={handleSnooze}
            hitSlop={12}
          >
            <X size={12} color="#A0A0B0" strokeWidth={2.5} />
          </Pressable>

          <View style={styles.iconCircle}>
            <Text style={styles.iconEmoji}>👯</Text>
          </View>
          <View style={styles.textCol}>
            <Text style={styles.title}>Better with a buddy</Text>
            <Text style={styles.subtitle}>Invite a friend to stay on track</Text>
          </View>
          <View style={styles.ctaButton}>
            <Text style={styles.ctaText}>Invite</Text>
          </View>
        </LinearGradient>
      </Pressable>
      <Pressable onPress={handleDismissForever} hitSlop={8} style={styles.notInterestedBtn}>
        <Text style={styles.notInterestedText}>Not interested</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    paddingRight: 40,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(88,86,214,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 20,
  },
  textCol: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    color: '#6B6B80',
    marginTop: 1,
  },
  ctaButton: {
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  notInterestedBtn: {
    alignSelf: 'center',
    marginTop: 4,
    paddingVertical: 4,
  },
  notInterestedText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#A0A0B0',
  },
});
