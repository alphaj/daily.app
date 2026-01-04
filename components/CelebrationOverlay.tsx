import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

interface Particle {
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  color: string;
}

const COLORS = ['#007AFF', '#34C759', '#FF9500', '#FF2D55', '#5856D6'];

export function CelebrationOverlay({ visible, onComplete }: { visible: boolean; onComplete: () => void }) {
  const particles = useRef<Particle[]>([]);
  
  useEffect(() => {
    if (visible) {
      particles.current = Array.from({ length: 12 }, () => ({
        x: new Animated.Value(width / 2),
        y: new Animated.Value(height / 2),
        opacity: new Animated.Value(1),
        scale: new Animated.Value(0),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      }));

      const animations = particles.current.map((particle, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const distance = 80 + Math.random() * 40;
        const targetX = width / 2 + Math.cos(angle) * distance;
        const targetY = height / 2 + Math.sin(angle) * distance - 100;

        return Animated.parallel([
          Animated.timing(particle.x, {
            toValue: targetX,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(particle.y, {
            toValue: targetY,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(particle.scale, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(particle.scale, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(particle.opacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]);
      });

      Animated.parallel(animations).start(() => {
        onComplete();
      });
    }
  }, [visible, onComplete]);

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.current.map((particle, i) => (
        <Animated.View
          key={i}
          style={[
            styles.particle,
            {
              backgroundColor: particle.color,
              transform: [
                { translateX: Animated.subtract(particle.x, width / 2) },
                { translateY: Animated.subtract(particle.y, height / 2) },
                { scale: particle.scale },
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
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
