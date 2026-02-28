import React, { memo, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Alert, ActionSheetIOS, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS } from 'react-native-reanimated';
import { Check, ChevronDown, ChevronUp } from 'lucide-react-native';
import * as Haptics from '@/lib/haptics';
import SwipeableRow from '@/components/SwipeableRow';
import { TaskContextMenuA } from '@/components/TaskContextMenuA';
import { TaskContextMenuB } from '@/components/TaskContextMenuB';
import { TaskContextMenuC } from '@/components/TaskContextMenuC';
import { TaskContextMenuD } from '@/components/TaskContextMenuD';
import type { Todo, Subtask } from '@/types/todo';

// Change this to 'A' | 'B' | 'C' | 'D' to switch variants
const MENU_VARIANT: 'A' | 'B' | 'C' | 'D' = 'A';

const MenuComponent = {
  A: TaskContextMenuA,
  B: TaskContextMenuB,
  C: TaskContextMenuC,
  D: TaskContextMenuD,
}[MENU_VARIANT];

const SCREEN_WIDTH = Dimensions.get('window').width;

interface TaskCardProps {
  todo: Todo;
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
  buddyReaction?: string;
}

export const TaskCard = memo(function TaskCard({
  todo,
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

  const durationLabel = todo.estimatedMinutes
    ? todo.estimatedMinutes >= 60
      ? `${Math.floor(todo.estimatedMinutes / 60)}h${todo.estimatedMinutes % 60 > 0 ? ` ${todo.estimatedMinutes % 60}m` : ''}`
      : `${todo.estimatedMinutes}m`
    : null;

  return (
    <Animated.View style={exitStyle}>
    <SwipeableRow onDelete={() => onDelete(todo.id)}>
      <Animated.View style={[pressStyle, styles.cardShadow, todo.completed && styles.cardCompleted, todo.isDefault && !todo.completed && styles.cardDefault, isOverdue && !todo.completed && styles.cardOverdue]}>
      <View style={[styles.card, todo.isDefault && !todo.completed && styles.cardDefaultInner]}>
        <Pressable
          style={styles.cardContent}
          onPress={handleToggle}
          onLongPress={showTaskMenu}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          {/* Emoji circle */}
          {todo.emoji ? (
            <View style={[styles.emojiCircle, todo.emojiColor ? { backgroundColor: todo.emojiColor } : undefined]}>
              <Text style={styles.emoji}>{todo.emoji}</Text>
            </View>
          ) : null}

          {/* Text column */}
          <View style={styles.textColumn}>
            <Text
              style={[styles.title, todo.completed && styles.titleCompleted]}
              numberOfLines={1}
            >
              {todo.title}
            </Text>
            {durationLabel && (
              <Text style={styles.duration}>{durationLabel}</Text>
            )}
            {todo.assignedByName && (
              <Text style={styles.assignedBadge}>From {todo.assignedByName}</Text>
            )}
            {todo.isDefault && !todo.completed && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>Suggested</Text>
              </View>
            )}
            {isOverdue && !todo.completed && (
              <View style={styles.overdueBadge}>
                <Text style={styles.overdueBadgeText}>Overdue · {todo.dueDate}</Text>
              </View>
            )}
          </View>

          {/* Partner reaction badge */}
          {buddyReaction && todo.completed && (
            <Text style={styles.buddyReaction}>{buddyReaction}</Text>
          )}

          {/* Checkbox */}
          <View
            style={[styles.checkbox, todo.completed && styles.checkboxChecked]}
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
    <MenuComponent
      visible={menuVisible}
      onClose={() => setMenuVisible(false)}
      onCopy={handleCopy}
      onReschedule={handleReschedule}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  cardShadow: {
    marginBottom: 8,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  card: {
    borderRadius: 12,
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
    borderWidth: 1.5,
    borderColor: '#FF9500',
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  cardDefaultInner: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  emojiCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(120,120,128,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emoji: {
    fontSize: 22,
  },
  textColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.2,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: '#AEAEB2',
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
  overdueBadge: {
    marginTop: 4,
    backgroundColor: '#FFF3E0',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  overdueBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E65100',
    letterSpacing: 0.3,
  },
  buddyReaction: {
    fontSize: 18,
    marginLeft: 6,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  checkboxChecked: {
    backgroundColor: '#1C1C1E',
    borderColor: '#1C1C1E',
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
