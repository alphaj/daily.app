import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronDown, ChevronUp, ChevronLeft } from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
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

// Full emoji list for picker
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
  '🚫', '🙅', '🍃', '🌟',
];

// Quick emojis based on habit type
const QUICK_EMOJIS_BUILDING = ['💪', '📚', '🧘', '💧', '🏃', '😴', '✍️', '🎯'];
const QUICK_EMOJIS_BREAKING = ['🚫', '🙅', '💪', '🧘', '🍃', '✨', '🎯', '🌟'];

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

export default function EditHabitScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { habits, updateHabit } = useHabits();

  const habit = habits.find(h => h.id === id);

  const [habitName, setHabitName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [showAllEmojis, setShowAllEmojis] = useState(false);
  const [whyStatement, setWhyStatement] = useState('');
  const [celebrationPhrase, setCelebrationPhrase] = useState('');
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([0, 1, 2, 3, 4, 5, 6]);

  // Load existing habit data
  useEffect(() => {
    if (habit) {
      setHabitName(habit.name);
      setSelectedEmoji(habit.emoji || null);
      setWhyStatement(habit.whyStatement || '');
      setCelebrationPhrase(habit.celebrationPhrase || '');
      setSelectedDays(habit.scheduledDays || [0, 1, 2, 3, 4, 5, 6]);
    }
  }, [habit]);

  // Get appropriate emojis based on habit type
  const QUICK_EMOJIS = habit?.type === 'breaking' ? QUICK_EMOJIS_BREAKING : QUICK_EMOJIS_BUILDING;

  const handleSave = async () => {
    if (habitName.trim() && id) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const scheduledDays = selectedDays.length === 7 ? undefined : selectedDays;
      await updateHabit(id, {
        name: habitName.trim(),
        emoji: selectedEmoji || undefined,
        whyStatement: whyStatement.trim() || undefined,
        celebrationPhrase: celebrationPhrase.trim() || undefined,
        scheduledDays,
      });
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

  if (!habit) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Habit not found</Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const hasName = habitName.trim().length > 0;
  const hasIcon = selectedEmoji !== null;
  const isValid = hasName && hasIcon;
  const needsIcon = hasName && !hasIcon;
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
          <Pressable style={styles.closeButton} onPress={handleCancel}>
            <ChevronLeft size={24} color="#000" strokeWidth={1.5} />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Habit</Text>
          <Pressable
            style={[styles.createButton, !isValid && styles.createButtonDisabled]}
            onPress={handleSave}
            disabled={!isValid}
          >
            <Text style={[styles.createButtonText, !isValid && styles.createButtonTextDisabled]}>
              Save
            </Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Main Content */}
          <View style={styles.content}>
            {/* Type Badge (read-only) */}
            <View style={[
              styles.typeBadge,
              habit.type === 'breaking' && styles.typeBadgeBreaking
            ]}>
              <Text style={styles.typeBadgeText}>
                {habit.type === 'building' ? '🌱 Building Habit' : '🚫 Breaking Habit'}
              </Text>
            </View>

            {/* Selected Emoji Display */}
            <Pressable
              style={[
                styles.emojiDisplay,
                selectedEmoji && styles.emojiDisplayActive,
                selectedEmoji && habit.type === 'breaking' && styles.emojiDisplayActiveBreaking,
                needsIcon && styles.emojiDisplayNeedsSelection
              ]}
              onPress={() => setSelectedEmoji(null)}
            >
              <Text style={styles.emojiDisplayText}>
                {selectedEmoji || (habit.type === 'building' ? '🌱' : '🚫')}
              </Text>
            </Pressable>
            {needsIcon && (
              <Text style={styles.iconHint}>Choose an icon for your habit</Text>
            )}

            {/* Habit Input */}
            <TextInput
              style={styles.input}
              placeholder={habit.type === 'building' ? "What habit are you building?" : "What habit are you breaking?"}
              placeholderTextColor="#C7C7CC"
              value={habitName}
              onChangeText={setHabitName}
              returnKeyType="done"
            />

            {/* Emoji Picker */}
            <View style={styles.emojiSection}>
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  createButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#000',
    borderRadius: 100,
  },
  createButtonDisabled: {
    backgroundColor: '#E5E5EA',
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  createButtonTextDisabled: {
    color: '#8E8E93',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    alignItems: 'center',
    gap: 28,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#8E8E93',
    marginBottom: 20,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#000',
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  typeBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#E8F5E9',
    borderRadius: 20,
  },
  typeBadgeBreaking: {
    backgroundColor: '#FFEBEE',
  },
  typeBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  emojiDisplay: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  emojiDisplayActive: {
    backgroundColor: '#F0F4FF',
  },
  emojiDisplayActiveBreaking: {
    backgroundColor: '#FFF0F0',
  },
  emojiDisplayNeedsSelection: {
    borderWidth: 1.5,
    borderColor: '#5856D6',
    borderStyle: 'dashed',
  },
  iconHint: {
    fontSize: 14,
    color: '#5856D6',
    fontWeight: '500',
    marginTop: -16,
  },
  emojiDisplayText: {
    fontSize: 40,
  },
  input: {
    width: '100%',
    fontSize: 22,
    fontWeight: '500',
    color: '#1C1C1E',
    textAlign: 'center',
    paddingVertical: 12,
    letterSpacing: -0.3,
  },
  emojiSection: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  emojiButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiButtonSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiButtonSelected: {
    backgroundColor: '#5856D6',
    transform: [{ scale: 1.08 }],
    shadowColor: '#5856D6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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
    paddingHorizontal: 16,
    marginTop: 4,
  },
  moreButtonText: {
    fontSize: 15,
    color: '#5856D6',
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  allEmojisGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    paddingTop: 8,
  },
  reflectionSection: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  reflectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 10,
    marginTop: 0,
    letterSpacing: -0.1,
  },
  reflectionInput: {
    fontSize: 16,
    color: '#1C1C1E',
    backgroundColor: '#F5F5F7',
    borderRadius: 14,
    padding: 16,
    minHeight: 52,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  celebrationInput: {
    minHeight: 52,
  },
  reflectionHint: {
    fontSize: 13,
    color: '#AEAEB2',
    marginTop: 4,
    textAlign: 'center',
    fontStyle: 'normal',
    letterSpacing: -0.1,
  },
  daySection: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  daySectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: -0.1,
  },
  quickSelectRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },
  quickSelectButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: '#F5F5F7',
  },
  quickSelectButtonActive: {
    backgroundColor: '#5856D6',
    shadowColor: '#5856D6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },
  quickSelectText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: -0.2,
  },
  quickSelectTextActive: {
    color: '#fff',
  },
  dayPillsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dayPill: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPillSelected: {
    backgroundColor: '#5856D6',
    shadowColor: '#5856D6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },
  dayPillText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#AEAEB2',
    letterSpacing: -0.2,
  },
  dayPillTextSelected: {
    color: '#fff',
  },
});
