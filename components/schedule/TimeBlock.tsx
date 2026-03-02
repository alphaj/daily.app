import React, { memo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import type { Todo, TimeOfDay } from '@/types/todo';
import { BLOCK_ACCENT_COLORS } from './constants';
import { formatDisplayTime, getDisplayTime } from './utils';
import * as Haptics from '@/lib/haptics';

const SECTION_TINTS: Record<TimeOfDay, { card: string; border: string; emoji: string }> = {
  anytime:   { card: '#FFFFFF',              border: 'rgba(0,0,0,0.06)',       emoji: 'rgba(120,120,128,0.08)' },
  morning:   { card: '#FFFDF5',              border: 'rgba(255,204,0,0.18)',   emoji: 'rgba(255,204,0,0.14)' },
  afternoon: { card: '#FFFBF5',              border: 'rgba(255,149,0,0.18)',   emoji: 'rgba(255,149,0,0.14)' },
  evening:   { card: '#F9F8FF',              border: 'rgba(88,86,214,0.16)',   emoji: 'rgba(88,86,214,0.14)' },
};

interface TimeBlockProps {
  todo: Todo;
  top: number;
  height: number;
  left: number;
  width: number;
  onTap?: (todo: Todo) => void;
  onDragStart?: (todo: Todo, absoluteY: number) => void;
  onDragUpdate?: (absoluteY: number) => void;
  onDragEnd?: () => void;
}

export const TimeBlock = memo(function TimeBlock({
  todo,
  top,
  height,
  left,
  width,
  onTap,
  onDragStart,
  onDragUpdate,
  onDragEnd,
}: TimeBlockProps) {
  const timeOfDay: TimeOfDay = todo.timeOfDay || 'anytime';
  const accent = BLOCK_ACCENT_COLORS[timeOfDay];
  const tint = SECTION_TINTS[timeOfDay];
  const isCompleted = todo.completed;

  const pressed = useSharedValue(false);

  const displayTime = getDisplayTime(todo);
  const dur = todo.estimatedMinutes || 30;
  const endMinutes =
    parseInt(displayTime.split(':')[0]) * 60 +
    parseInt(displayTime.split(':')[1]) +
    dur;
  const endH = Math.floor(endMinutes / 60);
  const endM = endMinutes % 60;
  const endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

  const durationLabel = dur >= 60
    ? `${Math.floor(dur / 60)}h${dur % 60 > 0 ? ` ${dur % 60}m` : ''}`
    : `${dur}m`;

  const fireDragStart = (absY: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDragStart?.(todo, absY);
  };

  const tap = Gesture.Tap().onEnd(() => {
    if (onTap) runOnJS(onTap)(todo);
  });

  const pan = Gesture.Pan()
    .activateAfterLongPress(400)
    .onStart((e) => {
      pressed.value = true;
      if (onDragStart) runOnJS(fireDragStart)(e.absoluteY);
    })
    .onUpdate((e) => {
      if (onDragUpdate) runOnJS(onDragUpdate)(e.absoluteY);
    })
    .onEnd(() => {
      pressed.value = false;
      if (onDragEnd) runOnJS(onDragEnd)();
    })
    .onFinalize(() => {
      pressed.value = false;
    });

  const gesture = Gesture.Exclusive(pan, tap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(pressed.value ? 0.97 : 1, { damping: 15, stiffness: 400 }) }],
    opacity: withSpring(pressed.value ? 0.8 : 1, { damping: 20 }),
  }));

  // Adaptive layout based on available height
  const blockHeight = Math.max(height, 28);
  const showEmoji = !!todo.emoji && blockHeight >= 52;
  const showTime = blockHeight >= 38;
  const showDuration = blockHeight >= 60 && !showEmoji;

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          styles.block,
          {
            top,
            left,
            width: width - 6,
            height: blockHeight,
            backgroundColor: tint.card,
            borderColor: tint.border,
          },
          isCompleted && styles.blockCompleted,
          animatedStyle,
        ]}
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
            <Text
              style={[styles.title, isCompleted && styles.titleCompleted]}
              numberOfLines={1}
            >
              {!showEmoji && todo.emoji ? `${todo.emoji}  ` : ''}{todo.title}
            </Text>

            {showTime && (
              <View style={styles.metaRow}>
                <Text style={[styles.time, isCompleted && styles.timeCompleted]} numberOfLines={1}>
                  {formatDisplayTime(displayTime)} – {formatDisplayTime(endTime)}
                </Text>
                {showDuration && (
                  <View style={styles.durationPill}>
                    <Text style={styles.durationText}>{durationLabel}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  block: {
    position: 'absolute',
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  blockCompleted: {
    opacity: 0.5,
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
    gap: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.2,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: '#AEAEB2',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  time: {
    fontSize: 11,
    fontWeight: '400',
    color: '#8E8E93',
    letterSpacing: -0.1,
  },
  timeCompleted: {
    color: '#C7C7CC',
  },
  durationPill: {
    backgroundColor: 'rgba(120,120,128,0.08)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  durationText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#8E8E93',
  },
});
