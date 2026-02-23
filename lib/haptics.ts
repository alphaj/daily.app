import * as ExpoHaptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

let _enabled = true;

// Initialize from stored preferences
AsyncStorage.getItem('daily_preferences').then((raw) => {
  if (raw) {
    try {
      const prefs = JSON.parse(raw);
      if (prefs.hapticsEnabled === false) _enabled = false;
    } catch {}
  }
});

/** Called by PreferencesContext when the setting changes */
export function setHapticsEnabled(enabled: boolean) {
  _enabled = enabled;
}

export async function selectionAsync() {
  if (_enabled) return ExpoHaptics.selectionAsync();
}

export async function impactAsync(style?: ExpoHaptics.ImpactFeedbackStyle) {
  if (_enabled) return ExpoHaptics.impactAsync(style);
}

export async function notificationAsync(type?: ExpoHaptics.NotificationFeedbackType) {
  if (_enabled) return ExpoHaptics.notificationAsync(type);
}

export { ImpactFeedbackStyle, NotificationFeedbackType } from 'expo-haptics';
