import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
} from 'react-native-reanimated';
import { Avatar } from '@/components/Avatar';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RING_SIZE = 112;
const AVATAR_SIZE = 88;
const STROKE_WIDTH = 4;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface AvatarWithProgressRingProps {
  uri?: string | null;
  name?: string;
  /** 0–1 progress for the ring arc */
  progress?: number;
  isOnline?: boolean;
}

export function AvatarWithProgressRing({
  uri,
  name,
  progress = 0,
  isOnline = false,
}: AvatarWithProgressRingProps) {
  const animatedProgress = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, { duration: 600 });
  }, [progress]);

  useEffect(() => {
    if (isOnline) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 750 }),
          withTiming(0, { duration: 750 }),
        ),
        -1,
        false,
      );
    } else {
      pulse.value = withTiming(0, { duration: 200 });
    }
  }, [isOnline]);

  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - animatedProgress.value),
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1.0, 1.08]) }],
    opacity: interpolate(pulse.value, [0, 1], [0.15, 0.4]),
  }));

  return (
    <View style={styles.container}>
      {/* Online pulse ring */}
      {isOnline && (
        <Animated.View style={[styles.pulseRing, pulseStyle]} />
      )}

      {/* SVG progress ring */}
      <Svg
        width={RING_SIZE}
        height={RING_SIZE}
        style={[StyleSheet.absoluteFill, { transform: [{ rotate: '-90deg' }] }]}
      >
        {/* Track */}
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          stroke="rgba(0,0,0,0.06)"
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />
        {/* Progress arc */}
        <AnimatedCircle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          stroke="#34C759"
          strokeWidth={STROKE_WIDTH}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          animatedProps={ringProps}
        />
      </Svg>

      {/* Avatar centered inside */}
      <View style={styles.avatarWrap}>
        <Avatar uri={uri} name={name} size={AVATAR_SIZE} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RING_SIZE / 2,
    borderWidth: 3,
    borderColor: '#34C759',
  },
  avatarWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
