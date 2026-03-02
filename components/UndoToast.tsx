import React, { useEffect, useRef } from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

const TOAST_DURATION = 4000;

interface UndoToastProps {
  message: string;
  visible: boolean;
  onUndo: () => void;
  onDismiss: () => void;
}

export function UndoToast({ message, visible, onUndo, onDismiss }: UndoToastProps) {
  const translateY = useSharedValue(80);
  const opacity = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });
      opacity.value = withTiming(1, { duration: 300 });

      timerRef.current = setTimeout(() => {
        dismiss();
      }, TOAST_DURATION);
    } else {
      translateY.value = withTiming(80, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible]);

  const dismiss = () => {
    translateY.value = withTiming(80, { duration: 200 });
    opacity.value = withTiming(0, { duration: 200 });
    setTimeout(onDismiss, 220);
  };

  const handleUndo = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    onUndo();
    dismiss();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Text style={styles.message} numberOfLines={1}>{message}</Text>
      <Pressable onPress={handleUndo} hitSlop={8}>
        <Text style={styles.undoText}>Undo</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  message: {
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
    flex: 1,
    marginRight: 16,
  },
  undoText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#007AFF',
  },
});
