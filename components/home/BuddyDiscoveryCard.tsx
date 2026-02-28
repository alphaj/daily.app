import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowRight, X } from 'lucide-react-native';
import * as Haptics from '@/lib/haptics';
import { useBuddy } from '@/contexts/BuddyContext';

const DISMISSED_KEY = 'daily_partner_card_dismissed';

export function BuddyDiscoveryCard() {
  const router = useRouter();
  const { hasActiveBuddy, isLoading } = useBuddy();
  const [dismissed, setDismissed] = useState(true); // default hidden until loaded

  useEffect(() => {
    AsyncStorage.getItem(DISMISSED_KEY).then((val) => {
      setDismissed(val === 'true');
    });
  }, []);

  if (isLoading || dismissed || hasActiveBuddy) return null;

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDismissed(true);
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
          colors={['#EEF1FF', '#E8EDFF', '#F0EAFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          {/* Dismiss */}
          <Pressable
            style={styles.closeButton}
            onPress={handleDismiss}
            hitSlop={12}
          >
            <X size={14} color="#A0A0B0" strokeWidth={2.5} />
          </Pressable>

          {/* Illustration — overlapping circles */}
          <View style={styles.illustration}>
            <View style={[styles.circle, styles.circleLeft]}>
              <Text style={styles.circleEmoji}>🙋</Text>
            </View>
            <View style={[styles.circle, styles.circleRight]}>
              <Text style={styles.circleEmoji}>🙋‍♂️</Text>
            </View>
          </View>

          {/* Copy */}
          <Text style={styles.title}>Better with a buddy</Text>
          <Text style={styles.subtitle}>
            Invite a friend to share progress and keep each other on track
          </Text>

          {/* CTA */}
          <View style={styles.ctaButton}>
            <Text style={styles.ctaText}>Invite a Buddy</Text>
            <ArrowRight size={14} color="#fff" strokeWidth={2.5} />
          </View>
        </LinearGradient>
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
    borderRadius: 20,
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  illustration: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    height: 52,
  },
  circle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#fff',
  },
  circleLeft: {
    zIndex: 1,
    marginRight: -10,
  },
  circleRight: {
    zIndex: 0,
  },
  circleEmoji: {
    fontSize: 22,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B6B80',
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 22,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: -0.1,
  },
});
