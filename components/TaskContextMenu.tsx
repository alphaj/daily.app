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
import * as Haptics from 'expo-haptics';

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

export function TaskContextMenu({
  visible,
  onClose,
  onCopy,
  onReschedule,
  onEdit,
  onDelete,
}: TaskContextMenuProps) {
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);
  const [isVisible, setIsVisible] = useState(visible);

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      scale.value = withSpring(1, { damping: 22, stiffness: 320 });
      opacity.value = withTiming(1, { duration: 180 });
    } else {
      scale.value = withTiming(0.85, { duration: 120 });
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
      case 'copy':
        onCopy();
        break;
      case 'reschedule':
        onReschedule();
        break;
      case 'edit':
        onEdit();
        break;
      case 'delete':
        onDelete();
        break;
    }
  };

  if (!isVisible) return null;

  return (
    <Modal
      transparent
      visible
      statusBarTranslucent
      onRequestClose={onClose}
      animationType="none"
    >
      <View style={styles.container}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
            {Platform.OS === 'web' ? (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: 'rgba(0,0,0,0.4)' },
                ]}
              />
            ) : (
              <BlurView
                intensity={25}
                tint="dark"
                style={StyleSheet.absoluteFill}
              />
            )}
          </Pressable>
        </Animated.View>

        <Animated.View style={[styles.menuCard, contentStyle]}>
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
                <item.Icon size={20} color={item.color} strokeWidth={2} />
                <Text style={[styles.menuLabel, { color: item.color }]}>
                  {item.label}
                </Text>
              </Pressable>
            </React.Fragment>
          ))}
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
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5EA',
    marginLeft: 52,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItemPressed: {
    backgroundColor: '#F2F2F7',
  },
  menuLabel: {
    fontSize: 17,
    fontWeight: '500',
  },
});
