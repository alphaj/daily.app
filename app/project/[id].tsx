import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Plus,
  Check,
  Trash2,
  GripVertical,
  Flag,
} from 'lucide-react-native';
import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useProjects } from '@/contexts/ProjectContext';
import type { ProjectTask } from '@/types/project';

const TASK_HEIGHT = 72;

function RoadmapTask({
  task,
  index,
  totalTasks,
  projectColor,
  onToggle,
  onDelete,
  isFirst,
  isLast,
}: {
  task: ProjectTask;
  index: number;
  totalTasks: number;
  projectColor: string;
  onToggle: () => void;
  onDelete: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    onToggle();
  };

  const handleLongPress = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Delete Step',
      `Remove "${task.title}" from this project?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  return (
    <Animated.View style={[styles.taskRow, { transform: [{ scale: scaleAnim }] }]}>
      <View style={styles.timelineContainer}>
        {!isFirst && (
          <View style={[styles.timelineLineTop, task.completed && { backgroundColor: projectColor }]} />
        )}
        <Pressable
          style={[
            styles.timelineNode,
            task.completed && { backgroundColor: projectColor, borderColor: projectColor },
          ]}
          onPress={handlePress}
          onLongPress={handleLongPress}
          delayLongPress={500}
        >
          {task.completed && <Check size={14} color="#fff" strokeWidth={3} />}
        </Pressable>
        {!isLast && (
          <View style={[styles.timelineLineBottom, task.completed && { backgroundColor: projectColor }]} />
        )}
      </View>

      <Pressable
        style={[styles.taskContent, task.completed && styles.taskContentCompleted]}
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={500}
      >
        <View style={styles.taskMain}>
          <Text style={[styles.taskNumber, { color: projectColor }]}>Step {index + 1}</Text>
          <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]} numberOfLines={2}>
            {task.title}
          </Text>
        </View>
        <View style={styles.taskActions}>
          <GripVertical size={18} color="#D1D1D6" />
        </View>
      </Pressable>
    </Animated.View>
  );
}

function EmptyTasksState({ onAdd }: { onAdd: () => void }) {
  return (
    <View style={styles.emptyTasks}>
      <View style={styles.emptyTasksIcon}>
        <Flag size={32} color="#C7C7CC" strokeWidth={1.5} />
      </View>
      <Text style={styles.emptyTasksTitle}>Start your journey</Text>
      <Text style={styles.emptyTasksSubtitle}>
        Add steps to create your roadmap{'\n'}toward completing this project
      </Text>
      <Pressable style={styles.emptyTasksButton} onPress={onAdd}>
        <Plus size={18} color="#fff" strokeWidth={2.5} />
        <Text style={styles.emptyTasksButtonText}>Add First Step</Text>
      </Pressable>
    </View>
  );
}

export default function ProjectDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getProject, addTask, deleteTask, toggleTask, deleteProject, getProjectProgress } = useProjects();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const project = getProject(id || '');
  
  const sortedTasks = useMemo(() => {
    if (!project) return [];
    return [...project.tasks].sort((a, b) => a.order - b.order);
  }, [project]);

  const progress = project ? getProjectProgress(project) : 0;

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleAddTask = useCallback(() => {
    if (!newTaskTitle.trim() || !id) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addTask(id, newTaskTitle.trim());
    setNewTaskTitle('');
  }, [newTaskTitle, id, addTask]);

  const handleToggleTask = useCallback((taskId: string) => {
    if (!id) return;
    toggleTask(id, taskId);
  }, [id, toggleTask]);

  const handleDeleteTask = useCallback((taskId: string) => {
    if (!id) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    deleteTask(id, taskId);
  }, [id, deleteTask]);

  const handleDeleteProject = useCallback(() => {
    Alert.alert(
      'Delete Project',
      'Are you sure you want to delete this project and all its steps?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (id) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              deleteProject(id);
              router.back();
            }
          },
        },
      ]
    );
  }, [id, deleteProject, router]);

  const handleShowAddInput = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsAddingTask(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  if (!project) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.headerButton} onPress={handleBack}>
            <ArrowLeft size={24} color="#000" strokeWidth={1.5} />
          </Pressable>
          <Text style={styles.headerTitle}>Project not found</Text>
          <View style={styles.headerButton} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.headerButton} onPress={handleBack} hitSlop={10}>
          <ArrowLeft size={24} color="#000" strokeWidth={1.5} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{project.name}</Text>
        <Pressable style={styles.headerButton} onPress={handleDeleteProject} hitSlop={10}>
          <Trash2 size={22} color="#FF3B30" strokeWidth={1.5} />
        </Pressable>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.projectHeader}>
          <View style={[styles.projectIconContainer, { backgroundColor: `${project.color}15` }]}>
            <Text style={styles.projectIcon}>{project.icon}</Text>
          </View>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={[styles.progressValue, { color: project.color }]}>{progress}%</Text>
            </View>
            <View style={styles.progressBar}>
              <Animated.View 
                style={[
                  styles.progressFill, 
                  { width: `${progress}%`, backgroundColor: project.color }
                ]} 
              />
            </View>
            <Text style={styles.progressStats}>
              {project.tasks.filter(t => t.completed).length} of {project.tasks.length} steps completed
            </Text>
          </View>
        </View>

        {project.description ? (
          <Text style={styles.projectDescription}>{project.description}</Text>
        ) : null}

        <View style={styles.roadmapSection}>
          <View style={styles.roadmapHeader}>
            <Text style={styles.roadmapTitle}>Roadmap</Text>
            {sortedTasks.length > 0 && (
              <Pressable style={styles.addStepButton} onPress={handleShowAddInput}>
                <Plus size={18} color={project.color} strokeWidth={2.5} />
                <Text style={[styles.addStepText, { color: project.color }]}>Add Step</Text>
              </Pressable>
            )}
          </View>

          {sortedTasks.length === 0 && !isAddingTask ? (
            <EmptyTasksState onAdd={handleShowAddInput} />
          ) : (
            <View style={styles.roadmap}>
              {sortedTasks.map((task, index) => (
                <RoadmapTask
                  key={task.id}
                  task={task}
                  index={index}
                  totalTasks={sortedTasks.length}
                  projectColor={project.color}
                  onToggle={() => handleToggleTask(task.id)}
                  onDelete={() => handleDeleteTask(task.id)}
                  isFirst={index === 0}
                  isLast={index === sortedTasks.length - 1 && !isAddingTask}
                />
              ))}
              
              {isAddingTask && (
                <View style={styles.taskRow}>
                  <View style={styles.timelineContainer}>
                    {sortedTasks.length > 0 && <View style={styles.timelineLineTop} />}
                    <View style={[styles.timelineNode, styles.timelineNodeNew]} />
                  </View>
                  <View style={styles.addTaskInputContainer}>
                    <TextInput
                      ref={inputRef}
                      style={styles.addTaskInput}
                      placeholder="What's the next step?"
                      placeholderTextColor="#C7C7CC"
                      value={newTaskTitle}
                      onChangeText={setNewTaskTitle}
                      onSubmitEditing={handleAddTask}
                      onBlur={() => {
                        if (!newTaskTitle.trim()) {
                          setIsAddingTask(false);
                        }
                      }}
                      returnKeyType="done"
                    />
                    <Pressable 
                      style={[
                        styles.addTaskButton,
                        newTaskTitle.trim() && { backgroundColor: project.color }
                      ]}
                      onPress={handleAddTask}
                      disabled={!newTaskTitle.trim()}
                    >
                      <Plus size={18} color={newTaskTitle.trim() ? '#fff' : '#C7C7CC'} strokeWidth={2.5} />
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 24,
    gap: 20,
  },
  projectIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectIcon: {
    fontSize: 36,
  },
  progressContainer: {
    flex: 1,
    paddingTop: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressValue: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressStats: {
    fontSize: 12,
    color: '#8E8E93',
  },
  projectDescription: {
    fontSize: 15,
    color: '#6B6B6B',
    lineHeight: 22,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  roadmapSection: {
    paddingHorizontal: 24,
  },
  roadmapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  roadmapTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    letterSpacing: -0.3,
  },
  addStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addStepText: {
    fontSize: 15,
    fontWeight: '600',
  },
  roadmap: {
    paddingLeft: 8,
  },
  taskRow: {
    flexDirection: 'row',
    minHeight: TASK_HEIGHT,
  },
  timelineContainer: {
    width: 32,
    alignItems: 'center',
  },
  timelineLineTop: {
    width: 2,
    height: 20,
    backgroundColor: '#E5E5EA',
  },
  timelineLineBottom: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E5EA',
  },
  timelineNode: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  timelineNodeNew: {
    borderStyle: 'dashed',
    borderColor: '#C7C7CC',
  },
  taskContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    marginLeft: 12,
    marginBottom: 12,
    padding: 14,
  },
  taskContentCompleted: {
    backgroundColor: '#F5F5F5',
  },
  taskMain: {
    flex: 1,
  },
  taskNumber: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
    lineHeight: 20,
  },
  taskTitleCompleted: {
    color: '#8E8E93',
    textDecorationLine: 'line-through',
  },
  taskActions: {
    paddingLeft: 12,
  },
  emptyTasks: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTasksIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTasksTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  emptyTasksSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyTasksButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyTasksButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  addTaskInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    marginLeft: 12,
    marginBottom: 12,
    paddingLeft: 14,
    paddingRight: 6,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
  },
  addTaskInput: {
    flex: 1,
    fontSize: 15,
    color: '#000',
    paddingVertical: 14,
  },
  addTaskButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
