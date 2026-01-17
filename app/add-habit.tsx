import { useRouter } from 'expo-router';
import { X, Plus, ChevronDown, ChevronUp, ChevronLeft } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useHabits } from '@/contexts/HabitContext';
import type { DayOfWeek } from '@/types/habit';

// Popular habit emojis - just the essentials
const QUICK_EMOJIS = ['💪', '📚', '🧘', '💧', '🏃', '😴', '✍️', '🎯'];

// Full emoji list for expanded view
const ALL_EMOJIS = [
  '💪', '📚', '🧘', '💧', '🏃', '😴', '✍️', '🎯',
  '🏋️', '🚴', '🤸', '🏊', '⚽', '🎾', '💊', '🩺',
  '🧖', '💆', '🛁', '🌅', '☀️', '🌙', '🩷', '🧊',
  '🥗', '🍎', '🥑', '🥕', '🍵', '🍳', '🫐', '🥦',
  '💻', '📝', '📧', '⏰', '📅', '✅', '🗂️', '💼',
  '🎓', '📖', '🧠', '💡', '🎨', '🎵', '🎹', '🌐',
  '🙏', '🕯️', '🌸', '🍃', '🌿', '🦋', '✨', '💫',
  '👨‍👩‍👧', '💬', '📞', '🤝', '💌', '🎁', '🥰', '👋',
  '💰', '💵', '📈', '🏦', '💳', '🪙', '💎', '🏠',
  '🧹', '🧺', '🪴', '🛏️', '🧽', '🪥', '📦', '🧸',
];

// Days of the week for iOS-style picker
const DAYS_OF_WEEK: { label: string; short: string; value: DayOfWeek }[] = [
  { label: 'Sunday', short: 'S', value: 0 },
  { label: 'Monday', short: 'M', value: 1 },
  { label: 'Tuesday', short: 'T', value: 2 },
  { label: 'Wednesday', short: 'W', value: 3 },
  { label: 'Thursday', short: 'T', value: 4 },
  { label: 'Friday', short: 'F', value: 5 },
  { label: 'Saturday', short: 'S', value: 6 },
];

