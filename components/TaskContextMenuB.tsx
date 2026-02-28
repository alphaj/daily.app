import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Copy, Calendar, Pencil, Trash2 } from 'lucide-react-native';
import * as Haptics from '@/lib/haptics';

/**
 * Variant B — "Separated Floating Bubbles"
 * Inspired by Telegram / iMessage reactions
 * Each action is its own floating card with staggered entrance
 */

interface TaskContextMenuProps {
  visible: boolean;
  onClose: () => void;
  onCopy: () => void;
  onReschedule: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const menuItems = [
  { key: 'copy', label: 'Make a Copy', Icon: Copy, color: '#1C1C1E' },
  { key: 'reschedule', label: 'Tomorrow', Icon: Calendar, color: '#1C1C1E' },
  { key: 'edit', label: 'Edit', Icon: Pencil, color: '#1C1C1E' },
  { key: 'delete', label: 'Delete', Icon: Trash2, color: '#FF3B30' },
] as const;

function BubbleItem({
  item,
  index,
  visible,
  onPress,
}: {
  item: (typeof menuItems)[number];
  index: number;
  visible: boolean;
  onPress: () => void;
}) {
  const translateY = useSharedValue(20);
  const itemOpacity = useSharedValue(0);
  const itemScale = useSharedValue(0.7);

  useEffect(() => {
    if (visible) {
      const delay = index * 50;
      translateY.value = withDelay(delay, withSpring(0, { damping: 18, stiffness: 280 }));
      itemOpacity.value = withDelay(delay, withTiming(1, { duration: 200 }));
      itemScale.value = withDelay(delay, withSpring(1, { damping: 16, stiffness: 300 }));
    } else {
      translateY.value = withTiming(10, { duration: 100 });
      itemOpacity.value = withTiming(0, { duration: 100 });
      itemScale.value = withTiming(0.8, { duration: 100 });
    }
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: itemScale.value }],
    opacity: itemOpacity.value,
  }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        style={({ pressed }) => [styles.bubble, pressed && styles.bubblePressed]}
        onPress={onPress}
      >
        <View style={[styles.iconDot, item.key === 'delete' && styles.iconDotDelete]}>
          <item.Icon size={17} color={item.key === 'delete' ? '#FF3B30' : '#fff'} strokeWidth={2.2} />
        </View>
        <Text style={[styles.bubbleLabel, item.key === 'delete' && styles.deleteLabel]}>
          {item.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export function TaskContextMenuB({
  visible,
  onClose,
  onCopy,
  onReschedule,
  onEdit,
  onDelete,
}: TaskContextMenuProps) {
  const backdropOpacity = useSharedValue(0);
  const [isVisible, setIsVisible] = useState(visible);

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      backdropOpacity.value = withTiming(1, { duration: 200 });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 150 }, () => {
        runOnJS(setIsVisible)(false);
      });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const handleAction = (key: string) => {
    Haptics.selectionAsync();
    onClose();
    switch (key) {
      case 'copy': onCopy(); break;
      case 'reschedule': onReschedule(); break;
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
              <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.35)' }]} />
            ) : (
              <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
            )}
          </Pressable>
        </Animated.View>

        <View style={styles.bubblesContainer}>
          {menuItems.map((item, index) => (
            <BubbleItem
              key={item.key}
              item={item}
              index={index}
              visible={visible}
              onPress={() => handleAction(item.key)}
            />
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  bubblesContainer: {
    gap: 8,
    alignItems: 'center',
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    gap: 12,
    width: 220,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  bubblePressed: {
    backgroundColor: '#F5F5F5',
    transform: [{ scale: 0.97 }],
  },
  iconDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDotDelete: {
    backgroundColor: 'rgba(255,59,48,0.12)',
  },
  bubbleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.2,
  },
  deleteLabel: {
    color: '#FF3B30',
  },
});
