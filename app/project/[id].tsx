import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Plus,
  Check,
  Trash2,
  ChevronUp,
  ChevronDown,
  Flag,
  PartyPopper,
  Trophy,
} from 'lucide-react-native';
import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  Animated,
  Easing,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useProjects } from '@/contexts/ProjectContext';
import SwipeableRow from '@/components/SwipeableRow';
import type { ProjectTask } from '@/types/project';
import { format, differenceInDays } from 'date-fns';

const TASK_HEIGHT = 72;

function RoadmapTask({
  task,
  index,
  totalTasks,
  projectColor,
  onToggle,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  task: ProjectTask;
  index: number;
  totalTasks: number;
  projectColor: string;
  onToggle: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const checkboxFillAnim = useRef(new Animated.Value(task.completed ? 1 : 0)).current;
  const checkmarkScaleAnim = useRef(new Animated.Value(task.completed ? 1 : 0)).current;
  const strikethroughAnim = useRef(new Animated.Value(task.completed ? 1 : 0)).current;
  const cardOpacityAnim = useRef(new Animated.Value(task.completed ? 0.6 : 1)).current;
  const completionPulseAnim = useRef(new Animated.Value(1)).current;
  const [isAnimating, setIsAnimating] = useState(false);
  const [showCompleted, setShowCompleted] = useState(task.completed);

  const runCompletionAnimation = () => {
    setIsAnimating(true);
    setShowCompleted(true);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Animated.sequence([
      Animated.spring(checkboxFillAnim, {
        toValue: 1,
        useNativeDriver: false,
        tension: 100,
        friction: 8,
      }),
    ]).start();

    setTimeout(() => {
      Animated.spring(checkmarkScaleAnim, {
        toValue: 1,
        useNativeDriver: false,
        tension: 150,
        friction: 6,
      }).start();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 100);

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(strikethroughAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: false,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(cardOpacityAnim, {
          toValue: 0.6,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    }, 150);

    setTimeout(() => {
      Animated.sequence([
        Animated.timing(completionPulseAnim, {
          toValue: 1.02,
          duration: 100,
          useNativeDriver: false,
        }),
        Animated.spring(completionPulseAnim, {
          toValue: 1,
          useNativeDriver: false,
          tension: 100,
          friction: 10,
        }),
      ]).start(() => {
        setIsAnimating(false);
      });
    }, 200);

    onToggle();
  };

  const runUncheckAnimation = () => {
    setIsAnimating(true);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.parallel([
      Animated.timing(checkmarkScaleAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(checkboxFillAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(strikethroughAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(cardOpacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setIsAnimating(false);
      setShowCompleted(false);
    });

    onToggle();
  };

  const handlePress = () => {
    if (isAnimating) return;

    if (task.completed) {
      runUncheckAnimation();
    } else {
      runCompletionAnimation();
    }
  };

  const checkboxBackgroundColor = checkboxFillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#FFFFFF', projectColor],
  });

  const checkboxBorderColor = checkboxFillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E5E5EA', projectColor],
  });

  return (
    <Animated.View
      style={[
        styles.taskRow,
        {
          transform: [{ scale: completionPulseAnim }],
          opacity: cardOpacityAnim,
        },
      ]}
    >
      <View style={styles.timelineContainer}>
        {!isFirst && (
          <Animated.View
            style={[
              styles.timelineLineTop,
              {
                backgroundColor: checkboxFillAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['#E5E5EA', projectColor],
                })
              }
            ]}
          />
        )}
        <Pressable onPress={handlePress}>
          <Animated.View
            style={[
              styles.timelineNode,
              {
                backgroundColor: checkboxBackgroundColor,
                borderColor: checkboxBorderColor,
              },
            ]}
          >
            <Animated.View style={{ transform: [{ scale: checkmarkScaleAnim }] }}>
              {showCompleted && <Check size={14} color="#fff" strokeWidth={3} />}
            </Animated.View>
          </Animated.View>
        </Pressable>
        {!isLast && (
          <Animated.View
            style={[
              styles.timelineLineBottom,
              {
                backgroundColor: checkboxFillAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['#E5E5EA', projectColor],
                })
              }
            ]}
          />
        )}
      </View>

      <View style={{ flex: 1 }}>
        <SwipeableRow onDelete={onDelete} style={{ flex: 1 }}>
          <Pressable
            style={[styles.taskContent, showCompleted && styles.taskContentCompleted]}
            onPress={handlePress}
          >
            <View style={styles.taskMain}>
              <Text style={[styles.taskNumber, { color: projectColor }]}>Step {index + 1}</Text>
              <View style={styles.taskTitleContainer}>
                <Text style={[styles.taskTitle, showCompleted && styles.taskTitleCompleted]} numberOfLines={2}>
                  {task.title}
                </Text>
                <Animated.View
                  style={[
                    styles.strikethroughLine,
                    {
                      width: strikethroughAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    }
                  ]}
                />
              </View>
            </View>
            <View style={styles.reorderButtons}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onMoveUp();
                }}
                style={[styles.reorderButton, isFirst && styles.reorderButtonDisabled]}
                disabled={isFirst}
              >
                <ChevronUp size={16} color={isFirst ? "#D1D1D6" : "#8E8E93"} strokeWidth={2} />
              </Pressable>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onMoveDown();
                }}
                style={[styles.reorderButton, isLast && styles.reorderButtonDisabled]}
                disabled={isLast}
              >
                <ChevronDown size={16} color={isLast ? "#D1D1D6" : "#8E8E93"} strokeWidth={2} />
              </Pressable>
            </View>
          </Pressable>
        </SwipeableRow>
      </View>
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
        Add steps to create your roadmap
      </Text>
      <Pressable style={styles.emptyTasksButton} onPress={onAdd}>
        <Plus size={18} color="#fff" strokeWidth={2.5} />
        <Text style={styles.emptyTasksButtonText}>Add First Step</Text>
      </Pressable>
    </View>
  );
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CONFETTI_COUNT = 50;

