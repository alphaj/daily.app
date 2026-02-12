import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react-native';
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
  LayoutAnimation,
  UIManager,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useHabits } from '@/contexts/HabitContext';
import type { DayOfWeek, HabitType, ImplementationIntention } from '@/types/habit';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const EMOJIS_BUILDING = ['💪', '📚', '🧘', '💧', '🏃', '😴', '✍️', '🎯'];
const EMOJIS_BREAKING = ['🚫', '🙅', '💪', '🧘', '🍃', '✨', '🎯', '🌟'];
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

const DAYS: { short: string; value: DayOfWeek }[] = [
  { short: 'S', value: 0 },
  { short: 'M', value: 1 },
  { short: 'T', value: 2 },
  { short: 'W', value: 3 },
  { short: 'T', value: 4 },
  { short: 'F', value: 5 },
  { short: 'S', value: 6 },
];

const layoutAnim = () =>
  LayoutAnimation.configureNext(
    LayoutAnimation.create(200, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity)
  );

export default function AddHabitScreen() {
  const router = useRouter();
  const { addHabit } = useHabits();

  // Core
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState<string | null>(null);
  const [type, setType] = useState<HabitType>('building');
  const [days, setDays] = useState<DayOfWeek[]>([0, 1, 2, 3, 4, 5, 6]);
  const [hasReminder, setHasReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState('09:00');

  // Optional
  const [why, setWhy] = useState('');
  const [celebration, setCelebration] = useState('');
  const [cue, setCue] = useState('');
  const [where, setWhere] = useState('');
  const [instead, setInstead] = useState('');
  const [trigger, setTrigger] = useState('');

  // UI
  const [showEmojis, setShowEmojis] = useState(false);
  const [showAllEmojis, setShowAllEmojis] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const isValid = name.trim().length > 0;
  const defaultEmoji = type === 'building' ? '🌱' : '🚫';
  const quickEmojis = type === 'building' ? EMOJIS_BUILDING : EMOJIS_BREAKING;

  const isEveryDay = days.length === 7;
  const isWeekdays =
    days.length === 5 && [1, 2, 3, 4, 5].every((d) => days.includes(d as DayOfWeek));

  const getReminderLabel = () => {
    if (!hasReminder) return 'None';
    const [h, m] = reminderTime.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
  };

  const toggleDay = (day: DayOfWeek) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDays((prev) => {
      if (prev.includes(day)) {
        if (prev.length === 1) return prev;
        return prev.filter((d) => d !== day);
      }
      return [...prev, day].sort((a, b) => a - b);
    });
  };

  const handleSave = () => {
    if (!isValid) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const scheduledDays = days.length === 7 ? undefined : days;
    const intention: ImplementationIntention = {};
    if (type === 'building') {
      if (cue.trim()) intention.cue = cue.trim();
      if (where.trim()) intention.where = where.trim();
    } else {
      if (instead.trim()) intention.insteadAction = instead.trim();
    }
    const hasIntention = Object.keys(intention).length > 0;

    addHabit(
      name.trim(),
      hasIntention ? intention : undefined,
      emoji || undefined,
      why.trim() || undefined,
      celebration.trim() || undefined,
      scheduledDays,
      false,
      type,
      type === 'breaking' ? trigger.trim() || undefined : undefined,
      hasReminder ? reminderTime : undefined
    );
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            style={styles.iconBtn}
            hitSlop={8}
          >
            <ArrowLeft size={24} color="#000" />
          </Pressable>
          <Text style={styles.headerTitle}>Add Habit</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {/* Hero Card */}
          <LinearGradient
            colors={['#E8F5E9', '#C8E6C9']}
            style={styles.heroCard}
          >
            <Pressable
              style={[styles.mainEmojiContainer, showEmojis && { borderWidth: 2, borderColor: '#1B5E20' }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                layoutAnim();
                setShowEmojis(!showEmojis);
                if (showEmojis) setShowAllEmojis(false);
              }}
            >
              <Text style={{ fontSize: 48 }}>{emoji || defaultEmoji}</Text>
            </Pressable>
            <TextInput
              style={styles.heroInput}
              placeholder={type === 'building' ? 'Habit to build...' : 'Habit to break...'}
              placeholderTextColor="rgba(27,94,32,0.3)"
              value={name}
              onChangeText={setName}
              textAlign="center"
              autoFocus
              returnKeyType="done"
            />
          </LinearGradient>

          {/* Emoji Picker (below hero card) */}
          {showEmojis && (
            <View style={styles.emojiPicker}>
              <View style={styles.emojiGrid}>
                {(showAllEmojis ? ALL_EMOJIS : quickEmojis).map((e, i) => (
                  <Pressable
                    key={`${e}-${i}`}
                    style={[styles.emojiItem, emoji === e && styles.emojiItemOn]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setEmoji(emoji === e ? null : e);
                    }}
                  >
                    <Text style={styles.emojiItemText}>{e}</Text>
                  </Pressable>
                ))}
              </View>
              <Pressable
                style={styles.emojiToggle}
                onPress={() => {
                  layoutAnim();
                  setShowAllEmojis(!showAllEmojis);
                }}
              >
                <Text style={styles.emojiToggleText}>
                  {showAllEmojis ? 'Less' : 'More'}
                </Text>
              </Pressable>
            </View>
          )}

          {/* Type Section */}
          <View style={styles.pickerSection}>
            <Text style={styles.sectionTitle}>Type</Text>
            <View style={styles.tagContainer}>
              <Pressable
                style={[styles.tag, type === 'building' && styles.tagActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  layoutAnim();
                  setType('building');
                  setEmoji(null);
                }}
              >
                <Text style={[styles.tagText, type === 'building' && styles.tagTextActive]}>
                  🌱 Build
                </Text>
              </Pressable>
              <Pressable
                style={[styles.tag, type === 'breaking' && styles.tagActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  layoutAnim();
                  setType('breaking');
                  setEmoji(null);
                }}
              >
                <Text style={[styles.tagText, type === 'breaking' && styles.tagTextActive]}>
                  🚫 Break
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Schedule Section */}
          <View style={styles.pickerSection}>
            <Text style={styles.sectionTitle}>Schedule</Text>
            <View style={styles.tagContainer}>
              <Pressable
                style={[styles.tag, isEveryDay && styles.tagActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setDays([0, 1, 2, 3, 4, 5, 6]);
                }}
              >
                <Text style={[styles.tagText, isEveryDay && styles.tagTextActive]}>
                  Every Day
                </Text>
              </Pressable>
              <Pressable
                style={[styles.tag, isWeekdays && styles.tagActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setDays([1, 2, 3, 4, 5]);
                }}
              >
                <Text style={[styles.tagText, isWeekdays && styles.tagTextActive]}>
                  Weekdays
                </Text>
              </Pressable>
            </View>
            <View style={styles.dayRow}>
              {DAYS.map((d) => {
                const on = days.includes(d.value);
                return (
                  <Pressable
                    key={d.value}
                    style={[styles.dayPill, on && styles.dayPillOn]}
                    onPress={() => toggleDay(d.value)}
                  >
                    <Text style={[styles.dayPillText, on && styles.dayPillTextOn]}>
                      {d.short}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Reminder Section */}
          <View style={styles.pickerSection}>
            <Text style={styles.sectionTitle}>Reminder</Text>
            <View style={styles.tagContainer}>
              <Pressable
                style={[styles.tag, !hasReminder && styles.tagActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setHasReminder(false);
                }}
              >
                <Text style={[styles.tagText, !hasReminder && styles.tagTextActive]}>
                  None
                </Text>
              </Pressable>
              <Pressable
                style={[styles.tag, hasReminder && styles.tagActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if (!hasReminder) {
                    setHasReminder(true);
                  }
                  setShowTimePicker(true);
                }}
              >
                <Text style={[styles.tagText, hasReminder && styles.tagTextActive]}>
                  {hasReminder ? getReminderLabel() : '🔔 Set Time'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Motivation & Plan (expandable) */}
          <Pressable
            style={styles.moreBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              layoutAnim();
              setShowMore(!showMore);
            }}
          >
            <Text style={styles.moreBtnText}>Motivation & plan</Text>
            {showMore ? (
              <ChevronUp size={17} color="#8E8E93" />
            ) : (
              <ChevronDown size={17} color="#8E8E93" />
            )}
          </Pressable>

          {showMore && (
            <View style={styles.moreCard}>
              <Text style={styles.fieldLabel}>Why does this matter?</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="Your personal motivation..."
                placeholderTextColor="#C7C7CC"
                value={why}
                onChangeText={setWhy}
                multiline
                maxLength={200}
              />

              {type === 'building' ? (
                <>
                  <Text style={styles.fieldLabel}>After I...</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="finish my morning coffee"
                    placeholderTextColor="#C7C7CC"
                    value={cue}
                    onChangeText={setCue}
                    maxLength={100}
                  />
                  <Text style={styles.fieldLabel}>
                    I will{' '}
                    <Text style={styles.fieldHighlight}>
                      {name.trim() || 'this habit'}
                    </Text>{' '}
                    at...
                  </Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="my desk"
                    placeholderTextColor="#C7C7CC"
                    value={where}
                    onChangeText={setWhere}
                    maxLength={100}
                  />
                </>
              ) : (
                <>
                  <Text style={styles.fieldLabel}>Instead, I will...</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="take 3 deep breaths"
                    placeholderTextColor="#C7C7CC"
                    value={instead}
                    onChangeText={setInstead}
                    maxLength={200}
                  />
                  <Text style={styles.fieldLabel}>My trigger is usually...</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="stress after work"
                    placeholderTextColor="#C7C7CC"
                    value={trigger}
                    onChangeText={setTrigger}
                    maxLength={200}
                  />
                </>
              )}

              <Text style={styles.fieldLabel}>Celebration phrase</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="e.g. I did it!"
                placeholderTextColor="#C7C7CC"
                value={celebration}
                onChangeText={setCelebration}
                maxLength={30}
              />
              <Text style={styles.fieldHint}>
                We'll show these when you need motivation most
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer - Done button */}
      <View style={styles.footer}>
        <Pressable
          style={[styles.bigButton, !isValid && { opacity: 0.5 }]}
          onPress={handleSave}
          disabled={!isValid}
        >
          <Text style={styles.bigButtonText}>Done</Text>
        </Pressable>
      </View>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowTimePicker(false)}
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Pressable
                onPress={() => {
                  setHasReminder(false);
                  setShowTimePicker(false);
                }}
              >
                <Text style={styles.modalRemove}>Remove</Text>
              </Pressable>
              <Text style={styles.modalTitle}>Reminder</Text>
              <Pressable onPress={() => setShowTimePicker(false)}>
                <Text style={styles.modalDone}>Done</Text>
              </Pressable>
            </View>
            <View style={styles.modalBody}>
              <DateTimePicker
                value={(() => {
                  const [h, m] = reminderTime.split(':').map(Number);
                  const d = new Date();
                  d.setHours(h);
                  d.setMinutes(m);
                  return d;
                })()}
                mode="time"
                display="spinner"
                onChange={(_: any, date?: Date) => {
                  if (date) {
                    setReminderTime(
                      `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
                    );
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 56,
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    padding: 20,
    gap: 32,
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    height: 240,
  },
  mainEmojiContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  heroInput: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1B5E20',
    width: '100%',
  },

  // Emoji picker
  emojiPicker: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  emojiItem: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiItemOn: {
    backgroundColor: '#1B5E20',
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  emojiItemText: { fontSize: 20 },
  emojiToggle: {
    alignItems: 'center',
    paddingTop: 10,
  },
  emojiToggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1B5E20',
  },

  // Tag picker sections
  pickerSection: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginLeft: 4,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
  },
  tagActive: {
    backgroundColor: '#1B5E20',
    borderColor: '#1B5E20',
  },
  tagText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555',
  },
  tagTextActive: {
    color: '#fff',
  },

  // Day pills (schedule)
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayPill: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  dayPillOn: {
    backgroundColor: '#1B5E20',
    borderColor: '#1B5E20',
  },
  dayPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#AEAEB2',
  },
  dayPillTextOn: { color: '#fff' },

  // Motivation & plan expandable
  moreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  moreBtnText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#8E8E93',
  },
  moreCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
    marginTop: 4,
    letterSpacing: -0.1,
  },
  fieldHighlight: {
    fontWeight: '700',
    color: '#1B5E20',
  },
  fieldInput: {
    fontSize: 16,
    color: '#1C1C1E',
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  fieldHint: {
    fontSize: 13,
    color: '#AEAEB2',
    textAlign: 'center',
    marginTop: 4,
  },

  // Footer
  footer: {
    padding: 20,
  },
  bigButton: {
    backgroundColor: '#FF7043',
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF7043',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  bigButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Time picker modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  modalRemove: {
    fontSize: 17,
    color: '#FF3B30',
  },
  modalDone: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
});
