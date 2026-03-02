import React, { useCallback } from 'react';
import { Pressable, type PressableProps } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from '@/lib/haptics';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

interface AnimatedPressableProps extends PressableProps {
  scaleValue?: number;
  hapticStyle?: Haptics.ImpactFeedbackStyle;
}

export function AnimatedPressable({
  scaleValue = 0.97,
  hapticStyle = Haptics.ImpactFeedbackStyle.Light,
  onPressIn,
  onPressOut,
  onPress,
  style,
  ...rest
}: AnimatedPressableProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(
    (e: any) => {
      scale.value = withSpring(scaleValue, { damping: 15, stiffness: 400 });
      onPressIn?.(e);
    },
    [scaleValue, onPressIn],
  );

  const handlePressOut = useCallback(
    (e: any) => {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
      onPressOut?.(e);
    },
    [onPressOut],
  );

  const handlePress = useCallback(
    (e: any) => {
      Haptics.impactAsync(hapticStyle);
      onPress?.(e);
    },
    [hapticStyle, onPress],
  );

  return (
    <AnimatedPressableBase
      {...rest}
      style={[animatedStyle, style as any]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    />
  );
}
