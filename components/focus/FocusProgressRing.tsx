import React, { useCallback, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { Play } from 'lucide-react-native';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedView = Animated.View;

interface FocusProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  emoji?: string | null;
  /** 'running' | 'paused' — when set, the ring becomes tappable */
  timerStatus?: 'running' | 'paused' | null;
  onPress?: () => void;
}

export function FocusProgressRing({
  progress,
  size = 260,
  strokeWidth = 14,
  emoji: emojiProp,
  timerStatus,
  onPress,
}: FocusProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const animatedProgress = useSharedValue(progress);
  const pressed = useSharedValue(0);
  const iconOpacity = useSharedValue(timerStatus === 'paused' ? 1 : 0);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, { duration: 400 });
  }, [progress]);

  useEffect(() => {
    iconOpacity.value = withTiming(timerStatus === 'paused' ? 1 : 0, {
      duration: 200,
      easing: Easing.out(Easing.ease),
    });
  }, [timerStatus]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(pressed.value, [0, 1], [1, 0.95]),
      },
    ],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: interpolate(iconOpacity.value, [0, 1], [0.6, 1]) }],
  }));

  const handlePressIn = useCallback(() => {
    pressed.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, []);

  const handlePressOut = useCallback(() => {
    pressed.value = withSpring(0, { damping: 15, stiffness: 300 });
  }, []);

  const isTappable = !!onPress;

  return (
    <AnimatedView style={[{ width: size, height: size }, isTappable && scaleStyle]}>
      {/* SVG ring — non-interactive */}
      <Svg
        width={size}
        height={size}
        style={[StyleSheet.absoluteFill, { transform: [{ rotate: '-90deg' }] }]}
      >
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#E5E5EA"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke="#007AFF"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
        />
      </Svg>

      {/* Emoji center — non-interactive */}
      <View style={styles.centered} pointerEvents="none">
        <Text style={styles.emoji}>{emojiProp ?? '⏳'}</Text>
      </View>

      {/* Paused play icon overlay — non-interactive */}
      {isTappable && (
        <AnimatedView style={[styles.centered, iconStyle]} pointerEvents="none">
          <View style={styles.iconBubble}>
            <Play size={28} color="#fff" fill="#fff" strokeWidth={0} />
          </View>
        </AnimatedView>
      )}

      {/* Transparent touch target on top of everything */}
      {isTappable && (
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={StyleSheet.absoluteFill}
        />
      )}
    </AnimatedView>
  );
}

const styles = StyleSheet.create({
  centered: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 64,
  },
  iconBubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
