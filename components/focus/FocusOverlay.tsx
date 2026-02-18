import React, { useEffect } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
  cancelAnimation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

interface FocusOverlayProps {
  /** Whether the focus session is active (running or paused) */
  active: boolean;
  /** Whether the timer is currently running (enables breathing) */
  running: boolean;
}

/**
 * Full-screen overlay that creates a "focus cocoon" effect:
 * - Soft radial vignette darkening the edges
 * - Warm ambient tint shift
 * - Gentle breathing pulse while running
 */
export function FocusOverlay({ active, running }: FocusOverlayProps) {
  const entrance = useSharedValue(0);
  const breath = useSharedValue(0);

  // Fade in/out the overlay
  useEffect(() => {
    entrance.value = withTiming(active ? 1 : 0, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [active]);

  // Breathing pulse — slow inhale/exhale cycle (~6s)
  useEffect(() => {
    if (running) {
      breath.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        ),
        -1, // infinite
      );
    } else {
      cancelAnimation(breath);
      breath.value = withTiming(0, { duration: 600 });
    }
  }, [running]);

  // Top vignette — fades from dark at top edge to transparent
  const topVignetteStyle = useAnimatedStyle(() => {
    const breathOffset = interpolate(breath.value, [0, 1], [0, 0.02]);
    return {
      opacity: interpolate(entrance.value, [0, 1], [0, 0.20 + breathOffset]),
    };
  });

  // Bottom vignette — fades from dark at bottom edge to transparent
  const bottomVignetteStyle = useAnimatedStyle(() => {
    const breathOffset = interpolate(breath.value, [0, 1], [0, 0.02]);
    return {
      opacity: interpolate(entrance.value, [0, 1], [0, 0.25 + breathOffset]),
    };
  });

  // Subtle ambient wash over the whole screen
  const ambientStyle = useAnimatedStyle(() => {
    const breathOffset = interpolate(breath.value, [0, 1], [0, 0.01]);
    return {
      opacity: interpolate(entrance.value, [0, 1], [0, 0.03 + breathOffset]),
    };
  });

  return (
    <>
      {/* Warm amber wash */}
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.ambientWash, ambientStyle]}
        pointerEvents="none"
      />

      {/* Top edge vignette */}
      <AnimatedLinearGradient
        colors={['rgba(0, 0, 0, 0.15)', 'rgba(0, 0, 0, 0)']}
        locations={[0, 1]}
        style={[styles.topVignette, topVignetteStyle]}
        pointerEvents="none"
      />

      {/* Bottom edge vignette */}
      <AnimatedLinearGradient
        colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.15)']}
        locations={[0, 1]}
        style={[styles.bottomVignette, bottomVignetteStyle]}
        pointerEvents="none"
      />

      {/* Left edge vignette */}
      <AnimatedLinearGradient
        colors={['rgba(0, 0, 0, 0.10)', 'rgba(0, 0, 0, 0)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.sideVignette, styles.leftVignette, topVignetteStyle]}
        pointerEvents="none"
      />

      {/* Right edge vignette */}
      <AnimatedLinearGradient
        colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.10)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.sideVignette, styles.rightVignette, topVignetteStyle]}
        pointerEvents="none"
      />
    </>
  );
}

const styles = StyleSheet.create({
  ambientWash: {
    backgroundColor: '#000000',
  },
  topVignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.3,
  },
  bottomVignette: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.35,
  },
  sideVignette: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: width * 0.2,
  },
  leftVignette: {
    left: 0,
  },
  rightVignette: {
    right: 0,
  },
});
