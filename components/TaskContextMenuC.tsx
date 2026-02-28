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
 * Variant C — "Bottom Drawer Icon Grid"
 * Inspired by Things 3 / Notion
 * Compact sheet at bottom, horizontal icon grid with labels beneath
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
  { key: 'copy', label: 'Copy', Icon: Copy, color: '#007AFF' },
  { key: 'reschedule', label: 'Tomorrow', Icon: Calendar, color: '#FF9500' },
  { key: 'edit', label: 'Edit', Icon: Pencil, color: '#5856D6' },
  { key: 'delete', label: 'Delete', Icon: Trash2, color: '#FF3B30' },
] as const;

export function TaskContextMenuC({
  visible,
  onClose,
  onCopy,
  onReschedule,
  onEdit,
  onDelete,
}: TaskContextMenuProps) {
  const translateY = useSharedValue(200);
  const backdropOpacity = useSharedValue(0);
  const [isVisible, setIsVisible] = useState(visible);

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      translateY.value = withSpring(0, { damping: 24, stiffness: 280 });
      backdropOpacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withTiming(200, { duration: 200 });
      backdropOpacity.value = withTiming(0, { duration: 200 }, () => {
        runOnJS(setIsVisible)(false);
      });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
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
              <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
            )}
          </Pressable>
        </Animated.View>

        <Animated.View style={[styles.sheet, sheetStyle]}>
          <View style={styles.handleBar} />
          <View style={styles.grid}>
            {menuItems.map((item) => (
              <Pressable
                key={item.key}
                style={({ pressed }) => [styles.gridItem, pressed && styles.gridItemPressed]}
                onPress={() => handleAction(item.key)}
              >
                <View style={[styles.iconContainer, { backgroundColor: `${item.color}14` }]}>
                  <item.Icon size={22} color={item.color} strokeWidth={2} />
                </View>
                <Text style={[styles.gridLabel, { color: item.color }]}>
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
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 44 : 24,
    paddingHorizontal: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D1D6',
    alignSelf: 'center',
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  gridItem: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
    minWidth: 70,
  },
  gridItemPressed: {
    backgroundColor: 'rgba(0,0,0,0.04)',
    transform: [{ scale: 0.95 }],
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});
