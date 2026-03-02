import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { Lock } from 'lucide-react-native';

const SPRING = { damping: 20, stiffness: 300 };

interface BuddyPrivacyStateProps {
  partnerName: string;
}

export function BuddyPrivacyState({ partnerName }: BuddyPrivacyStateProps) {
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
      {/* Decorative outer ring */}
      <View style={styles.outerRing}>
        {/* Frosted circle */}
        <View style={styles.frostedCircle}>
          <Lock size={40} color="#8E8E93" strokeWidth={1.5} />
        </View>
      </View>

      <Text style={styles.title}>Private Mode</Text>
      <Text style={styles.subtitle}>
        {partnerName} has turned on private mode.{'\n'}
        Their data is hidden for now.
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
  outerRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  frostedCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
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