export default function AddHabitScreen() {
  const router = useRouter();
  const { addHabit } = useHabits();
  const [habitName, setHabitName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [showAllEmojis, setShowAllEmojis] = useState(false);
  const [whyStatement, setWhyStatement] = useState('');
  const [celebrationPhrase, setCelebrationPhrase] = useState('');
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([0, 1, 2, 3, 4, 5, 6]); // All days by default

  const handleSave = () => {
    if (habitName.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // If all days are selected, pass undefined (means every day)
      const scheduledDays = selectedDays.length === 7 ? undefined : selectedDays;
      addHabit(
        habitName.trim(),
        {},
        selectedEmoji || undefined,
        whyStatement.trim() || undefined,
        celebrationPhrase.trim() || undefined,
        scheduledDays
      );
      router.back();
    }
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const selectEmoji = (emoji: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedEmoji(selectedEmoji === emoji ? null : emoji);
  };

  const toggleEmojiPicker = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowAllEmojis(!showAllEmojis);
  };

  const toggleDay = (day: DayOfWeek) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDays(prev => {
      if (prev.includes(day)) {
        // Don't allow deselecting all days
        if (prev.length === 1) return prev;
        return prev.filter(d => d !== day);
      }
      return [...prev, day].sort((a, b) => a - b);
    });
  };

  const selectAllDays = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
  };

  const selectWeekdays = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDays([1, 2, 3, 4, 5]);
  };

  const hasName = habitName.trim().length > 0;
  const hasIcon = selectedEmoji !== null;
  const isValid = hasName && hasIcon;
  const needsIcon = hasName && !hasIcon; // Show hint when name is filled but icon isn't
  const isEveryDay = selectedDays.length === 7;
  const isWeekdaysOnly = selectedDays.length === 5 &&
    [1, 2, 3, 4, 5].every(d => selectedDays.includes(d as DayOfWeek));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={[styles.closeButton, { backgroundColor: '#fff' }]} onPress={handleCancel}>
            <ChevronLeft size={24} color="#000" strokeWidth={2} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Main Content */}
          <View style={styles.content}>
            {/* Selected Emoji Display */}
            <Pressable
              style={[
                styles.emojiDisplay,
                selectedEmoji && styles.emojiDisplayActive,
                needsIcon && styles.emojiDisplayNeedsSelection
              ]}
              onPress={() => setSelectedEmoji(null)}
            >
              <Text style={styles.emojiDisplayText}>
                {selectedEmoji || '✨'}
              </Text>
            </Pressable>
            {needsIcon && (
              <Text style={styles.iconHint}>Choose an icon for your habit</Text>
            )}

            {/* Habit Input */}
            <TextInput
              style={styles.input}
              placeholder="What habit are you building?"
              placeholderTextColor="#C7C7CC"
              value={habitName}
              onChangeText={setHabitName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />

            {/* Emoji Picker - iOS-style: one unified grid when expanded */}
            <View style={styles.emojiSection}>
              {/* Show quick row when collapsed, full grid when expanded */}
              {!showAllEmojis ? (
                <View style={styles.emojiRow}>
                  {QUICK_EMOJIS.map((emoji) => (
                    <Pressable
                      key={emoji}
                      style={[
                        styles.emojiButton,
                        selectedEmoji === emoji && styles.emojiButtonSelected,
                      ]}
                      onPress={() => selectEmoji(emoji)}
                    >
                      <Text style={styles.emojiText}>{emoji}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <View style={styles.allEmojisGrid}>
                  {ALL_EMOJIS.map((emoji, index) => (
                    <Pressable
                      key={`${emoji}-${index}`}
                      style={[
                        styles.emojiButtonSmall,
                        selectedEmoji === emoji && styles.emojiButtonSelected,
                      ]}
                      onPress={() => selectEmoji(emoji)}
                    >
                      <Text style={styles.emojiTextSmall}>{emoji}</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {/* More/Less Button */}
              <Pressable style={styles.moreButton} onPress={toggleEmojiPicker}>
                <Text style={styles.moreButtonText}>
                  {showAllEmojis ? 'Show less' : 'More icons'}
                </Text>
                {showAllEmojis ? (
                  <ChevronUp size={16} color="#5856D6" />
                ) : (
                  <ChevronDown size={16} color="#5856D6" />
                )}
              </Pressable>
            </View>

            {/* Day Selector Section */}
            <View style={styles.daySection}>
              <Text style={styles.daySectionLabel}>Repeat on</Text>

              {/* Quick Select Buttons */}
              <View style={styles.quickSelectRow}>
                <Pressable
                  style={[styles.quickSelectButton, isEveryDay && styles.quickSelectButtonActive]}
                  onPress={selectAllDays}
                >
                  <Text style={[styles.quickSelectText, isEveryDay && styles.quickSelectTextActive]}>
                    Every day
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.quickSelectButton, isWeekdaysOnly && styles.quickSelectButtonActive]}
                  onPress={selectWeekdays}
                >
                  <Text style={[styles.quickSelectText, isWeekdaysOnly && styles.quickSelectTextActive]}>
                    Weekdays
                  </Text>
                </Pressable>
              </View>

              {/* Day Pills */}
              <View style={styles.dayPillsRow}>
                {DAYS_OF_WEEK.map((day) => {
                  const isSelected = selectedDays.includes(day.value);
                  return (
                    <Pressable
                      key={day.value}
                      style={[
                        styles.dayPill,
                        isSelected && styles.dayPillSelected,
                      ]}
                      onPress={() => toggleDay(day.value)}
                    >
                      <Text style={[
                        styles.dayPillText,
                        isSelected && styles.dayPillTextSelected,
                      ]}>
                        {day.short}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Reflection Fields */}
            <View style={styles.reflectionSection}>
              <Text style={styles.reflectionLabel}>Why does this matter to you?</Text>
              <TextInput
                style={styles.reflectionInput}
                placeholder="Your personal reason for this habit..."
                placeholderTextColor="#C7C7CC"
                value={whyStatement}
                onChangeText={setWhyStatement}
                multiline
                maxLength={200}
              />

              <Text style={styles.reflectionLabel}>Celebration phrase (3 words)</Text>
              <TextInput
                style={[styles.reflectionInput, styles.celebrationInput]}
                placeholder="e.g., 'I did it!'"
                placeholderTextColor="#C7C7CC"
                value={celebrationPhrase}
                onChangeText={setCelebrationPhrase}
                maxLength={30}
              />
              <Text style={styles.reflectionHint}>
                We'll show these when you need motivation most
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Add Button */}
        <View style={styles.footer}>
          <Pressable
            style={[styles.addButton, !isValid && styles.addButtonDisabled]}
            onPress={handleSave}
            disabled={!isValid}
          >
            <Plus size={20} color="#fff" strokeWidth={2.5} />
            <Text style={styles.addButtonText}>Add Habit</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    alignItems: 'center',
    gap: 24,
  },
  emojiDisplay: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiDisplayActive: {
    backgroundColor: '#EEF0FF',
  },
  emojiDisplayNeedsSelection: {
    borderWidth: 2,
    borderColor: '#5856D6',
    borderStyle: 'dashed',
  },
  iconHint: {
    fontSize: 13,
    color: '#5856D6',
    fontWeight: '500',
    marginTop: -12,
  },
  emojiDisplayText: {
    fontSize: 36,
  },
  input: {
    width: '100%',
    fontSize: 20,
    fontWeight: '500',
    color: '#000',
    textAlign: 'center',
    paddingVertical: 16,
  },
  emojiSection: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  emojiButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiButtonSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiButtonSelected: {
    backgroundColor: '#5856D6',
    transform: [{ scale: 1.1 }],
  },
  emojiText: {
    fontSize: 22,
  },
  emojiTextSmall: {
    fontSize: 20,
  },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  moreButtonText: {
    fontSize: 14,
    color: '#5856D6',
    fontWeight: '500',
  },
  allEmojisGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 8,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#5856D6',
    paddingVertical: 16,
    borderRadius: 14,
  },
  addButtonDisabled: {
    opacity: 0.4,
  },
  addButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  reflectionSection: {
    width: '100%',
    marginTop: 8,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  reflectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
    marginTop: 16,
  },
  reflectionInput: {
    fontSize: 16,
    color: '#000',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 14,
    minHeight: 48,
    textAlignVertical: 'top',
  },
  celebrationInput: {
    minHeight: 48,
  },
  reflectionHint: {
    fontSize: 12,
    color: '#C7C7CC',
    marginTop: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Day Selector Styles
  daySection: {
    width: '100%',
    paddingTop: 8,
  },
  daySectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 12,
    textAlign: 'center',
  },
  quickSelectRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  quickSelectButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
  },
  quickSelectButtonActive: {
    backgroundColor: '#5856D6',
  },
  quickSelectText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  quickSelectTextActive: {
    color: '#fff',
  },
  dayPillsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dayPill: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPillSelected: {
    backgroundColor: '#5856D6',
  },
  dayPillText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8E8E93',
  },
  dayPillTextSelected: {
    color: '#fff',
  },
});
