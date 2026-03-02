import React, { memo, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Alert, ActionSheetIOS, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS } from 'react-native-reanimated';
import { Check, ChevronDown, ChevronUp, EyeOff } from 'lucide-react-native';
import * as Haptics from '@/lib/haptics';
import SwipeableRow from '@/components/SwipeableRow';
import { TaskContextMenuD as TaskContextMenu } from '@/components/TaskContextMenuD';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import type { Todo, Subtask, TimeOfDay } from '@/types/todo';
import { Avatar } from '@/components/Avatar';

const SCREEN_WIDTH = Dimensions.get('window').width;

const SECTION_TINTS: Record<TimeOfDay, { card: string; emoji: string; border: string }> = {
  anytime:   { card: '#F9F9FB',                emoji: 'rgba(120,120,128,0.08)', border: 'rgba(0,0,0,0.04)' },
  morning:   { card: 'rgba(255,204,0,0.06)',   emoji: 'rgba(255,204,0,0.14)',   border: 'rgba(255,204,0,0.15)' },
  afternoon: { card: 'rgba(255,149,0,0.06)',   emoji: 'rgba(255,149,0,0.14)',   border: 'rgba(255,149,0,0.15)' },
  evening:   { card: 'rgba(88,86,214,0.06)',   emoji: 'rgba(88,86,214,0.14)',   border: 'rgba(88,86,214,0.15)' },
};

interface TaskCardProps {
  todo: Todo;
  timeOfDay?: TimeOfDay;
  isOverdue?: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleSubtask?: (todoId: string, subtaskId: string) => void;
  onDeleteSubtask?: (todoId: string, subtaskId: string) => void;
  onEditSubtask?: (todoId: string, subtaskId: string, newTitle: string) => void;
  onConvertSubtaskToTask?: (todoId: string, subtaskId: string) => void;
  onDuplicate?: (id: string) => void;
  onReschedule?: (id: string, date: string) => void;
  onEdit?: (todo: Todo) => void;
  onStartTask?: (todo: Todo) => void;
  buddyReaction?: string;
}

