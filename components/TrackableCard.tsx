import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActionSheetIOS,
  Alert,
} from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export type TrackableVariant = 'habit' | 'supplement' | 'breaking';

interface TrackableCardProps {
  id: string;
  emoji: string;
  title: string;
  subtitle?: string;
  /** 0-100, represents weekly or streak-based progress */
  progressPercent: number;
  /** Whether completed today */
  isComplete: boolean;
  variant?: TrackableVariant;
  /** Optional: 7-day completion array for mini dots (true = completed) */
  weekDots?: boolean[];
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  /** Compact mode for grid layout: smaller dimensions, no subtitle */
  compact?: boolean;
}

const CARD_SIZE = 100;
const RING_SIZE = 64;
const RING_STROKE = 5;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// Compact dimensions
const COMPACT_RING_SIZE = 48;
const COMPACT_RING_STROKE = 4;
const COMPACT_RING_RADIUS = (COMPACT_RING_SIZE - COMPACT_RING_STROKE) / 2;
const COMPACT_RING_CIRCUMFERENCE = 2 * Math.PI * COMPACT_RING_RADIUS;

export function TrackableCard({
  id,
  emoji,
  title,
  subtitle,
  progressPercent,
  isComplete,
  variant = 'habit',
  weekDots,
  onPress,
  onEdit,
  onDelete,
  compact = false,
}: TrackableCardProps) {
  const ringSize = compact ? COMPACT_RING_SIZE : RING_SIZE;
  const ringStroke = compact ? COMPACT_RING_STROKE : RING_STROKE;
  const ringRadius = compact ? COMPACT_RING_RADIUS : RING_RADIUS;
  const ringCircumference = compact ? COMPACT_RING_CIRCUMFERENCE : RING_CIRCUMFERENCE;
  const scale = useSharedValue(1);
  const progress = useSharedValue(isComplete ? Math.max(progressPercent, 100) : progressPercent);
  const checkOpacity = useSharedValue(isComplete ? 1 : 0);

  // Animate progress ring when completion state changes
  useEffect(() => {
    if (isComplete) {
      progress.value = withSpring(Math.max(progressPercent, 100), { damping: 12, stiffness: 40 });
      checkOpacity.value = withTiming(1, { duration: 200 });
    } else {
      progress.value = withTiming(progressPercent, { duration: 300 });
      checkOpacity.value = withTiming(0, { duration: 150 });
    }
  }, [isComplete, progressPercent]);

  const handlePress = useCallback(() => {
    // Escalating haptic feedback based on completion
    if (!isComplete) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    scale.value = withSequence(
      withTiming(0.92, { duration: 120 }),
      withSpring(1, { damping: 10, stiffness: 80 }),
    );

    onPress();
  }, [isComplete, onPress]);

  const handleLongPress = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    const options = [];
    const destructiveIndex = onDelete ? (onEdit ? 1 : 0) : -1;

    if (onEdit) options.push('Edit');
    if (onDelete) options.push('Delete');
    options.push('Cancel');

    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        destructiveButtonIndex: destructiveIndex,
        cancelButtonIndex: options.length - 1,
        title,
      },
      (buttonIndex) => {
        if (onEdit && buttonIndex === 0) {
          onEdit();
        } else if (onDelete && buttonIndex === (onEdit ? 1 : 0)) {
          Alert.alert(
            `Delete ${variant === 'supplement' ? 'Supplement' : 'Habit'}`,
            `Are you sure you want to delete "${title}"?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: onDelete,
              },
            ]
          );
        }
      }
    );
  }, [title, variant, onEdit, onDelete]);

  // Animated props for SVG strokeDashoffset (runs on UI thread)
  const animatedCircleProps = useAnimatedProps(() => {
    const clampedProgress = Math.min(Math.max(progress.value, 0), 100);
    return {
      strokeDashoffset: ringCircumference * (1 - clampedProgress / 100),
    };
  });

  // Animated style for scale bounce
  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Animated style for check badge opacity
  const checkStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
  }));

  // Color schemes based on variant and state
  const getColors = () => {
    if (variant === 'breaking') {
      return {
        ringBg: isComplete ? 'rgba(255, 107, 107, 0.15)' : '#F2F2F7',
        ringFill: isComplete ? '#FF6B6B' : '#FFB4B4',
        cardBg: isComplete ? '#FFF0F0' : '#FFFFFF',
        border: isComplete ? '#FFCDD2' : '#E5E5EA',
        titleColor: isComplete ? '#D32F2F' : '#000',
        checkBg: '#FF3B30',
        shadow: isComplete ? '#FF3B30' : '#000',
      };
    }
    // Default: habit (building)
    return {
      ringBg: isComplete ? 'rgba(88, 86, 214, 0.15)' : '#F2F2F7',
      ringFill: isComplete ? '#5856D6' : '#E5E5EA',
      cardBg: isComplete ? '#F5F5FF' : '#FFFFFF',
      border: isComplete ? '#E0E0FF' : '#E5E5EA',
      titleColor: isComplete ? '#5856D6' : '#000',
      checkBg: '#5856D6',
      shadow: isComplete ? '#5856D6' : '#000',
    };
  };

  const colors = getColors();

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={500}
      style={compact ? styles.compactContainer : styles.container}
    >
      <Animated.View
        style={[
          compact ? styles.compactIconContainer : styles.iconContainer,
          {
            backgroundColor: colors.cardBg,
            borderColor: colors.border,
            shadowColor: colors.shadow,
          },
          isComplete && styles.iconContainerTaken,
          scaleStyle,
        ]}
      >
        {/* Progress Ring */}
        <View style={compact ? styles.compactRingContainer : styles.ringContainer}>
          <Svg width={ringSize} height={ringSize}>
            <G rotation="-90" origin={`${ringSize / 2}, ${ringSize / 2}`}>
              {/* Background ring */}
              <Circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={ringRadius}
                stroke={colors.ringBg}
                strokeWidth={ringStroke}
                fill="transparent"
              />
              {/* Progress ring */}
              <AnimatedCircle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={ringRadius}
                stroke={colors.ringFill}
                strokeWidth={ringStroke}
                fill="transparent"
                strokeDasharray={ringCircumference}
                strokeLinecap="round"
                animatedProps={animatedCircleProps}
              />
            </G>
          </Svg>

          {/* Emoji centered in ring */}
          <View style={styles.emojiContainer}>
            <Text style={compact ? styles.compactEmoji : styles.emoji}>{emoji}</Text>
          </View>

          {/* Check overlay - Badge style now */}
          {isComplete && (
            <Animated.View
              style={[
                compact ? styles.compactBadge : styles.badge,
                { backgroundColor: colors.checkBg },
                checkStyle,
              ]}
            >
              <Text style={compact ? styles.compactCheckMark : styles.checkMark}>✓</Text>
            </Animated.View>
          )}

        </View>
      </Animated.View>

      <View style={compact ? styles.compactTextContainer : styles.textContainer}>
        <Text
          style={[
            compact ? styles.compactTitle : styles.title,
            isComplete && styles.titleTaken,
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>

        {!compact && subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 80,
    marginRight: 20,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 8,
  },
  iconContainerTaken: {
    shadowOpacity: 0.12,
  },
  ringContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 26,
  },
  badge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  textContainer: {
    alignItems: 'center',
    width: '120%',
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: 2,
  },
  titleTaken: {
    color: '#3C3C43',
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8E8E93',
    textAlign: 'center',
  },
  // Compact styles for grid layout
  compactContainer: {
    alignItems: 'center',
    width: '25%',
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  compactIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 6,
  },
  compactRingContainer: {
    width: COMPACT_RING_SIZE,
    height: COMPACT_RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactEmoji: {
    fontSize: 20,
  },
  compactBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  compactCheckMark: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  compactTextContainer: {
    alignItems: 'center',
    width: '100%',
  },
  compactTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
});
