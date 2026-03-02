import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  interpolate,
} from 'react-native-reanimated';

const SPRING = { damping: 20, stiffness: 300 };

interface BuddyEmptyStateProps {
  partnerName: string;
}

export function BuddyEmptyState({ partnerName }: BuddyEmptyStateProps) {
  const entrance = useSharedValue(0);

  useEffect(() => {
    entrance.value = withSpring(1, SPRING);
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [{ scale: interpolate(entrance.value, [0, 1], [0.9, 1]) }],
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Decorative overlapping circles */}
      <View style={styles.circlesWrap}>
        <View style={[styles.circle, styles.circleBlue]} />
        <View style={[styles.circle, styles.circlePurple]} />
        <View style={[styles.circle, styles.circleOrange]} />
        <Text style={styles.sun}>{'☀️'}</Text>
      </View>

      <Text style={styles.title}>Nothing here yet</Text>
      <Text style={styles.subtitle}>
        {partnerName}'s tasks and focus sessions{'\n'}will appear here once they start their day
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  circlesWrap: {
    width: 120,
    height: 80,
    marginBottom: 24,
    position: 'relative',
  },
  circle: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  circleBlue: {
    backgroundColor: 'rgba(0,122,255,0.15)',
    left: 0,
    top: 10,
  },
  circlePurple: {
    backgroundColor: 'rgba(88,86,214,0.15)',
    left: 34,
    top: 0,
  },
  circleOrange: {
    backgroundColor: 'rgba(255,149,0,0.15)',
    left: 62,
    top: 18,
  },
  sun: {
    position: 'absolute',
    fontSize: 28,
    left: 44,
    top: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
});
