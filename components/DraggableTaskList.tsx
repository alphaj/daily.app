import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  PanResponder,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { GripVertical, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import SwipeableRow from '@/components/SwipeableRow';
import type { Todo } from '@/types/todo';

const ITEM_HEIGHT = 68;

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function DraggableTodoItem({
  todo,
  toggleTodo,
  deleteTodo,
  index,
  draggedIndex,
  onDragStart,
  onDragEnd,
  onDragMove,
  isDragging,
}: {
  todo: Todo;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  index: number;
  draggedIndex: number | null;
  onDragStart: (index: number) => void;
  onDragEnd: () => void;
  onDragMove: (index: number, gestureY: number) => void;
  isDragging: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const elevationAnim = useRef(new Animated.Value(0)).current;

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onDragStart(index);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1.02,
          useNativeDriver: true,
        }),
        Animated.timing(elevationAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    },
    onPanResponderMove: (_, gestureState) => {
      translateY.setValue(gestureState.dy);
      onDragMove(index, gestureState.dy);
    },
    onPanResponderRelease: () => {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.timing(elevationAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onDragEnd();
    },
    onPanResponderTerminate: () => {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
        Animated.timing(elevationAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start();
      onDragEnd();
    },
  }), [index, onDragStart, onDragEnd, onDragMove, scaleAnim, translateY, elevationAnim]);

  const handlePress = useCallback(() => {
    if (!isDragging) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      toggleTodo(todo.id);
    }
  }, [todo.id, toggleTodo, isDragging]);

  const handleDelete = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    deleteTodo(todo.id);
  }, [todo.id, deleteTodo]);

  const isBeingDragged = draggedIndex === index;
  const shouldOffset = draggedIndex !== null && !isBeingDragged;

  return (
    <Animated.View
      style={[
        styles.todoItemWrapper,
        {
          transform: [
            { scale: isBeingDragged ? scaleAnim : 1 },
            { translateY: isBeingDragged ? translateY : 0 },
          ],
          zIndex: isBeingDragged ? 999 : 1,
          opacity: shouldOffset ? 0.7 : 1,
        },
      ]}
    >
      <SwipeableRow onDelete={handleDelete}>
        <Pressable onPress={handlePress} disabled={isDragging}>
          <Animated.View
            style={[
              styles.todoItem,
              todo.completed && styles.todoItemCompleted,
              isBeingDragged && styles.todoItemDragging,
            ]}
          >
            <View {...panResponder.panHandlers} style={styles.dragHandle}>
              <GripVertical size={18} color="#C7C7CC" />
            </View>
            <Pressable
              onPress={handlePress}
              style={[
                styles.checkboxContainer,
                todo.isWork && styles.checkboxWork,
                todo.completed ? styles.checkboxChecked : styles.checkboxUnchecked,
                todo.isWork && todo.completed && styles.checkboxWorkChecked,
              ]}
              disabled={isDragging}
            >
              {todo.completed && <Check size={14} color="#fff" strokeWidth={4} />}
            </Pressable>

            <Text style={[styles.todoText, todo.completed && styles.todoTextChecked]} numberOfLines={1}>
              {todo.title}
            </Text>

          </Animated.View>
        </Pressable>
      </SwipeableRow>
    </Animated.View>
  );
}

export function DraggableTaskList({
  todos,
  toggleTodo,
  deleteTodo,
  onReorder,
}: {
  todos: Todo[];
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  onReorder: (todos: Todo[]) => void;
}) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [localTodos, setLocalTodos] = useState(todos);
  const isDragging = draggedIndex !== null;

  useEffect(() => {
    const sorted = [...todos].sort((a, b) => {
      if (a.completed === b.completed) return 0;
      return a.completed ? 1 : -1;
    });
    setLocalTodos(sorted);
  }, [todos]);

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragMove = useCallback((fromIndex: number, gestureY: number) => {
    const moveThreshold = ITEM_HEIGHT * 0.5;
    const indexDelta = Math.round(gestureY / ITEM_HEIGHT);
    const newIndex = Math.max(0, Math.min(localTodos.length - 1, fromIndex + indexDelta));

    if (newIndex !== fromIndex && Math.abs(gestureY) > moveThreshold) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      const newTodos = [...localTodos];
      const [movedItem] = newTodos.splice(fromIndex, 1);
      newTodos.splice(newIndex, 0, movedItem);
      setLocalTodos(newTodos);
      setDraggedIndex(newIndex);
      Haptics.selectionAsync();
    }
  }, [localTodos]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    onReorder(localTodos);
  }, [localTodos, onReorder]);

  return (
    <View>
      {localTodos.map((todo, index) => (
        <DraggableTodoItem
          key={todo.id}
          todo={todo}
          toggleTodo={toggleTodo}
          deleteTodo={deleteTodo}
          index={index}
          draggedIndex={draggedIndex}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragMove={handleDragMove}
          isDragging={isDragging}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  todoItemWrapper: {
    marginBottom: 10,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingRight: 16,
    paddingLeft: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    gap: 12,
    minHeight: ITEM_HEIGHT,
  },
  todoItemDragging: {
    shadowColor: '#5856D6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    backgroundColor: '#FAFAFF',
    transform: [{ scale: 1.02 }],
  },
  dragHandle: {
    padding: 6,
    marginLeft: -4,
    opacity: 0.3,
  },
  todoItemCompleted: {
    opacity: 0.6,
  },
  checkboxContainer: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2.5,
    borderColor: '#C7C7CC',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxUnchecked: {
    borderColor: '#C7C7CC',
  },
  checkboxChecked: {
    backgroundColor: '#5856D6',
    borderColor: '#5856D6',
  },
  checkboxWork: {
    borderRadius: 8,
    borderColor: '#C7C7CC',
  },
  checkboxWorkChecked: {
    backgroundColor: '#5856D6',
    borderColor: '#5856D6',
  },
  todoText: {
    flex: 1,
    fontSize: 17,
    color: '#000',
    fontWeight: '500',
    letterSpacing: -0.3,
  },
  todoTextChecked: {
    color: '#8E8E93',
    textDecorationLine: 'line-through',
  },
});
