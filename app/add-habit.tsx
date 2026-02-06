import { useRouter } from 'expo-router';
import { X, ChevronDown, ChevronUp, ChevronLeft } from 'lucide-react-native';
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
  Modal,
  Switch,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useHabits } from '@/contexts/HabitContext';
import { useWorkMode } from '@/contexts/WorkModeContext';
import type { DayOfWeek, HabitType, ImplementationIntention } from '@/types/habit';
import { WorkToggleRow } from '@/components/WorkToggleRow';

// Popular habit emojis - just the essentials for building habits
const QUICK_EMOJIS_BUILDING = ['💪', '📚', '🧘', '💧', '🏃', '😴', '✍️', '🎯'];

// Popular emojis for breaking habits
const QUICK_EMOJIS_BREAKING = ['🚫', '🙅', '💪', '🧘', '🍃', '✨', '🎯', '🌟'];

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
  const { isWorkMode } = useWorkMode();
  const [habitName, setHabitName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [showAllEmojis, setShowAllEmojis] = useState(false);
  const [whyStatement, setWhyStatement] = useState('');
  const [celebrationPhrase, setCelebrationPhrase] = useState('');
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([0, 1, 2, 3, 4, 5, 6]); // All days by default
  const [isWork, setIsWork] = useState(isWorkMode); // Default to current mode
  const [habitType, setHabitType] = useState<HabitType>('building');
  const [triggerNotes, setTriggerNotes] = useState('');
  const [energyLevel, setEnergyLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [hasPreferredTime, setHasPreferredTime] = useState(false);
  const [preferredTime, setPreferredTime] = useState('09:00');
  const [showTimePicker, setShowTimePicker] = useState(false);
  // Implementation intention fields
  const [intentionCue, setIntentionCue] = useState('');
  const [intentionWhere, setIntentionWhere] = useState('');
  const [intentionInstead, setIntentionInstead] = useState('');

  // Get appropriate emojis based on habit type
  const QUICK_EMOJIS = habitType === 'building' ? QUICK_EMOJIS_BUILDING : QUICK_EMOJIS_BREAKING;

  const handleSave = () => {
    if (habitName.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // If all days are selected, pass undefined (means every day)
      const scheduledDays = selectedDays.length === 7 ? undefined : selectedDays;
      // Build intention object
      const intention: ImplementationIntention = {};
      if (habitType === 'building') {
        if (intentionCue.trim()) intention.cue = intentionCue.trim();
        if (intentionWhere.trim()) intention.where = intentionWhere.trim();
      } else {
        if (intentionInstead.trim()) intention.insteadAction = intentionInstead.trim();
      }
      const hasIntention = Object.keys(intention).length > 0;
      addHabit(
        habitName.trim(),
        hasIntention ? intention : undefined,
        selectedEmoji || undefined,
        whyStatement.trim() || undefined,
        celebrationPhrase.trim() || undefined,
        scheduledDays,
        isWork,
        habitType,
        habitType === 'breaking' ? triggerNotes.trim() || undefined : undefined,
        energyLevel,
        hasPreferredTime ? preferredTime : undefined
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
          <Pressable style={styles.closeButton} onPress={handleCancel}>
            <ChevronLeft size={24} color="#000" strokeWidth={1.5} />
          </Pressable>
          <Text style={styles.headerTitle}>New Habit</Text>
          <Pressable
            style={[styles.createButton, !isValid && styles.createButtonDisabled]}
            onPress={handleSave}
            disabled={!isValid}
          >
            <Text style={[styles.createButtonText, !isValid && styles.createButtonTextDisabled]}>
              Add
            </Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {/* Main Content */}
          <View style={styles.content}>
            {/* Type Selector */}
            <View style={styles.typeSelector}>
              <Pressable
                style={[
                  styles.typeCard,
                  habitType === 'building' && styles.typeCardActive,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setHabitType('building');
                  setSelectedEmoji(null);
                }}
              >
                <Text style={styles.typeCardEmoji}>🌱</Text>
                <Text style={[styles.typeCardTitle, habitType === 'building' && styles.typeCardTitleActive]}>
                  Build
                </Text>
                <Text style={styles.typeCardSubtitle}>Start doing</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.typeCard,
                  habitType === 'breaking' && styles.typeCardActiveBreaking,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setHabitType('breaking');
                  setSelectedEmoji(null);
                }}
              >
                <Text style={styles.typeCardEmoji}>🚫</Text>
                <Text style={[styles.typeCardTitle, habitType === 'breaking' && styles.typeCardTitleActiveBreaking]}>
                  Break
                </Text>
                <Text style={styles.typeCardSubtitle}>Stop doing</Text>
              </Pressable>
            </View>

            {/* Selected Emoji Display */}
            <Pressable
              style={[
                styles.emojiDisplay,
                selectedEmoji && styles.emojiDisplayActive,
                selectedEmoji && habitType === 'breaking' && styles.emojiDisplayActiveBreaking,
                needsIcon && styles.emojiDisplayNeedsSelection
              ]}
              onPress={() => setSelectedEmoji(null)}
            >
              <Text style={styles.emojiDisplayText}>
                {selectedEmoji || (habitType === 'building' ? '🌱' : '🚫')}
              </Text>
            </Pressable>
            {needsIcon && (
              <Text style={styles.iconHint}>Choose an icon for your habit</Text>
            )}

            {/* Habit Input */}
            <TextInput
              style={styles.input}
              placeholder={habitType === 'building' ? "What habit are you building?" : "What habit are you breaking?"}
              placeholderTextColor="#C7C7CC"
              value={habitName}
              onChangeText={setHabitName}
              autoFocus={false}
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

            {/* Reminder Time Section */}
            <View style={styles.timeSection}>
              <View style={styles.timeSectionHeader}>
                <Text style={styles.daySectionLabel}>Reminder time</Text>
                <Switch
                  value={hasPreferredTime}
                  onValueChange={(val) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setHasPreferredTime(val);
                  }}
                  trackColor={{ false: '#E5E5EA', true: '#5856D6' }}
                  thumbColor="#fff"
                />
              </View>
              {hasPreferredTime && (
                <Pressable
                  style={styles.timeButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={styles.timeButtonText}>
                    {(() => {
                      const [h, m] = preferredTime.split(':').map(Number);
                      const period = h >= 12 ? 'PM' : 'AM';
                      const displayH = h % 12 || 12;
                      return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
                    })()}
                  </Text>
                </Pressable>
              )}
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

            {/* My Plan Section (Implementation Intentions) */}
            <View style={styles.planSection}>
              <Text style={styles.sectionLabelSmall}>MY PLAN</Text>
              {habitType === 'building' ? (
                <>
                  <Text style={styles.planLabel}>After I...</Text>
                  <TextInput
                    style={styles.planInput}
                    placeholder="finish my morning coffee"
                    placeholderTextColor="#C7C7CC"
                    value={intentionCue}
                    onChangeText={setIntentionCue}
                    maxLength={100}
                  />
                  <Text style={styles.planLabel}>
                    I will <Text style={styles.planHabitName}>{habitName.trim() || 'this habit'}</Text>
                  </Text>
                  <Text style={styles.planLabel}>At...</Text>
                  <TextInput
                    style={styles.planInput}
                    placeholder="my desk"
                    placeholderTextColor="#C7C7CC"
                    value={intentionWhere}
                    onChangeText={setIntentionWhere}
                    maxLength={100}
                  />
                </>
              ) : (
                <>
                  <Text style={styles.planLabel}>
                    When I feel the urge to <Text style={styles.planHabitName}>{habitName.trim() || 'this habit'}</Text>...
                  </Text>
                  <Text style={styles.planLabel}>Instead, I will...</Text>
                  <TextInput
                    style={styles.planInput}
                    placeholder="take 3 deep breaths"
                    placeholderTextColor="#C7C7CC"
                    value={intentionInstead}
                    onChangeText={setIntentionInstead}
                    maxLength={200}
                  />
                  <Text style={styles.planLabel}>My trigger is usually...</Text>
                  <TextInput
                    style={styles.planInput}
                    placeholder="stress after work"
                    placeholderTextColor="#C7C7CC"
                    value={triggerNotes}
                    onChangeText={setTriggerNotes}
                    maxLength={200}
                  />
                </>
              )}
              <Text style={styles.planHint}>
                Having a plan makes you 2-3x more likely to follow through
              </Text>
            </View>

            {/* Energy Level Section */}
            <View style={styles.energySection}>
              <Text style={styles.sectionLabelSmall}>ENERGY COST</Text>
              <View style={styles.energyRow}>
                {[
                  { level: 'low', emoji: '🔋', label: 'Easy' },
                  { level: 'medium', emoji: '⚡️', label: 'Normal' },
                  { level: 'high', emoji: '🎯', label: 'Deep' },
                ].map((item) => (
                  <Pressable
                    key={item.level}
                    style={[
                      styles.energyButton,
                      energyLevel === item.level && styles.energyButtonActive,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setEnergyLevel(item.level as 'low' | 'medium' | 'high');
                    }}
                  >
                    <Text style={styles.energyEmoji}>{item.emoji}</Text>
                    <Text style={[
                      styles.energyLabelText,
                      energyLevel === item.level && styles.energyLabelTextActive
                    ]}>
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Work Related Toggle */}
            <View style={styles.workSection}>
              <WorkToggleRow isWork={isWork} onToggle={setIsWork} />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.timePickerOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowTimePicker(false)}
          />
          <View style={styles.timePickerModal}>
            <View style={styles.timePickerHeader}>
              <Pressable onPress={() => setShowTimePicker(false)}>
                <Text style={styles.timePickerCancel}>Cancel</Text>
              </Pressable>
              <Text style={styles.timePickerTitle}>Reminder Time</Text>
              <Pressable onPress={() => setShowTimePicker(false)}>
                <Text style={styles.timePickerDone}>Done</Text>
              </Pressable>
            </View>
            <View style={styles.timePickerContent}>
              <DateTimePicker
                value={(() => {
                  const [h, m] = preferredTime.split(':').map(Number);
                  const d = new Date();
                  d.setHours(h);
                  d.setMinutes(m);
                  return d;
                })()}
                mode="time"
                display="spinner"
                onChange={(event: any, selectedDate?: Date) => {
                  if (selectedDate) {
                    const hours = selectedDate.getHours().toString().padStart(2, '0');
                    const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
                    setPreferredTime(`${hours}:${minutes}`);
                  }
                }}
                themeVariant="light"
              />
            </View>
          </View>
        </View>
      </Modal>
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
  // Type Selector Styles
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  typeCard: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  typeCardActive: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#34C759',
    shadowColor: '#34C759',
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  typeCardActiveBreaking: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#FF6B6B',
    shadowColor: '#FF6B6B',
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  typeCardEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  typeCardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#999',
    letterSpacing: -0.2,
  },
  typeCardTitleActive: {
    color: '#34C759',
  },
  typeCardTitleActiveBreaking: {
    color: '#FF6B6B',
  },
  typeCardSubtitle: {
    fontSize: 13,
    color: '#AEAEB2',
    letterSpacing: -0.1,
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
  // Day Selector Styles
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
  workSection: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionLabelSmall: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: -0.1,
  },
  planSection: {
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
  planLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  planHabitName: {
    fontWeight: '700',
    color: '#5856D6',
  },
  planInput: {
    fontSize: 16,
    color: '#1C1C1E',
    backgroundColor: '#F5F5F7',
    borderRadius: 14,
    padding: 16,
    minHeight: 48,
    marginBottom: 16,
  },
  planHint: {
    fontSize: 13,
    color: '#AEAEB2',
    textAlign: 'center',
    fontStyle: 'normal',
    letterSpacing: -0.1,
    marginTop: 4,
  },
  energySection: {
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
  energyRow: {
    flexDirection: 'row',
    gap: 12,
  },
  energyButton: {
    flex: 1,
    backgroundColor: '#F5F5F7',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  energyButtonActive: {
    backgroundColor: '#fff',
    borderColor: '#5856D6',
    shadowColor: '#5856D6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  energyEmoji: {
    fontSize: 20,
  },
  energyLabelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
  },
  energyLabelTextActive: {
    color: '#5856D6',
  },
  timeSection: {
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
  timeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeButton: {
    marginTop: 16,
    backgroundColor: '#F5F5F7',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  timeButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#5856D6',
  },
  timePickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  timePickerModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  timePickerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  timePickerCancel: {
    fontSize: 17,
    color: '#8E8E93',
  },
  timePickerDone: {
    fontSize: 17,
    fontWeight: '600',
    color: '#5856D6',
  },
  timePickerContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
});
