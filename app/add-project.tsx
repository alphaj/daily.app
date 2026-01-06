import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
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

export default function AddProjectScreen() {
  const router = useRouter();
  const { addProject } = useProjects();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(PROJECT_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState<string>(PROJECT_ICONS[0]);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const handleCreate = useCallback(() => {
    if (!name.trim()) return;
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const projectId = addProject(name.trim(), description.trim(), selectedColor, selectedIcon);
    router.replace(`/project/${projectId}` as const);
  }, [name, description, selectedColor, selectedIcon, addProject, router]);

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
            <X size={24} color="#000" strokeWidth={1.5} />
          </Pressable>
          <Text style={styles.headerTitle}>New Project</Text>
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
          <View style={styles.previewCard}>
            <View style={[styles.previewAccent, { backgroundColor: selectedColor }]} />
            <View style={styles.previewContent}>
              <View style={[styles.previewIconContainer, { backgroundColor: `${selectedColor}15` }]}>
                <Text style={styles.previewIcon}>{selectedIcon}</Text>
              </View>
              <Text style={styles.previewName} numberOfLines={1}>
                {name || 'Project Name'}
              </Text>
              {description ? (
                <Text style={styles.previewDescription} numberOfLines={1}>
                  {description}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="What's your goal?"
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
              placeholder="Brief description of your project"
              placeholderTextColor="#C7C7CC"
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={100}
            />
          </View>

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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  createButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#000',
    borderRadius: 20,
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
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  previewCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 32,
  },
  previewAccent: {
    height: 4,
    width: '100%',
  },
  previewContent: {
    padding: 20,
  },
  previewIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  previewIcon: {
    fontSize: 24,
  },
  previewName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  previewDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
  inputSection: {
    marginBottom: 28,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  textInput: {
    fontSize: 17,
    color: '#000',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  textInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  iconOption: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#F9F9F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconOptionSelected: {
    backgroundColor: '#fff',
    borderWidth: 2,
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
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#000',
  },
});
