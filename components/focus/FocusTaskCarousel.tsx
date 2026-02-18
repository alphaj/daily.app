import React, { memo, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTodos } from '@/contexts/TodoContext';
import type { Todo, TimeOfDay } from '@/types/todo';

const SECTION_CONFIG: Record<TimeOfDay, { label: string; icon: string }> = {
  anytime: { label: 'ANYTIME', icon: '🕐' },
  morning: { label: 'MORNING', icon: '🌅' },
  afternoon: { label: 'AFTERNOON', icon: '☀️' },
  evening: { label: 'EVENING', icon: '🌙' },
};

function getCurrentTimeBlock(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

interface FocusTaskCarouselProps {
  selectedTodoId: string | null;
  onSelectTodo: (todo: Todo | null) => void;
}

export function FocusTaskCarousel({ selectedTodoId, onSelectTodo }: FocusTaskCarouselProps) {
  const { getTodosForDate } = useTodos();
  const timeBlock = useMemo(() => getCurrentTimeBlock(), []);
  const config = SECTION_CONFIG[timeBlock];

  const tasks = useMemo(() => {
    const todayTodos = getTodosForDate(new Date());
    return todayTodos.filter(
      (t) => !t.completed && (t.timeOfDay === timeBlock || t.timeOfDay === 'anytime' || !t.timeOfDay)
    );
  }, [getTodosForDate, timeBlock]);

  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 300 });
  }, []);

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (tasks.length === 0) {
    return (
      <Animated.View style={[styles.container, fadeStyle]}>
        <View style={styles.labelRow}>
          <Text style={styles.labelIcon}>{config.icon}</Text>
          <Text style={styles.labelText}>{config.label}</Text>
        </View>
        <Text style={styles.emptyText}>No tasks for this {timeBlock}</Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, fadeStyle]}>
      <View style={styles.labelRow}>
        <Text style={styles.labelIcon}>{config.icon}</Text>
        <Text style={styles.labelText}>{config.label}</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tasks.map((task) => (
          <CarouselCard
            key={task.id}
            task={task}
            isSelected={selectedTodoId === task.id}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (selectedTodoId === task.id) {
                onSelectTodo(null);
              } else {
                onSelectTodo(task);
              }
            }}
          />
        ))}
      </ScrollView>
    </Animated.View>
  );
}

interface CarouselCardProps {
  task: Todo;
  isSelected: boolean;
  onPress: () => void;
}

const CarouselCard = memo(function CarouselCard({ task, isSelected, onPress }: CarouselCardProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(isSelected ? 1.03 : 1, {
      damping: 12,
      stiffness: 150,
    });
  }, [isSelected]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const durationLabel = task.estimatedMinutes
    ? task.estimatedMinutes >= 60
      ? `${Math.floor(task.estimatedMinutes / 60)}h${task.estimatedMinutes % 60 > 0 ? ` ${task.estimatedMinutes % 60}m` : ''}`
      : `${task.estimatedMinutes}m`
    : null;

  return (
    <Pressable onPress={onPress}>
      <Animated.View
        style={[
          styles.card,
          isSelected && styles.cardSelected,
          animatedStyle,
        ]}
      >
        {task.emoji ? (
          <View style={styles.emojiCircle}>
            <Text style={styles.emoji}>{task.emoji}</Text>
          </View>
        ) : (
          <View style={[styles.emojiCircle, styles.emojiCirclePlaceholder]}>
            <Text style={styles.emoji}>📌</Text>
          </View>
        )}
        <Text style={styles.cardTitle} numberOfLines={2}>
          {task.title}
        </Text>
        {durationLabel && (
          <Text style={styles.cardDuration}>{durationLabel}</Text>
        )}
      </Animated.View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 24,
    marginBottom: 10,
  },
  labelIcon: {
    fontSize: 14,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#8E8E93',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#AEAEB2',
    textAlign: 'center',
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  card: {
    width: 130,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  emojiCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiCirclePlaceholder: {
    backgroundColor: '#F0F0F0',
  },
  emoji: {
    fontSize: 22,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
    lineHeight: 17,
  },
  cardDuration: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
  },
});
