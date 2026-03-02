import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Send } from 'lucide-react-native';
import * as Haptics from '@/lib/haptics';
import { Fonts } from '@/lib/typography';
import { AvatarWithProgressRing } from './AvatarWithProgressRing';

interface HeroProfileCardProps {
  avatarUri?: string | null;
  name: string;
  isOnline: boolean;
  lastActiveText: string | null;
  /** Task completion ratio 0–1 for the progress ring */
  completionRatio: number;
  partnerSinceDate?: string | null;
  onNudge: () => void;
}

export function HeroProfileCard({
  avatarUri,
  name,
  isOnline,
  lastActiveText,
  completionRatio,
  partnerSinceDate,
  onNudge,
}: HeroProfileCardProps) {
  const nudgeScale = useSharedValue(1);

  const nudgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: nudgeScale.value }],
  }));

  const handleNudgePressIn = () => {
    nudgeScale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
  };

  const handleNudgePressOut = () => {
    nudgeScale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handleNudge = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onNudge();
  };

  const sinceLabel = partnerSinceDate
    ? `Buddies since ${new Date(partnerSinceDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
    : null;

  return (
    <View style={styles.container}>
      <AvatarWithProgressRing
        uri={avatarUri}
        name={name}
        progress={completionRatio}
        isOnline={isOnline}
      />

      <Text style={styles.name}>{name}</Text>

      {isOnline ? (
        <View style={styles.presenceRow}>
          <View style={styles.onlineDot} />
          <Text style={styles.presenceText}>Online now</Text>
        </View>
      ) : lastActiveText ? (
        <Text style={styles.lastActive}>Active {lastActiveText}</Text>
      ) : null}

      {sinceLabel && <Text style={styles.since}>{sinceLabel}</Text>}

      <Animated.View style={nudgeStyle}>
        <Pressable
          style={styles.nudgePill}
          onPress={handleNudge}
          onPressIn={handleNudgePressIn}
          onPressOut={handleNudgePressOut}
        >
          <Send size={14} color="#007AFF" strokeWidth={2.2} />
          <Text style={styles.nudgeText}>Send a nudge</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 24,
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: Fonts.heading,
    color: '#000',
    letterSpacing: -0.5,
    marginTop: 14,
  },
  presenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34C759',
    marginRight: 6,
  },
  presenceText: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '500',
  },
  lastActive: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  since: {
    fontSize: 12,
    color: '#AEAEB2',
    marginTop: 4,
  },
  nudgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,122,255,0.08)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
  },
  nudgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
});
