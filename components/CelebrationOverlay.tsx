import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const COLORS = ['#007AFF', '#34C759', '#FF9500', '#FF2D55', '#5856D6'];
const PARTICLE_COUNT = 12;

// Pre-compute particle trajectories
const PARTICLE_CONFIGS = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
  const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
  const distance = 80 + Math.random() * 40;
  return {
    targetX: Math.cos(angle) * distance,
    targetY: Math.sin(angle) * distance - 100,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  };
});

function ParticleView({ index, visible }: { index: number; visible: boolean }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);

  const config = PARTICLE_CONFIGS[index];

  useEffect(() => {
    if (visible) {
      opacity.value = 1;
      translateX.value = withTiming(config.targetX, { duration: 400 });
      translateY.value = withTiming(config.targetY, { duration: 400 });
      scale.value = withSequence(
        withTiming(1, { duration: 150 }),
        withTiming(0, { duration: 250 }),
      );
      opacity.value = withTiming(0, { duration: 400 });
    } else {
      translateX.value = 0;
      translateY.value = 0;
      opacity.value = 0;
      scale.value = 0;
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        { backgroundColor: config.color },
        animatedStyle,
      ]}
    />
  );
}

interface CelebrationOverlayProps {
  visible: boolean;
  onComplete: () => void;
  celebrationPhrase?: string | null;
}

export function CelebrationOverlay({ visible, onComplete, celebrationPhrase }: CelebrationOverlayProps) {
  const textOpacity = useSharedValue(0);
  const textScale = useSharedValue(0.5);

  useEffect(() => {
    if (visible) {
      // Text fade in
      textOpacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(600, withTiming(0, { duration: 300 })),
      );
      // Text scale spring then shrink
      textScale.value = withSequence(
        withSpring(1, { damping: 8, stiffness: 120 }),
        withDelay(500, withTiming(0.8, { duration: 200 }, () => {
          runOnJS(onComplete)();
        })),
      );
    } else {
      textOpacity.value = 0;
      textScale.value = 0.5;
    }
  }, [visible, onComplete]);

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ scale: textScale.value }],
  }));

  if (!visible) return null;

  const displayPhrase = celebrationPhrase || 'All done! 🎉';

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Celebration Text */}
      <Animated.View style={[styles.textContainer, textStyle]}>
        <Text style={styles.celebrationText}>{displayPhrase}</Text>
      </Animated.View>

      {/* Particles */}
      {PARTICLE_CONFIGS.map((_, i) => (
        <ParticleView key={i} index={i} visible={visible} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  textContainer: {
    position: 'absolute',
    top: '35%',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  celebrationText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
