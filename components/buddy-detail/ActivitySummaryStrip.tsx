import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  type SharedValue,
} from 'react-native-reanimated';

const SPRING_CONFIG = { damping: 28, stiffness: 420, mass: 0.9 };

interface PillData {
  label: string;
  dotColor: string;
}

interface ActivitySummaryStripProps {
  completedCount: number;
  totalCount: number;
  focusMinutes: number;
  sessionCount: number;
}

function Pill({ pill, index, progress }: { pill: PillData; index: number; progress: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const delay = index * 0.08;
    const p = interpolate(progress.value, [delay, delay + 0.6], [0, 1], 'clamp');
    return {
      opacity: p,
      transform: [{ translateY: interpolate(p, [0, 1], [10, 0]) }],
    };
  });

  return (
    <Animated.View style={[styles.pill, style]}>
      <View style={[styles.dot, { backgroundColor: pill.dotColor }]} />
      <Text style={styles.pillText}>{pill.label}</Text>
    </Animated.View>
  );
}

export function ActivitySummaryStrip({
  completedCount,
  totalCount,
  focusMinutes,
  sessionCount,
}: ActivitySummaryStripProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(1, SPRING_CONFIG);
  }, []);

  const focusLabel =
    focusMinutes >= 60
      ? `${Math.floor(focusMinutes / 60)}h ${focusMinutes % 60 > 0 ? `${focusMinutes % 60}m` : ''} focused`.replace('  ', ' ')
      : `${focusMinutes}m focused`;

  const pills: PillData[] = [
    { label: `${completedCount}/${totalCount} done`, dotColor: '#34C759' },
    { label: focusLabel.trim(), dotColor: '#007AFF' },
    { label: `${sessionCount} session${sessionCount !== 1 ? 's' : ''}`, dotColor: '#FF9500' },
  ];

  return (
    <View style={styles.container}>
      {pills.map((pill, i) => (
        <Pill key={i} pill={pill} index={i} progress={progress} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3C3C43',
  },
});
