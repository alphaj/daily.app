import React, { memo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import type { Todo, TimeOfDay } from '@/types/todo';
import { BLOCK_ACCENT_COLORS } from './constants';

const GHOST_TINTS: Record<TimeOfDay, { card: string; border: string; emoji: string }> = {
  anytime:   { card: '#FFFFFF',              border: 'rgba(0,0,0,0.08)',       emoji: 'rgba(120,120,128,0.08)' },
  morning:   { card: '#FFFDF5',              border: 'rgba(255,204,0,0.22)',   emoji: 'rgba(255,204,0,0.14)' },
  afternoon: { card: '#FFFBF5',              border: 'rgba(255,149,0,0.22)',   emoji: 'rgba(255,149,0,0.14)' },
  evening:   { card: '#F9F8FF',              border: 'rgba(88,86,214,0.20)',   emoji: 'rgba(88,86,214,0.14)' },
};

interface DragGhostProps {
  todo: Todo;
  ghostY: SharedValue<number>;
  width: number;
  height: number;
  left: number;
  timeLabel: string;
}

export const DragGhost = memo(function DragGhost({
  todo,
  ghostY,
  width,
  height,
  left,
  timeLabel,
}: DragGhostProps) {
  const timeOfDay: TimeOfDay = todo.timeOfDay || 'anytime';
  const accent = BLOCK_ACCENT_COLORS[timeOfDay];
  const tint = GHOST_TINTS[timeOfDay];
  const blockHeight = Math.max(height, 28);
  const showEmoji = !!todo.emoji && blockHeight >= 52;

  const animatedStyle = useAnimatedStyle(() => ({
    top: ghostY.value,
    left,
    width: width - 6,
    height: blockHeight,
  }));

  return (
    <Animated.View
      style={[
        styles.ghost,
        { backgroundColor: tint.card, borderColor: tint.border },
        animatedStyle,
      ]}
      pointerEvents="none"
    >
      {/* Accent strip */}
      <View style={[styles.accentStrip, { backgroundColor: accent }]} />

      <View style={styles.content}>
        {showEmoji && (
          <View style={[styles.emojiCircle, { backgroundColor: tint.emoji }]}>
            <Text style={styles.emoji}>{todo.emoji}</Text>
          </View>
        )}

        <View style={styles.textCol}>
          <Text style={styles.title} numberOfLines={1}>
            {!showEmoji && todo.emoji ? `${todo.emoji}  ` : ''}{todo.title}
          </Text>
          <View style={styles.timeBadge}>
            <Text style={styles.timeLabel}>{timeLabel}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  ghost: {
    position: 'absolute',
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    transform: [{ scale: 1.03 }],
    zIndex: 999,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  accentStrip: {
    position: 'absolute',
    left: 0,
    top: 4,
    bottom: 4,
    width: 3,
    borderRadius: 1.5,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 8,
    gap: 8,
  },
  emojiCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 15,
  },
  textCol: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.2,
  },
  timeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 59, 48, 0.10)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  timeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF3B30',
    letterSpacing: -0.1,
  },
});