export const TaskCard = memo(function TaskCard({
  todo,
  timeOfDay = 'anytime',
  isOverdue,
  onToggle,
  onDelete,
  onToggleSubtask,
  onDeleteSubtask,
  onEditSubtask,
  onConvertSubtaskToTask,
  onDuplicate,
  onReschedule,
  onEdit,
  onStartTask,
  buddyReaction,
}: TaskCardProps) {
  const [subtasksExpanded, setSubtasksExpanded] = useState(false);

  // Press scale animation
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Exit animation (reschedule slide-out)
  const exitX = useSharedValue(0);
  const exitOpacity = useSharedValue(1);
  const exitStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: exitX.value }],
    opacity: exitOpacity.value,
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  }, []);

  const subtasks = todo.subtasks || [];
  const hasSubtasks = subtasks.length > 0;
  const completedSubtasks = subtasks.filter(st => st.completed).length;

  const handleToggle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle(todo.id);
  }, [todo.id, onToggle]);

  const handleSubtaskToggle = useCallback((subtaskId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleSubtask?.(todo.id, subtaskId);
  }, [todo.id, onToggleSubtask]);

  const toggleExpanded = useCallback(() => {
    Haptics.selectionAsync();
    setSubtasksExpanded(prev => !prev);
  }, []);

  const handleSubtaskMenuAction = useCallback((key: string, subtask: Subtask) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (key === 'edit') {
      if (Platform.OS === 'ios') {
        Alert.prompt(
          'Edit Subtask',
          undefined,
          (newTitle) => {
            if (newTitle?.trim()) {
              onEditSubtask?.(todo.id, subtask.id, newTitle.trim());
            }
          },
          'plain-text',
          subtask.title,
        );
      } else {
        onEditSubtask?.(todo.id, subtask.id, subtask.title);
      }
    } else if (key === 'convert') {
      onConvertSubtaskToTask?.(todo.id, subtask.id);
    } else if (key === 'delete') {
      onDeleteSubtask?.(todo.id, subtask.id);
    }
  }, [todo.id, onDeleteSubtask, onEditSubtask, onConvertSubtaskToTask]);

  const [menuVisible, setMenuVisible] = useState(false);

  const doReschedule = useCallback(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    onReschedule?.(todo.id, dateStr);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [todo.id, onReschedule]);

  const handleCopy = useCallback(() => {
    onDuplicate?.(todo.id);
  }, [todo.id, onDuplicate]);

  const handleReschedule = useCallback(() => {
    // Slide card out to the left, then reschedule
    exitX.value = withTiming(-SCREEN_WIDTH, { duration: 280 });
    exitOpacity.value = withTiming(0, { duration: 280 }, (finished) => {
      if (finished) {
        runOnJS(doReschedule)();
      }
    });
  }, [doReschedule]);

  const handleEdit = useCallback(() => {
    onEdit?.(todo);
  }, [todo, onEdit]);

  const handleStartTask = useCallback(() => {
    onStartTask?.(todo);
  }, [todo, onStartTask]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Are you sure you want to delete this?',
      todo.assignedByName ? `This task was assigned by ${todo.assignedByName}.` : undefined,
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes, delete', style: 'destructive', onPress: () => onDelete(todo.id) },
      ]
    );
  }, [todo.id, todo.assignedByName, onDelete]);

  const showTaskMenu = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setMenuVisible(true);
  }, []);

  const showSubtaskMenu = useCallback((subtask: Subtask) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const options = ['Edit', 'Convert to Task', 'Delete', 'Cancel'];
    const destructiveButtonIndex = 2;
    const cancelButtonIndex = 3;

    ActionSheetIOS.showActionSheetWithOptions(
      { options, destructiveButtonIndex, cancelButtonIndex },
      (buttonIndex) => {
        const keys = ['edit', 'convert', 'delete'];
        if (buttonIndex < keys.length) {
          handleSubtaskMenuAction(keys[buttonIndex], subtask);
        }
      },
    );
  }, [handleSubtaskMenuAction]);

  const tint = SECTION_TINTS[timeOfDay];

  const durationLabel = todo.estimatedMinutes
    ? todo.estimatedMinutes >= 60
      ? `${Math.floor(todo.estimatedMinutes / 60)}h${todo.estimatedMinutes % 60 > 0 ? ` ${todo.estimatedMinutes % 60}m` : ''}`
      : `${todo.estimatedMinutes}m`
    : null;

  const daysOverdue = isOverdue && !todo.completed && todo.dueDate
    ? differenceInCalendarDays(new Date(), parseISO(todo.dueDate))
    : 0;
  const overdueLabel = daysOverdue === 1
    ? '1 day overdue'
    : daysOverdue < 7
      ? `${daysOverdue} days overdue`
      : daysOverdue < 14
        ? '1 week overdue'
        : `${Math.floor(daysOverdue / 7)} weeks overdue`;

  return (
    <Animated.View style={exitStyle}>
    <SwipeableRow onDelete={() => onDelete(todo.id)}>
      <Animated.View style={[pressStyle, styles.cardShadow, todo.completed && styles.cardCompleted, todo.isDefault && !todo.completed && styles.cardDefault, isOverdue && !todo.completed && styles.cardOverdue]}>
      <View style={[styles.card, { backgroundColor: tint.card, borderWidth: 1, borderColor: tint.border }, todo.isDefault && !todo.completed && styles.cardDefaultInner, isOverdue && !todo.completed && styles.cardOverdueInner]}>
        <Pressable
          style={styles.cardContent}
          onPress={handleToggle}
          onLongPress={showTaskMenu}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          {/* Emoji circle */}
          {todo.emoji ? (
            <View style={[styles.emojiCircle, { backgroundColor: isOverdue && !todo.completed ? 'rgba(255,149,0,0.12)' : (todo.emojiColor || tint.emoji) }]}>
              <Text style={styles.emoji}>{todo.emoji}</Text>
            </View>
          ) : null}

          {/* Text column */}
          <View style={styles.textColumn}>
            <View style={styles.titleRow}>
              <Text
                style={[styles.title, todo.completed && styles.titleCompleted, isOverdue && !todo.completed && styles.titleOverdue]}
                numberOfLines={2}
              >
                {todo.title}
              </Text>
              {todo.isPrivate && (
                <View style={styles.privateBadge}>
                  <EyeOff size={11} color="#8E8E93" strokeWidth={2.5} />
                </View>
              )}
              {isOverdue && !todo.completed && (
                <View style={styles.overdueChip}>
                  <Text style={styles.overdueChipText}>{daysOverdue}d</Text>
                </View>
              )}
            </View>
            {durationLabel && (
              <Text style={styles.duration}>{durationLabel}</Text>
            )}
            {todo.assignedByName && (
              <Text style={styles.assignedBadge}>From {todo.assignedByName}</Text>
            )}
            {todo.isTogether && todo.togetherPartnerName && (
              <Text style={styles.togetherLabel}>
                With {todo.togetherPartnerName.split(' ')[0]}
                {todo.partnerCompleted ? ' ✓' : ''}
              </Text>
            )}
            {todo.isDefault && !todo.completed && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>Suggested</Text>
              </View>
            )}
          </View>

          {/* Together avatar badge */}
          {todo.isTogether && (
            <View style={styles.togetherBadge}>
              <Avatar uri={todo.togetherPartnerAvatarUrl} name={todo.togetherPartnerName} size={24} />
              <View style={[styles.togetherDot, todo.partnerCompleted ? styles.dotDone : styles.dotPending]} />
            </View>
          )}

          {/* Partner reaction badge */}
          {buddyReaction && todo.completed && (
            <Text style={styles.buddyReaction}>{buddyReaction}</Text>
          )}

          {/* Checkbox */}
          <View
            style={[
              styles.checkbox,
              todo.completed && !todo.isTogether && styles.checkboxChecked,
              todo.isTogether && todo.completed && !todo.partnerCompleted && styles.checkboxTogetherWaiting,
              todo.isTogether && todo.completed && todo.partnerCompleted && styles.checkboxTogetherDone,
            ]}
          >
            {todo.completed && <Check size={14} color="#fff" strokeWidth={3} />}
          </View>
        </Pressable>

        {/* Subtask indicator row */}
        {hasSubtasks && (
          <Pressable style={styles.subtaskIndicator} onPress={toggleExpanded}>
            <View style={styles.subtaskProgress}>
              <View style={styles.subtaskProgressTrack}>
                <View
                  style={[
                    styles.subtaskProgressFill,
                    { width: `${subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0}%` },
                  ]}
                />
              </View>
              <Text style={styles.subtaskCount}>
                {completedSubtasks}/{subtasks.length}
              </Text>
            </View>
            {subtasksExpanded ? (
              <ChevronUp size={16} color="#8E8E93" />
            ) : (
              <ChevronDown size={16} color="#8E8E93" />
            )}
          </Pressable>
        )}

        {/* Expanded subtasks */}
        {hasSubtasks && subtasksExpanded && (
          <View style={styles.subtaskList}>
            {subtasks.map((st) => (
              <Pressable
                key={st.id}
                style={styles.subtaskRow}
                onPress={() => handleSubtaskToggle(st.id)}
                onLongPress={() => showSubtaskMenu(st)}
              >
                <View
                  style={[
                    styles.subtaskCheckbox,
                    st.completed && styles.subtaskCheckboxChecked,
                  ]}
                >
                  {st.completed && (
                    <Check size={10} color="#fff" strokeWidth={3} />
                  )}
                </View>
                <Text
                  style={[
                    styles.subtaskTitle,
                    st.completed && styles.subtaskTitleCompleted,
                  ]}
                  numberOfLines={1}
                >
                  {st.title}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
      </Animated.View>
    </SwipeableRow>
    <TaskContextMenu
      visible={menuVisible}
      onClose={() => setMenuVisible(false)}
      onCopy={handleCopy}
      onReschedule={handleEdit}
      onRescheduleTomorrow={handleReschedule}
      onStartTask={onStartTask ? handleStartTask : undefined}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  cardShadow: {
    marginBottom: 10,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  cardCompleted: {
    opacity: 0.6,
  },
  cardDefault: {
    shadowOpacity: 0,
    elevation: 0,
  },
  cardOverdue: {
    ...Platform.select({
      ios: {
        shadowColor: '#D4874A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardDefaultInner: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
  },
  cardOverdueInner: {
    backgroundColor: '#FFF9F5',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  emojiCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emoji: {
    fontSize: 26,
  },
  textColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: '#AEAEB2',
  },
  titleOverdue: {
    color: '#1C1C1E',
  },
  overdueChip: {
    backgroundColor: '#FF9500',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  overdueChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  duration: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
    marginTop: 2,
  },
  assignedBadge: {
    fontSize: 12,
    fontWeight: '500',
    color: '#007AFF',
    marginTop: 2,
  },
  defaultBadge: {
    marginTop: 4,
    backgroundColor: '#F0EDFF',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  defaultBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7C6EBF',
    letterSpacing: 0.3,
  },
  privateBadge: {
    backgroundColor: 'rgba(142,142,147,0.12)',
    borderRadius: 10,
    padding: 4,
  },
  buddyReaction: {
    fontSize: 18,
    marginLeft: 6,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#D1D1D6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkboxTogetherWaiting: {
    backgroundColor: 'rgba(0, 122, 255, 0.6)',
    borderColor: 'rgba(0, 122, 255, 0.6)',
  },
  checkboxTogetherDone: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  togetherLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#34C759',
    marginTop: 2,
  },
  togetherBadge: {
    position: 'relative',
    marginLeft: 6,
  },
  togetherDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  dotDone: {
    backgroundColor: '#34C759',
  },
  dotPending: {
    backgroundColor: '#C7C7CC',
  },
  // Subtask indicator
  subtaskIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 8,
  },
  subtaskProgress: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subtaskProgressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: '#E5E5EA',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  subtaskProgressFill: {
    height: 3,
    backgroundColor: '#8E8E93',
    borderRadius: 1.5,
  },
  subtaskCount: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
  },
  // Subtask list
  subtaskList: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 8,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 4,
  },
  subtaskCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#C7C7CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtaskCheckboxChecked: {
    backgroundColor: '#8E8E93',
    borderColor: '#8E8E93',
  },
  subtaskTitle: {
    fontSize: 14,
    color: '#3C3C43',
    flex: 1,
  },
  subtaskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#AEAEB2',
  },
});
