import { useRouter } from 'expo-router';
import { X, Clock, MapPin } from 'lucide-react-native';
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

const TIME_SUGGESTIONS = ['Morning', 'Afternoon', 'Evening', 'Before bed'];
const CUE_SUGGESTIONS = ['After waking up', 'After breakfast', 'After lunch', 'After work'];

export default function AddHabitScreen() {
  const router = useRouter();
  const { addHabit } = useHabits();
  const [habitName, setHabitName] = useState('');
  const [when, setWhen] = useState('');
  const [cue, setCue] = useState('');

  const handleSave = () => {
    if (habitName.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      addHabit(habitName.trim(), {
        when: when.trim() || undefined,
        cue: cue.trim() || undefined,
      });
      router.back();
    }
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const selectSuggestion = (value: string, setter: (v: string) => void) => {
    Haptics.selectionAsync();
    setter(value);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={handleCancel}>
            <X size={28} color="#000" strokeWidth={2} />
          </Pressable>
          <Text style={styles.headerTitle}>New Habit</Text>
          <Pressable
            style={styles.saveButton}
            onPress={handleSave}
            disabled={!habitName.trim()}
          >
            <Text
              style={[
                styles.saveButtonText,
                !habitName.trim() && styles.saveButtonTextDisabled,
              ]}
            >
              Add
            </Text>
          </Pressable>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.section}>
            <Text style={styles.label}>What do you want to do every day?</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Read for 30 minutes"
              placeholderTextColor="#C7C7CC"
              value={habitName}
              onChangeText={setHabitName}
              autoFocus
              returnKeyType="next"
            />
          </View>

          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Clock size={16} color="#8E8E93" />
              <Text style={styles.labelSecondary}>When will you do it?</Text>
            </View>
            <TextInput
              style={styles.inputSecondary}
              placeholder="e.g. 7:00 AM"
              placeholderTextColor="#C7C7CC"
              value={when}
              onChangeText={setWhen}
            />
            <View style={styles.suggestions}>
              {TIME_SUGGESTIONS.map((time) => (
                <Pressable
                  key={time}
                  style={[styles.chip, when === time && styles.chipSelected]}
                  onPress={() => selectSuggestion(time, setWhen)}
                >
                  <Text style={[styles.chipText, when === time && styles.chipTextSelected]}>
                    {time}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.labelRow}>
              <MapPin size={16} color="#8E8E93" />
              <Text style={styles.labelSecondary}>Link to existing routine</Text>
            </View>
            <TextInput
              style={styles.inputSecondary}
              placeholder="e.g. After my morning coffee"
              placeholderTextColor="#C7C7CC"
              value={cue}
              onChangeText={setCue}
            />
            <View style={styles.suggestions}>
              {CUE_SUGGESTIONS.map((suggestion) => (
                <Pressable
                  key={suggestion}
                  style={[styles.chip, cue === suggestion && styles.chipSelected]}
                  onPress={() => selectSuggestion(suggestion, setCue)}
                >
                  <Text style={[styles.chipText, cue === suggestion && styles.chipTextSelected]}>
                    {suggestion}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>💡 Habit stacking tip</Text>
            <Text style={styles.tipText}>
              Linking a new habit to an existing routine makes it 2-3x more likely to stick.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
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
    backgroundColor: '#F2F2F7',
    borderBottomWidth: 0.5,
    borderBottomColor: '#C7C7CC',
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    letterSpacing: -0.4,
  },
  saveButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  saveButtonTextDisabled: {
    opacity: 0.3,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    gap: 28,
  },
  section: {
    gap: 10,
  },
  label: {
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  labelSecondary: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 17,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  inputSecondary: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  chipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  chipText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#fff',
  },
  tipCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: '#FFE066',
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  tipText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});
