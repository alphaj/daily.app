import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import {
  Copy,
  Inbox,
  CalendarDays,
  ArrowRight,
  Play,
  SquarePen,
  Trash2,
} from 'lucide-react-native';
import * as Haptics from '@/lib/haptics';

interface TaskContextMenuProps {
  visible: boolean;
  onClose: () => void;
  onCopy: () => void;
  onMoveToTodo?: () => void;
  onReschedule: () => void;
  onRescheduleTomorrow: () => void;
  onStartTask?: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ICON_COLOR = '#3C3C43';
const DELETE_COLOR = '#FF3B30';

const allMenuItems = [
  { key: 'copy', label: 'Make a copy', Icon: Copy, color: ICON_COLOR, iconColor: ICON_COLOR },
  { key: 'moveToTodo', label: 'Move to To-do', Icon: Inbox, color: ICON_COLOR, iconColor: ICON_COLOR },
  { key: 'reschedule', label: 'Reschedule', Icon: CalendarDays, color: ICON_COLOR, iconColor: ICON_COLOR },
  { key: 'rescheduleTomorrow', label: 'Reschedule for Tomorrow', Icon: ArrowRight, color: ICON_COLOR, iconColor: ICON_COLOR },
  { key: 'startTask', label: 'Start task', Icon: Play, color: ICON_COLOR, iconColor: ICON_COLOR },
  { key: 'edit', label: 'Edit task', Icon: SquarePen, color: ICON_COLOR, iconColor: ICON_COLOR },
  { key: 'delete', label: 'Delete task', Icon: Trash2, color: DELETE_COLOR, iconColor: DELETE_COLOR },
] as const;

// iOS-style spring — critically damped, no bounce
const OPEN_SPRING = { damping: 28, stiffness: 420, mass: 0.9 };
const ITEM_STAGGER = 25; // ms between each item

function MenuItem({
  item,
  index,
  progress,
  onPress,
}: {
  item: (typeof allMenuItems)[number];
  index: number;
  progress: Animated.SharedValue<number>;
  onPress: () => void;
}) {
  const itemStyle = useAnimatedStyle(() => {
    // Each item keys off the main progress but with a stagger offset
    const delay = index * 0.06;
    const itemProgress = interpolate(
      progress.value,
      [delay, delay + 0.6],
      [0, 1],
      'clamp',
    );
    return {
      opacity: itemProgress,
      transform: [{ translateY: interpolate(itemProgress, [0, 1], [8, 0]) }],
    };
  });

  return (
    <Animated.View style={itemStyle}>
      <Pressable
        style={({ pressed }) => [
          styles.menuItem,
          pressed && styles.menuItemPressed,
        ]}
        onPress={onPress}
      >
        <View style={styles.iconWrap}>
          <item.Icon size={20} color={item.iconColor} strokeWidth={1.8} />
        </View>
        <Text style={[styles.menuLabel, { color: item.color }]}>
          {item.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export function TaskContextMenuD({
  visible,
  onClose,
  onCopy,
  onMoveToTodo,
  onReschedule,
  onRescheduleTomorrow,
  onStartTask,
  onEdit,
  onDelete,
}: TaskContextMenuProps) {
  const progress = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);
  const [isVisible, setIsVisible] = useState(false);

  const activeItems = useMemo(
    () =>
      allMenuItems.filter((item) => {
        if (item.key === 'moveToTodo' && !onMoveToTodo) return false;
        if (item.key === 'startTask' && !onStartTask) return false;
        return true;
      }),
    [onMoveToTodo, onStartTask],
  );

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      // Backdrop fades in quickly
      backdropOpacity.value = withTiming(1, {
        duration: 200,
        easing: Easing.out(Easing.quad),
      });
      // Card + items spring in
      progress.value = withSpring(1, OPEN_SPRING);
    } else if (isVisible) {
      // Dismiss: fast ease-out, no spring
      backdropOpacity.value = withTiming(0, { duration: 150 });
      progress.value = withTiming(0, { duration: 150, easing: Easing.in(Easing.quad) }, () => {
        runOnJS(setIsVisible)(false);
      });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.3], [0, 1], 'clamp'),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [40, 0]) },
      { scale: interpolate(progress.value, [0, 1], [0.96, 1]) },
    ],
  }));

  const handleAction = (key: string) => {
    Haptics.selectionAsync();
    onClose();
    switch (key) {
      case 'copy': onCopy(); break;
      case 'moveToTodo': onMoveToTodo?.(); break;
      case 'reschedule': onReschedule(); break;
      case 'rescheduleTomorrow': onRescheduleTomorrow(); break;
      case 'startTask': onStartTask?.(); break;
      case 'edit': onEdit(); break;
      case 'delete': onDelete(); break;
    }
  };

  if (!isVisible) return null;

  return (
    <Modal transparent visible statusBarTranslucent onRequestClose={onClose} animationType="none">
      <View style={styles.container}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
            {Platform.OS === 'web' ? (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.25)' }]} />
            ) : (
              <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
            )}
          </Pressable>
        </Animated.View>

        <Animated.View style={[styles.menuCard, cardStyle]}>
          <View style={styles.menuInner}>
            {activeItems.map((item, index) => (
              <MenuItem
                key={item.key}
                item={item}
                index={index}
                progress={progress}
                onPress={() => handleAction(item.key)}
              />
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 60,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  menuCard: {
    width: '88%',
    maxWidth: 380,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  menuInner: {
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 16,
  },
  menuItemPressed: {
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  iconWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: 17,
    fontWeight: '400',
    letterSpacing: -0.2,
  },
});
