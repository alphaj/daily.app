import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';

/**
 * Enhanced haptic feedback patterns for iOS app interactions.
 * Provides richer haptic sequences beyond single impulse events.
 */
export function useHaptics() {
  /** Double tap confirmation - two quick light impacts */
  const doubleTap = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 80);
  }, []);

  /** Success celebration - escalating impact sequence */
  const celebration = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 100);
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 250);
  }, []);

  /** Streak milestone - emphasized pattern for achievements */
  const streakMilestone = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 120);
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 300);
  }, []);

  /** Soft tick - for selections, toggles, and small state changes */
  const softTick = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  /** Medium impact - primary actions */
  const action = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  /** Drag snap - feedback when an item snaps into place */
  const dragSnap = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
  }, []);

  /** Error / warning */
  const warning = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, []);

  /** Delete confirmation */
  const destructive = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, []);

  /** Priority selection - different intensity per level */
  const priority = useCallback((level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'high':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
    }
  }, []);

  return {
    doubleTap,
    celebration,
    streakMilestone,
    softTick,
    action,
    dragSnap,
    warning,
    destructive,
    priority,
  };
}
