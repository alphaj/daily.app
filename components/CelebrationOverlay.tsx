import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

interface Particle {
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  rotation: Animated.Value;
  color: string;
  size: number;
  shape: 'circle' | 'square' | 'diamond';
}

const COLORS = ['#007AFF', '#34C759', '#FF9500', '#FF2D55', '#5856D6', '#FFCC00', '#AF52DE'];
const SHAPES: Particle['shape'][] = ['circle', 'square', 'diamond'];

interface CelebrationOverlayProps {
  visible: boolean;
  onComplete: () => void;
  celebrationPhrase?: string | null;
}

export function CelebrationOverlay({ visible, onComplete, celebrationPhrase }: CelebrationOverlayProps) {
  const particles = useRef<Particle[]>([]);
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textScale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (visible) {
      // Haptic burst on celebration start
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      const particleCount = 20;
      particles.current = Array.from({ length: particleCount }, () => ({
        x: new Animated.Value(width / 2),
        y: new Animated.Value(height / 2),
        opacity: new Animated.Value(1),
        scale: new Animated.Value(0),
        rotation: new Animated.Value(0),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 6 + Math.random() * 6,
        shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      }));

      const particleAnimations = particles.current.map((particle, i) => {
        const angle = (i / particleCount) * Math.PI * 2;
        const distance = 60 + Math.random() * 80;
        const targetX = width / 2 + Math.cos(angle) * distance;
        const targetY = height / 2 + Math.sin(angle) * distance - 100;
        const duration = 350 + Math.random() * 200;

        return Animated.parallel([
          Animated.timing(particle.x, {
            toValue: targetX,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(particle.y, {
            toValue: targetY + 30, // gravity effect
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(particle.rotation, {
            toValue: Math.random() * 4 - 2, // random spin
            duration,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.spring(particle.scale, {
              toValue: 1,
              friction: 5,
              tension: 200,
              useNativeDriver: true,
            }),
            Animated.timing(particle.scale, {
              toValue: 0,
              duration: duration * 0.4,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(particle.opacity, {
            toValue: 0,
            duration,
            useNativeDriver: true,
          }),
        ]);
      });

      // Text animation
      const textAnimation = Animated.parallel([
        Animated.sequence([
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.delay(600),
          Animated.timing(textOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.spring(textScale, {
            toValue: 1,
            speed: 12,
            bounciness: 10,
            useNativeDriver: true,
          }),
          Animated.delay(500),
          Animated.timing(textScale, {
            toValue: 0.8,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]);

      Animated.parallel([...particleAnimations, textAnimation]).start(() => {
        textOpacity.setValue(0);
        textScale.setValue(0.5);
        onComplete();
      });
    }
  }, [visible, onComplete, textOpacity, textScale]);

  if (!visible) return null;

  const displayPhrase = celebrationPhrase || 'All done! 🎉';

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Celebration Text */}
      <Animated.View style={[
        styles.textContainer,
        {
          opacity: textOpacity,
          transform: [{ scale: textScale }],
        }
      ]}>
        <Text style={styles.celebrationText}>{displayPhrase}</Text>
      </Animated.View>

      {/* Particles */}
      {particles.current.map((particle, i) => (
        <Animated.View
          key={i}
          style={[
            styles.particle,
            {
              backgroundColor: particle.color,
              width: particle.size,
              height: particle.size,
              borderRadius: particle.shape === 'circle' ? particle.size / 2 : particle.shape === 'diamond' ? 2 : 1,
              transform: [
                { translateX: Animated.subtract(particle.x, width / 2) },
                { translateY: Animated.subtract(particle.y, height / 2) },
                { scale: particle.scale },
                { rotate: particle.rotation.interpolate({
                    inputRange: [-2, 2],
                    outputRange: ['-180deg', '180deg'],
                  })
                },
              ],
              opacity: particle.opacity,
            },
          ]}
        />
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
  },
});

