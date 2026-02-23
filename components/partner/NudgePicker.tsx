import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown, Easing } from 'react-native-reanimated';
import { NUDGE_TEMPLATES } from '@/types/interaction';
import * as Haptics from '@/lib/haptics';

interface NudgePickerProps {
  visible: boolean;
  onSelect: (emoji: string, message: string) => void;
  onDismiss: () => void;
}

const COOLDOWN_MS = 30_000;

export function NudgePicker({ visible, onSelect, onDismiss }: NudgePickerProps) {
  const [lastSentAt, setLastSentAt] = useState(0);

  const handleSelect = useCallback(
    (emoji: string, message: string) => {
      const now = Date.now();
      if (now - lastSentAt < COOLDOWN_MS) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setLastSentAt(now);
      onSelect(emoji, message);
    },
    [lastSentAt, onSelect],
  );

  const isCooling = Date.now() - lastSentAt < COOLDOWN_MS;

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Animated.View
          entering={SlideInDown.duration(200).easing(Easing.out(Easing.quad))}
          exiting={SlideOutDown.duration(150).easing(Easing.in(Easing.quad))}
          style={styles.sheet}
        >
          <View style={styles.handle} />
          <Text style={styles.title}>Send a nudge</Text>
          {NUDGE_TEMPLATES.map((tmpl) => (
            <Pressable
              key={tmpl.message}
              style={[styles.row, isCooling && styles.rowDisabled]}
              onPress={() => handleSelect(tmpl.emoji, tmpl.message)}
              disabled={isCooling}
            >
              <Text style={styles.rowEmoji}>{tmpl.emoji}</Text>
              <Text style={styles.rowMessage}>{tmpl.message}</Text>
            </Pressable>
          ))}
          {isCooling && (
            <Text style={styles.cooldownText}>Wait a moment before sending another</Text>
          )}
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D1D6',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(120,120,128,0.06)',
    marginBottom: 8,
  },
  rowDisabled: {
    opacity: 0.4,
  },
  rowEmoji: {
    fontSize: 22,
  },
  rowMessage: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    flex: 1,
  },
  cooldownText: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
  },
});
