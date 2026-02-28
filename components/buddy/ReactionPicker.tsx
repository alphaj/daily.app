import React from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { REACTION_EMOJIS } from '@/types/interaction';
import * as Haptics from '@/lib/haptics';

interface ReactionPickerProps {
  visible: boolean;
  onSelect: (emoji: string) => void;
  onDismiss: () => void;
  anchorY: number;
}

export function ReactionPicker({ visible, onSelect, onDismiss, anchorY }: ReactionPickerProps) {
  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Animated.View
          entering={FadeIn.duration(150).springify().damping(18).stiffness(300)}
          exiting={FadeOut.duration(100)}
          style={[styles.pill, { top: Math.max(anchorY - 56, 60) }]}
        >
          {REACTION_EMOJIS.map((item) => (
            <Pressable
              key={item.emoji}
              style={styles.emojiButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(item.emoji);
              }}
            >
              <Text style={styles.emoji}>{item.emoji}</Text>
            </Pressable>
          ))}
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  pill: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 28,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  emojiButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 28,
  },
});
