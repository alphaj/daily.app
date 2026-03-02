import React, { memo, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  type SharedValue,
} from 'react-native-reanimated';
import { Check, ChevronDown, ChevronUp } from 'lucide-react-native';
import * as Haptics from '@/lib/haptics';
import type { BuddyTodo } from '@/lib/sync';

type TimeOfDay = 'anytime' | 'morning' | 'afternoon' | 'evening';

const SECTION_TINTS: Record<TimeOfDay, { card: string; emoji: string; border: string }> = {
  anytime:   { card: '#F9F9FB',                emoji: 'rgba(120,120,128,0.08)', border: 'rgba(0,0,0,0.04)' },
  morning:   { card: 'rgba(255,204,0,0.06)',   emoji: 'rgba(255,204,0,0.14)',   border: 'rgba(255,204,0,0.15)' },
  afternoon: { card: 'rgba(255,149,0,0.06)',   emoji: 'rgba(255,149,0,0.14)',   border: 'rgba(255,149,0,0.15)' },
  evening:   { card: 'rgba(88,86,214,0.06)',   emoji: 'rgba(88,86,214,0.14)',   border: 'rgba(88,86,214,0.15)' },
};

function formatTime(time: string | null): string {
  if (!time) return '';
  const [h, m] = time.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${display}:${m} ${ampm}`;
}

function formatDuration(mins: number | null): string | null {
  if (!mins) return null;
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const r = mins % 60;
    return r > 0 ? `${h}h ${r}m` : `${h}h`;
  }
  return `${mins}m`;
}

interface BuddyTaskRowProps {
  todo: BuddyTodo;
  index: number;
  entranceProgress: SharedValue<number>;
  onReact?: (todoId: string, pageY: number) => void;
  onLongPress?: (todo: BuddyTodo) => void;
  sentReaction?: string;
  isAssigned?: boolean;
}

export const BuddyTaskRow = memo(function BuddyTaskRow({
  todo,
  index,
  entranceProgress,
  onReact,
  onLongPress,
  sentReaction,
  isAssigned,
}: BuddyTaskRowProps) {
  const [subtasksExpanded, setSubtasksExpanded] = useState(false);
  const scale = useSharedValue(1);

  const timeOfDay = (todo.timeOfDay as TimeOfDay) || 'anytime';
  const tint = SECTION_TINTS[timeOfDay];
  const subtasks = todo.subtasks || [];
  const hasSubtasks = subtasks.length > 0;
  const completedSubtasks = subtasks.filter((st: any) => st.completed).length;

  const entranceStyle = useAnimatedStyle(() => {
    const delay = index * 0.06;
    const p = interpolate(entranceProgress.value, [delay, delay + 0.5], [0, 1], 'clamp');
    return {
      opacity: p,
      transform: [{ translateY: interpolate(p, [0, 1], [12, 0]) }],
    };
  });

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  }, []);

  const handlePress = useCallback(
    (evt: any) => {
      if (todo.completed && onReact) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onReact(todo.id, evt.nativeEvent.pageY);
      }
    },
    [todo.completed, todo.id, onReact],
  );

  const handleLongPress = useCallback(() => {
    if (onLongPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      onLongPress(todo);
    }
  }, [todo, onLongPress]);

  const toggleExpanded = useCallback(() => {
    Haptics.selectionAsync();
    setSubtasksExpanded((prev) => !prev);
  }, []);

  const durationLabel = formatDuration(todo.estimatedMinutes);
  const timeLabel = formatTime(todo.dueTime);
  const metaParts = [timeLabel, durationLabel].filter(Boolean).join(' \u00B7 ');

  const cardBg = isAssigned ? 'rgba(0,122,255,0.04)' : tint.card;
  const cardBorder = isAssigned ? 'rgba(0,122,255,0.12)' : tint.border;

  return (
    <Animated.View style={[entranceStyle, { marginBottom: 8 }]}>
      <Animated.View
        style={[
          pressStyle,
          styles.cardShadow,
          todo.completed && styles.cardCompleted,
        ]}
      >
        <Pressable
          style={[
            styles.card,
            { backgroundColor: cardBg, borderColor: cardBorder },
          ]}
          onPress={todo.completed && onReact ? handlePress : undefined}
          onLongPress={onLongPress ? handleLongPress : undefined}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <View style={styles.cardContent}>
            {/* Emoji circle */}
            {todo.emoji ? (
              <View style={[styles.emojiCircle, { backgroundColor: todo.emojiColor || tint.emoji }]}>
                <Text style={styles.emoji}>{todo.emoji}</Text>
              </View>
            ) : (
              <View style={[styles.emojiCircle, { backgroundColor: tint.emoji }]}>
                <Text style={styles.emoji}>{'📋'}</Text>
              </View>
            )}

            {/* Text column */}
            <View style={styles.textColumn}>
              <Text
                style={[styles.title, todo.completed && styles.titleCompleted]}
                numberOfLines={2}
              >
                {todo.title}
              </Text>
              {metaParts ? <Text style={styles.meta}>{metaParts}</Text> : null}
            </View>

            {/* Reaction badge */}
            {sentReaction && <Text style={styles.reactionBadge}>{sentReaction}</Text>}

            {/* Completion circle */}
            <View style={[styles.checkbox, todo.completed && styles.checkboxDone]}>
              {todo.completed && <Check size={14} color="#fff" strokeWidth={3} />}
            </View>
          </View>

          {/* Subtask indicator */}
          {hasSubtasks && (
            <Pressable style={styles.subtaskIndicator} onPress={toggleExpanded}>
              <View style={styles.subtaskProgress}>
                <View style={styles.subtaskTrack}>
                  <View
                    style={[
                      styles.subtaskFill,
                      { width: `${(completedSubtasks / subtasks.length) * 100}%` },
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
              {subtasks.map((st: any) => (
                <View key={st.id} style={styles.subtaskRow}>
                  <View style={[styles.subtaskCheckbox, st.completed && styles.subtaskCheckboxDone]}>
                    {st.completed && <Check size={10} color="#fff" strokeWidth={3} />}
                  </View>
                  <Text
                    style={[styles.subtaskTitle, st.completed && styles.subtaskTitleDone]}
                    numberOfLines={1}
                  >
                    {st.title}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  cardShadow: {
    borderRadius: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  cardCompleted: {
    opacity: 0.6,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  emojiCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emoji: {
    fontSize: 20,
  },
  textColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1C1C1E',
    letterSpacing: -0.2,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: '#AEAEB2',
  },
  meta: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  reactionBadge: {
    fontSize: 16,
    marginLeft: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D1D6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  checkboxDone: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
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
  subtaskTrack: {
    flex: 1,
    height: 3,
    backgroundColor: '#E5E5EA',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  subtaskFill: {
    height: 3,
    backgroundColor: '#8E8E93',
    borderRadius: 1.5,
  },
  subtaskCount: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
  },
  // Expanded subtask list
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
  subtaskCheckboxDone: {
    backgroundColor: '#8E8E93',
    borderColor: '#8E8E93',
  },
  subtaskTitle: {
    fontSize: 14,
    color: '#3C3C43',
    flex: 1,
  },
  subtaskTitleDone: {
    textDecorationLine: 'line-through',
    color: '#AEAEB2',
  },
});
