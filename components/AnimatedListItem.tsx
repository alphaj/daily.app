import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle, StyleProp } from 'react-native';

interface AnimatedListItemProps {
  index: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Delay between each item in ms */
  staggerDelay?: number;
  /** Base delay before any animation starts */
  baseDelay?: number;
  /** Duration of the fade/slide in ms */
  duration?: number;
  /** How far down items start before sliding up */
  slideDistance?: number;
}

export function AnimatedListItem({
  index,
  children,
  style,
  staggerDelay = 50,
  baseDelay = 100,
  duration = 350,
  slideDistance = 20,
}: AnimatedListItemProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(slideDistance)).current;

  useEffect(() => {
    const delay = baseDelay + index * staggerDelay;

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay,
        useNativeDriver: true,
        damping: 18,
        stiffness: 120,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
