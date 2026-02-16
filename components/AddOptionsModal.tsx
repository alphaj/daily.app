import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { PenLine, Repeat, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AddOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onAddTask: () => void;
  onAddHabit: () => void;
}

export function AddOptionsModal({
  visible,
  onClose,
  onAddTask,
  onAddHabit,
}: AddOptionsModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [isVisible, setIsVisible] = useState(visible);

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          damping: 20,
          stiffness: 300,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsVisible(false);
      });
    }
  }, [visible, scaleAnim, opacityAnim]);

  if (!isVisible) return null;

  return (
    <Modal
      transparent
      visible={true}
      statusBarTranslucent
      onRequestClose={onClose}
      animationType="none"
    >
      <View style={styles.container}>
        <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
            <BlurView
              intensity={Platform.OS === 'ios' ? 30 : 50}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          </Pressable>
        </Animated.View>

        <Animated.View
          style={[
            styles.contentContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Create New</Text>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.closeButtonPressed,
              ]}
            >
              <X size={20} color="#8E8E93" />
            </Pressable>
          </View>

          <View style={styles.optionsGrid}>
            <Pressable
              style={({ pressed }) => [
                styles.optionButton,
                pressed && styles.optionButtonPressed,
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                onAddTask();
              }}
            >
              <View style={[styles.iconContainer, styles.taskIconBg]}>
                <PenLine size={32} color="#007AFF" strokeWidth={2} />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.optionTitle}>Task</Text>
                <Text style={styles.optionDescription}>A one-off to-do item</Text>
              </View>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.optionButton,
                pressed && styles.optionButtonPressed,
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                onAddHabit();
              }}
            >
              <View style={[styles.iconContainer, styles.habitIconBg]}>
                <Repeat size={32} color="#5AC8FA" strokeWidth={2} fill="#5AC8FA" fillOpacity={0.2} />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.optionTitle}>Habit</Text>
                <Text style={styles.optionDescription}>Build a recurring goal</Text>
              </View>
            </Pressable>
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
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  contentContainer: {
    width: SCREEN_WIDTH - 48,
    maxWidth: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 32,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonPressed: {
    opacity: 0.7,
    backgroundColor: '#E5E5EA',
  },
  optionsGrid: {
    gap: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F2F2F7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },
  optionButtonPressed: {
    backgroundColor: '#F9F9F9',
    transform: [{ scale: 0.98 }],
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  taskIconBg: {
    backgroundColor: '#E3F2FD', // Light Blue
  },
  habitIconBg: {
    backgroundColor: '#E0F7FA', // Light Teal
  },
  textContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  optionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
});
