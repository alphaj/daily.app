import { useRouter } from 'expo-router';
import { ChevronLeft, Calendar, X } from 'lucide-react-native';
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useProjects } from '@/contexts/ProjectContext';
import { PROJECT_COLORS, PROJECT_ICONS } from '@/types/project';
import { format } from 'date-fns';
import DatePickerWrapper from '@/components/DatePickerWrapper';

export default function AddProjectScreen() {
  const router = useRouter();
  const { addProject } = useProjects();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(PROJECT_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState<string>(PROJECT_ICONS[0]);
  const [type, setType] = useState<'project' | 'goal'>('project');
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [hasDeadline, setHasDeadline] = useState(false);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const handleCreate = useCallback(() => {
    if (!name.trim()) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const projectId = addProject(
      name.trim(),
      description.trim(),
      selectedColor,
      selectedIcon,
      type,
      deadline?.toISOString()
    );
    router.replace(`/project/${projectId}` as const);
  }, [name, description, selectedColor, selectedIcon, type, deadline, addProject, router]);

  const handleColorSelect = (color: string) => {
    Haptics.selectionAsync();
    setSelectedColor(color);
  };

  const handleIconSelect = (icon: string) => {
    Haptics.selectionAsync();
    setSelectedIcon(icon);
  };

  const isValid = name.trim().length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={handleClose} hitSlop={10}>
            <ChevronLeft size={24} color="#000" strokeWidth={1.5} />
          </Pressable>
          <Text style={styles.headerTitle}>New {type === 'project' ? 'Project' : 'Goal'}</Text>
          <Pressable
            style={[styles.createButton, !isValid && styles.createButtonDisabled]}
            onPress={handleCreate}
            disabled={!isValid}
          >
            <Text style={[styles.createButtonText, !isValid && styles.createButtonTextDisabled]}>
              Create
            </Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Type Toggle */}
          <View style={styles.typeToggleContainer}>
            <Pressable
              style={[styles.typeOption, type === 'project' && styles.typeOptionSelected]}
              onPress={() => {
                Haptics.selectionAsync();
                setType('project');
              }}
            >
              <Text style={[styles.typeOptionText, type === 'project' && styles.typeOptionTextSelected]}>Project</Text>
            </Pressable>
            <Pressable
              style={[styles.typeOption, type === 'goal' && styles.typeOptionSelected]}
              onPress={() => {
                Haptics.selectionAsync();
                setType('goal');
              }}
            >
              <Text style={[styles.typeOptionText, type === 'goal' && styles.typeOptionTextSelected]}>Goal</Text>
            </Pressable>
          </View>

          <View style={styles.previewCard}>
            <View style={[styles.previewAccent, { backgroundColor: selectedColor }]} />
            <View style={styles.previewContent}>
              <View style={[styles.previewIconContainer, { backgroundColor: `${selectedColor}15` }]}>
                <Text style={styles.previewIcon}>{selectedIcon}</Text>
              </View>
              <Text style={styles.previewName} numberOfLines={1}>
                {name || (type === 'goal' ? 'Goal Name' : 'Project Name')}
              </Text>
              {description ? (
                <Text style={styles.previewDescription} numberOfLines={1}>
                  {description}
                </Text>
              ) : null}
              {type === 'goal' && deadline && (
                <View style={styles.previewDeadline}>
                  <Text style={styles.previewDeadlineText}>Due {format(deadline, 'MMM d, yyyy')}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder={type === 'goal' ? "What do you want to achieve?" : "What's the project name?"}
              placeholderTextColor="#C7C7CC"
              value={name}
              onChangeText={setName}
              autoFocus
              maxLength={50}
            />
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Description (optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textInputMultiline]}
              placeholder={type === 'goal' ? "Brief description of your goal" : "Brief description of your project"}
              placeholderTextColor="#C7C7CC"
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={100}
            />
          </View>

          {/* Target Date - Only for Goals */}
          {type === 'goal' && (
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Target Date</Text>
              {!hasDeadline ? (
                <Pressable
                  style={styles.addDeadlineButton}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setHasDeadline(true);
                    setDeadline(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
                  }}
                >
                  <Calendar size={20} color="#8E8E93" />
                  <Text style={styles.addDeadlineText}>Add end date</Text>
                </Pressable>
              ) : (
                <View style={styles.deadlineContainer}>
                  <View style={styles.deadlineHeader}>
                    <View style={styles.deadlineLabel}>
                      <Calendar size={18} color="#000" />
                      <Text style={styles.deadlineLabelText}>Due by</Text>
                    </View>
                    <Pressable
                      style={styles.removeDeadlineButton}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setHasDeadline(false);
                        setDeadline(undefined);
                      }}
                      hitSlop={8}
                    >
                      <X size={18} color="#8E8E93" />
                    </Pressable>
                  </View>
                  <DatePickerWrapper
                    value={deadline || new Date()}
                    onChange={(date) => setDeadline(date)}
                    minimumDate={new Date()}
                    show={showDatePicker}
                    onClose={() => setShowDatePicker(false)}
                  />
                </View>
              )}
            </View>
          )}

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Icon</Text>
            <View style={styles.iconGrid}>
              {PROJECT_ICONS.map((icon) => (
                <Pressable
                  key={icon}
                  style={[
                    styles.iconOption,
                    selectedIcon === icon && styles.iconOptionSelected,
                    selectedIcon === icon && { borderColor: selectedColor }
                  ]}
                  onPress={() => handleIconSelect(icon)}
                >
                  <Text style={styles.iconText}>{icon}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Color</Text>
            <View style={styles.colorGrid}>
              {PROJECT_COLORS.map((color) => (
                <Pressable
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorOptionSelected
                  ]}
                  onPress={() => handleColorSelect(color)}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7', // System Gray 6
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
    // Removed border as the background provides separation now
  },
  closeButton: {
    padding: 4,
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  previewCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    // iOS Card Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 32,
    alignItems: 'center',
    padding: 24,
  },
  previewAccent: {
    display: 'none', // Removed this
  },
  previewContent: {
    alignItems: 'center',
    width: '100%',
  },
  previewIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  previewIcon: {
    fontSize: 32,
  },
  previewName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  previewDescription: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  inputSection: {
    marginBottom: 28,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    // marginLeft: 4, // Removed to align with input
  },
  textInput: {
    fontSize: 17,
    color: '#000',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  textInputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconOption: {
    width: 52,
    height: 52,
    borderRadius: 20, // Increased radius for squircle look
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconOptionSelected: {
    backgroundColor: '#fff',
    borderColor: '#000', // Will be overridden by inline style with dynamic color
    transform: [{ scale: 1.05 }],
  },
  iconText: {
    fontSize: 24,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 4,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  typeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E5EA',
    borderRadius: 99,
    padding: 4,
    marginBottom: 24,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 99,
  },
  typeOptionSelected: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  typeOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8E8E93',
  },
  typeOptionTextSelected: {
    color: '#000',
  },
  previewDeadline: {
    marginTop: 8,
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  previewDeadlineText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
  datePicker: {
    height: 120,
    marginTop: -10,
  },
  datePickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    overflow: 'hidden',
  },
  addDeadlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  addDeadlineText: {
    fontSize: 17,
    color: '#8E8E93',
  },
  deadlineContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    overflow: 'hidden',
  },
  deadlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  deadlineLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deadlineLabelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  removeDeadlineButton: {
    padding: 4,
  },
});
