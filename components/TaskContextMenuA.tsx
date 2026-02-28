import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Copy, Calendar, Pencil, Trash2 } from 'lucide-react-native';
import * as Haptics from '@/lib/haptics';

/**
 * Variant A — "Glassmorphism Floating Card"
 * Inspired by Linear / Arc
 * Frosted glass card, colored icon circles, generous spacing
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
  { key: 'copy', label: 'Make a Copy', Icon: Copy, iconColor: '#007AFF', bgColor: 'rgba(0,122,255,0.12)' },
  { key: 'reschedule', label: 'Tomorrow', Icon: Calendar, iconColor: '#FF9500', bgColor: 'rgba(255,149,0,0.12)' },
  { key: 'edit', label: 'Edit', Icon: Pencil, iconColor: '#5856D6', bgColor: 'rgba(88,86,214,0.12)' },
  { key: 'delete', label: 'Delete', Icon: Trash2, iconColor: '#FF3B30', bgColor: 'rgba(255,59,48,0.12)' },
] as const;

export function TaskContextMenuA({
  visible,
  onClose,
  onCopy,
  onReschedule,
  onEdit,
  onDelete,
}: TaskContextMenuProps) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const [isVisible, setIsVisible] = useState(visible);

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      scale.value = withSpring(1, { damping: 20, stiffness: 300 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      scale.value = withTiming(0.8, { duration: 150 });
      opacity.value = withTiming(0, { duration: 150 }, () => {
        runOnJS(setIsVisible)(false);
      });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
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
              <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)' }]} />
            ) : (
              <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
            )}
          </Pressable>
        </Animated.View>

        <Animated.View style={[styles.menuCard, contentStyle]}>
          {Platform.OS !== 'web' && (
            <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
          )}
          <View style={styles.menuInner}>
            {menuItems.map((item, index) => (
              <Pressable
                key={item.key}
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed && styles.menuItemPressed,
                ]}
                onPress={() => handleAction(item.key)}
              >
                <View style={[styles.iconCircle, { backgroundColor: item.bgColor }]}>
                  <item.Icon size={18} color={item.iconColor} strokeWidth={2.2} />
                </View>
                <Text style={[styles.menuLabel, item.key === 'delete' && styles.deleteLabel]}>
                  {item.label}
                </Text>
              </Pressable>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  menuCard: {
    width: 260,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Platform.OS === 'web' ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 32,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  menuInner: {
    padding: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    gap: 14,
  },
  menuItemPressed: {
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    letterSpacing: -0.2,
  },
  deleteLabel: {
    color: '#FF3B30',
  },
});