interface ConfettiPiece {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  rotation: Animated.Value;
  scale: Animated.Value;
  color: string;
  size: number;
}

function GoalCompleteCelebration({
  visible,
  onDismiss,
  projectName,
  projectColor,
  projectIcon,
  totalSteps,
  deadline,
  completedAt,
}: {
  visible: boolean;
  onDismiss: () => void;
  projectName: string;
  projectColor: string;
  projectIcon: string;
  totalSteps: number;
  deadline?: string;
  completedAt: Date;
}) {
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const contentScale = useRef(new Animated.Value(0.8)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const trophyScale = useRef(new Animated.Value(0)).current;
  const trophyRotation = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(1)).current;

  const confettiColors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA', projectColor];

  const confettiPieces = useRef<ConfettiPiece[]>(
    Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
      id: i,
      x: new Animated.Value(Math.random() * SCREEN_WIDTH),
      y: new Animated.Value(-50 - Math.random() * 100),
      rotation: new Animated.Value(0),
      scale: new Animated.Value(Math.random() * 0.5 + 0.5),
      color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      size: Math.random() * 10 + 6,
    }))
  ).current;

  useEffect(() => {
    if (visible) {
      // Trigger success haptic
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Animate in
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(contentScale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Trophy animation with delay
      setTimeout(() => {
        Animated.spring(trophyScale, {
          toValue: 1,
          tension: 150,
          friction: 6,
          useNativeDriver: true,
        }).start();

        // Trophy wiggle
        Animated.sequence([
          Animated.timing(trophyRotation, { toValue: -0.1, duration: 100, useNativeDriver: true }),
          Animated.timing(trophyRotation, { toValue: 0.1, duration: 100, useNativeDriver: true }),
          Animated.timing(trophyRotation, { toValue: -0.05, duration: 100, useNativeDriver: true }),
          Animated.timing(trophyRotation, { toValue: 0, duration: 100, useNativeDriver: true }),
        ]).start();

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }, 200);

      // Glow pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowScale, {
            toValue: 1.2,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowScale, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Confetti animation
      confettiPieces.forEach((piece, i) => {
        piece.y.setValue(-50 - Math.random() * 100);
        piece.x.setValue(Math.random() * SCREEN_WIDTH);

        const delay = i * 20;
        const duration = 2000 + Math.random() * 1000;

        setTimeout(() => {
          const xOffset = (Math.random() - 0.5) * 100;
          Animated.parallel([
            Animated.timing(piece.y, {
              toValue: SCREEN_HEIGHT + 50,
              duration,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
            Animated.timing(piece.x, {
              toValue: Math.random() * SCREEN_WIDTH + xOffset,
              duration,
              useNativeDriver: true,
            }),
            Animated.timing(piece.rotation, {
              toValue: Math.random() * 10 - 5,
              duration,
              useNativeDriver: true,
            }),
          ]).start();
        }, delay);
      });
    } else {
      // Reset animations
      backdropOpacity.setValue(0);
      contentScale.setValue(0.8);
      contentOpacity.setValue(0);
      trophyScale.setValue(0);
      trophyRotation.setValue(0);
    }
  }, [visible]);

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(contentScale, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  // Calculate stats
  const daysAhead = deadline ? differenceInDays(new Date(deadline), completedAt) : null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={celebrationStyles.container}>
        {/* Backdrop */}
        <Animated.View
          style={[
            celebrationStyles.backdrop,
            { opacity: backdropOpacity }
          ]}
        />

        {/* Confetti */}
        {confettiPieces.map((piece) => (
          <Animated.View
            key={piece.id}
            style={[
              celebrationStyles.confetti,
              {
                backgroundColor: piece.color,
                width: piece.size,
                height: piece.size * 1.5,
                borderRadius: piece.size / 4,
                transform: [
                  { translateX: piece.x },
                  { translateY: piece.y },
                  {
                    rotate: piece.rotation.interpolate({
                      inputRange: [-5, 5],
                      outputRange: ['-180deg', '180deg'],
                    })
                  },
                  { scale: piece.scale },
                ],
              },
            ]}
          />
        ))}

        {/* Content Card */}
        <Animated.View
          style={[
            celebrationStyles.card,
            {
              transform: [{ scale: contentScale }],
              opacity: contentOpacity,
            }
          ]}
        >
          {/* Trophy */}
          <Animated.View
            style={[
              celebrationStyles.trophyContainer,
              {
                transform: [
                  { scale: trophyScale },
                  {
                    rotate: trophyRotation.interpolate({
                      inputRange: [-0.1, 0.1],
                      outputRange: ['-10deg', '10deg'],
                    })
                  },
                ],
              }
            ]}
          >
            <View style={[celebrationStyles.trophyCircle, { backgroundColor: `${projectColor}20` }]}>
              <Trophy size={48} color={projectColor} strokeWidth={1.5} fill={`${projectColor}30`} />
            </View>
          </Animated.View>

          {/* Celebration Text */}
          <Text style={celebrationStyles.title}>Goal Complete! 🎉</Text>
          <Text style={celebrationStyles.projectName}>{projectName}</Text>

          {/* Stats */}
          <View style={celebrationStyles.statsContainer}>
            <View style={celebrationStyles.statItem}>
              <Text style={celebrationStyles.statValue}>{totalSteps}</Text>
              <Text style={celebrationStyles.statLabel}>Steps Completed</Text>
            </View>
            {daysAhead !== null && daysAhead >= 0 && (
              <View style={celebrationStyles.statItem}>
                <Text style={[celebrationStyles.statValue, { color: '#34C759' }]}>
                  {daysAhead === 0 ? 'On time!' : `${daysAhead} days`}
                </Text>
                <Text style={celebrationStyles.statLabel}>
                  {daysAhead === 0 ? '' : 'Ahead of deadline'}
                </Text>
              </View>
            )}
          </View>

          {/* Dismiss Button */}
          <Pressable
            style={[celebrationStyles.button, { backgroundColor: projectColor }]}
            onPress={handleDismiss}
          >
            <Text style={celebrationStyles.buttonText}>Continue</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const celebrationStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  confetti: {
    position: 'absolute',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    width: SCREEN_WIDTH - 48,
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  glow: {
    position: 'absolute',
    top: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.2,
  },
  trophyContainer: {
    marginBottom: 20,
  },
  trophyCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  projectName: {
    fontSize: 17,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 24,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginBottom: 28,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    marginTop: 2,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 14,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
});

export default function ProjectDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getProject, addTask, deleteTask, toggleTask, deleteProject, getProjectProgress, reorderTasks } = useProjects();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const previousProgressRef = useRef<number | null>(null);
  const hasCelebratedRef = useRef(false);

  const project = getProject(id || '');

  const sortedTasks = useMemo(() => {
    if (!project) return [];
    return [...project.tasks].sort((a, b) => a.order - b.order);
  }, [project]);

  const progress = project ? getProjectProgress(project) : 0;

  // Detect when goal is completed (progress goes to 100%)
  useEffect(() => {
    if (project && project.tasks.length > 0) {
      // Check if we just completed the goal (and haven't celebrated yet)
      if (progress === 100 && previousProgressRef.current !== null && previousProgressRef.current < 100 && !hasCelebratedRef.current) {
        // Small delay to let the step animation finish first
        setTimeout(() => {
          setShowCelebration(true);
          hasCelebratedRef.current = true;
        }, 600);
      }
      previousProgressRef.current = progress;
    }
  }, [progress, project]);

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

  // Move task up in order
  const handleMoveUp = useCallback((taskId: string, currentIndex: number) => {
    if (currentIndex === 0 || !id) return;
    const newOrder = sortedTasks.map(t => t.id);
    [newOrder[currentIndex - 1], newOrder[currentIndex]] = [newOrder[currentIndex], newOrder[currentIndex - 1]];
    reorderTasks(id, newOrder);
  }, [id, sortedTasks, reorderTasks]);

  // Move task down in order
  const handleMoveDown = useCallback((taskId: string, currentIndex: number) => {
    if (currentIndex >= sortedTasks.length - 1 || !id) return;
    const newOrder = sortedTasks.map(t => t.id);
    [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
    reorderTasks(id, newOrder);
  }, [id, sortedTasks, reorderTasks]);

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

        {project.deadline && (
          <View style={styles.deadlineBanner}>
            <Text style={styles.deadlineBannerLabel}>Target Date</Text>
            <Text style={styles.deadlineBannerValue}>{format(new Date(project.deadline), 'MMMM d, yyyy')}</Text>
          </View>
        )}

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
                  onMoveUp={() => handleMoveUp(task.id, index)}
                  onMoveDown={() => handleMoveDown(task.id, index)}
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

              {!isAddingTask && sortedTasks.length > 0 && (
                <Pressable style={styles.addStepZone} onPress={handleShowAddInput}>
                  <Plus size={16} color="#C7C7CC" strokeWidth={2} />
                  <Text style={styles.addStepZoneText}>Tap to add step</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Goal Complete Celebration Modal */}
      {project && (
        <GoalCompleteCelebration
          visible={showCelebration}
          onDismiss={() => setShowCelebration(false)}
          projectName={project.name}
          projectColor={project.color}
          projectIcon={project.icon}
          totalSteps={project.tasks.length}
          deadline={project.deadline}
          completedAt={new Date()}
        />
      )}
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
  taskTitleContainer: {
    position: 'relative',
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
    lineHeight: 20,
  },
  taskTitleCompleted: {
    color: '#8E8E93',
  },
  strikethroughLine: {
    position: 'absolute',
    left: 0,
    top: '50%',
    height: 1.5,
    backgroundColor: '#8E8E93',
    marginTop: -0.75,
  },
  taskActions: {
    paddingLeft: 8,
    marginLeft: 4,
    marginRight: -8,
  },
  taskActionsDragging: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  dragHandleArea: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
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
  taskRowDragging: {
    zIndex: 1000,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    opacity: 0.95,
  },
  dropSpacer: {
    height: TASK_HEIGHT,
    marginLeft: 40,
    marginRight: 0,
    marginBottom: 12,
    borderRadius: 14,
    backgroundColor: '#E5E5EA',
    borderWidth: 2,
    borderColor: '#C7C7CC',
    borderStyle: 'dashed',
  },
  deadlineBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    marginHorizontal: 24,
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
  },
  deadlineBannerLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  deadlineBannerValue: {
    fontSize: 15,
    color: '#000',
    fontWeight: '600',
  },
  addStepZone: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    marginLeft: 44,
    paddingVertical: 24,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
  },
  addStepZoneText: {
    fontSize: 14,
    color: '#C7C7CC',
    fontWeight: '500',
  },
  reorderButtons: {
    flexDirection: 'column',
    alignItems: 'center',
    marginLeft: 8,
  },
  reorderButton: {
    padding: 4,
  },
  reorderButtonDisabled: {
    opacity: 0.3,
  },
});
