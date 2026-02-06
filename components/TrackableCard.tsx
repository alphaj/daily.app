import React, { useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  ActionSheetIOS,
  Alert,
} from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useHaptics } from '@/hooks/useHaptics';

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
  energyLevel?: 'low' | 'medium' | 'high';
}

const CARD_SIZE = 100;
const RING_SIZE = 64;
const RING_STROKE = 5;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

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
  energyLevel,
}: TrackableCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(isComplete ? progressPercent : 0)).current;
  const checkOpacity = useRef(new Animated.Value(isComplete ? 1 : 0)).current;
  const badgeScale = useRef(new Animated.Value(isComplete ? 1 : 0)).current;
  const haptics = useHaptics();

  // Animate progress ring when completion state changes
  useEffect(() => {
    if (isComplete) {
      Animated.parallel([
        Animated.spring(progressAnim, {
          toValue: Math.max(progressPercent, 100),
          friction: 8,
          tension: 40,
          useNativeDriver: false,
        }),
        Animated.timing(checkOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(badgeScale, {
          toValue: 1,
          friction: 4,
          tension: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(progressAnim, {
          toValue: progressPercent,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(checkOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(badgeScale, {
          toValue: 0,
          friction: 6,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isComplete, progressPercent]);

  const handlePress = useCallback(() => {
    if (!isComplete) {
      haptics.doubleTap();
    } else {
      haptics.softTick();
    }

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.88,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 200,
        useNativeDriver: true,
      }),
    ]).start();

    onPress();
  }, [isComplete, onPress, scaleAnim, haptics]);

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

  // Calculate stroke dash offset for progress
  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [RING_CIRCUMFERENCE, 0],
    extrapolate: 'clamp',
  });

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
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.iconContainer,
          {
            backgroundColor: colors.cardBg,
            borderColor: colors.border,
            transform: [{ scale: scaleAnim }],
            shadowColor: colors.shadow,
          },
          isComplete && styles.iconContainerTaken
        ]}
      >
        {/* Progress Ring */}
        <View style={styles.ringContainer}>
          <Svg width={RING_SIZE} height={RING_SIZE}>
            <G rotation="-90" origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}>
              {/* Background ring */}
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke={colors.ringBg}
                strokeWidth={RING_STROKE}
                fill="transparent"
              />
              {/* Progress ring */}
              <AnimatedCircle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke={colors.ringFill}
                strokeWidth={RING_STROKE}
                fill="transparent"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </G>
          </Svg>

          {/* Emoji centered in ring */}
          <View style={styles.emojiContainer}>
            <Text style={styles.emoji}>{emoji}</Text>
          </View>

          {/* Check overlay - Animated badge */}
          <Animated.View
            style={[
              styles.badge,
              {
                backgroundColor: colors.checkBg,
                opacity: checkOpacity,
                transform: [{ scale: badgeScale }],
              }
            ]}
            pointerEvents={isComplete ? 'auto' : 'none'}
          >
            <Text style={styles.checkMark}>✓</Text>
          </Animated.View>

          {/* Energy Indicator */}
          {energyLevel && (
            <View style={styles.energyIndicator}>
              <Text style={styles.energyIndicatorText}>
                {energyLevel === 'low' ? '🔋' : energyLevel === 'medium' ? '⚡️' : '🔥'}
              </Text>
            </View>
          )}
        </View>
      </Animated.View>

      <View style={styles.textContainer}>
        <Text
          style={[styles.title, isComplete && styles.titleTaken]}
          numberOfLines={1}
        >
          {title}
        </Text>

        {subtitle && (
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
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 8,
  },
  iconContainerTaken: {
    shadowOpacity: 0.2,
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
  energyIndicator: {
    position: 'absolute',
    top: -10,
    left: -10,
    backgroundColor: '#fff',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 10,
  },
  energyIndicatorText: {
    fontSize: 12,
  },
});
