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
 * Variant D — "Dark Context Card"
 * Inspired by Mercury / Raycast / Spotlight
 * Dark glassmorphic card, white text, compact and premium
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
  { key: 'copy', label: 'Make a Copy', Icon: Copy, color: 'rgba(255,255,255,0.9)', accent: '#64D2FF' },
  { key: 'reschedule', label: 'Tomorrow', Icon: Calendar, color: 'rgba(255,255,255,0.9)', accent: '#FFD60A' },
  { key: 'edit', label: 'Edit', Icon: Pencil, color: 'rgba(255,255,255,0.9)', accent: '#BF5AF2' },
  { key: 'delete', label: 'Delete', Icon: Trash2, color: '#FF453A', accent: '#FF453A' },
] as const;

export function TaskContextMenuD({
  visible,
  onClose,
  onCopy,
  onReschedule,
  onEdit,
  onDelete,
}: TaskContextMenuProps) {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);
  const [isVisible, setIsVisible] = useState(visible);

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      scale.value = withSpring(1, { damping: 22, stiffness: 340 });
      opacity.value = withTiming(1, { duration: 160 });
    } else {
      scale.value = withTiming(0.9, { duration: 120 });
      opacity.value = withTiming(0, { duration: 120 }, () => {
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
              <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
            ) : (
              <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
            )}
          </Pressable>
        </Animated.View>

        <Animated.View style={[styles.menuCard, contentStyle]}>
          {Platform.OS !== 'web' && (
            <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
          )}
          <View style={styles.menuInner}>
            {menuItems.map((item, index) => (
              <React.Fragment key={item.key}>
                {index > 0 && <View style={styles.separator} />}
                <Pressable
                  style={({ pressed }) => [
                    styles.menuItem,
                    pressed && styles.menuItemPressed,
                  ]}
                  onPress={() => handleAction(item.key)}
                >
                  <View style={styles.iconWrap}>
                    <item.Icon size={18} color={item.accent} strokeWidth={2} />
                  </View>
                  <Text style={[styles.menuLabel, { color: item.color }]}>
                    {item.label}
                  </Text>
                </Pressable>
              </React.Fragment>
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
    width: 240,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Platform.OS === 'web' ? 'rgba(30,30,30,0.95)' : 'rgba(30,30,30,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 30,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  menuInner: {
    paddingVertical: 4,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItemPressed: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  iconWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
});
