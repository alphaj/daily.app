import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import type { Todo } from '@/types/todo';
import {
  HOUR_HEIGHT,
  START_HOUR,
  END_HOUR,
  GRID_HEIGHT,
  LEFT_GUTTER,
} from './constants';
import {
  computeOverlapLayout,
  yToTime,
  snapY,
  formatDisplayTime,
} from './utils';
import { HourRow } from './HourRow';
import { CurrentTimeLine } from './CurrentTimeLine';
import { TimeBlock } from './TimeBlock';
import { DragGhost } from './DragGhost';

interface DayTimeGridProps {
  todos: Todo[];
  onEditTodo: (todo: Todo) => void;
  onUpdateTodo: (id: string, updates: Partial<Todo>) => void;
}

const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

export function DayTimeGrid({ todos, onEditTodo, onUpdateTodo }: DayTimeGridProps) {
  const { width: screenWidth } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const scrollOffsetRef = useRef(0);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);

  // Ghost state
  const [dragTodo, setDragTodo] = useState<Todo | null>(null);
  const [dragTimeLabel, setDragTimeLabel] = useState('');
  const ghostY = useSharedValue(0);
  const dragBlockRef = useRef<{ left: number; width: number; height: number } | null>(null);

  // Delta-based drag tracking: avoids needing absolute screen coordinates
  const dragAnchorRef = useRef({ initialFingerY: 0, initialGridY: 0, frozenScrollOffset: 0 });

  const availableWidth = screenWidth - LEFT_GUTTER - 40; // 40 = horizontal padding

  const layoutBlocks = useMemo(
    () => computeOverlapLayout(todos, availableWidth),
    [todos, availableWidth],
  );

  // Scroll to current time on mount
  useEffect(() => {
    const now = new Date();
    const y = (now.getHours() - START_HOUR) * HOUR_HEIGHT + (now.getMinutes() / 60) * HOUR_HEIGHT;
    const offset = Math.max(0, y - scrollViewHeight / 3);
    // Small delay to ensure layout is ready
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: offset, animated: false });
    }, 100);
    return () => clearTimeout(timer);
  }, [scrollViewHeight]);

  const handleScroll = useCallback((e: any) => {
    scrollOffsetRef.current = e.nativeEvent.contentOffset.y;
  }, []);

  const handleScrollViewLayout = useCallback((e: LayoutChangeEvent) => {
    setScrollViewHeight(e.nativeEvent.layout.height);
  }, []);

  const handleDragStart = useCallback((todo: Todo, absoluteY: number) => {
    const block = layoutBlocks.find(b => b.todo.id === todo.id);
    if (!block) return;

    setScrollEnabled(false);
    setDragTodo(todo);
    dragBlockRef.current = { left: block.left, width: block.width, height: block.height };

    // Capture anchor: finger start position, block's known grid Y, and current scroll
    const frozenScroll = scrollOffsetRef.current;
    dragAnchorRef.current = {
      initialFingerY: absoluteY,
      initialGridY: block.top,
      frozenScrollOffset: frozenScroll,
    };

    // Ghost position in container coords = gridY - scrollOffset
    ghostY.value = block.top - frozenScroll;
    setDragTimeLabel(formatDisplayTime(yToTime(block.top)));
  }, [layoutBlocks, ghostY]);

  const handleDragUpdate = useCallback((absoluteY: number) => {
    const { initialFingerY, initialGridY, frozenScrollOffset } = dragAnchorRef.current;
    const delta = absoluteY - initialFingerY;
    const newGridY = snapY(initialGridY + delta);

    // Ghost in container coords (scroll is frozen)
    ghostY.value = newGridY - frozenScrollOffset;
    setDragTimeLabel(formatDisplayTime(yToTime(newGridY)));
  }, [ghostY]);

  const handleDragEnd = useCallback(() => {
    if (!dragTodo) {
      setScrollEnabled(true);
      return;
    }

    // Compute final time from the current ghost container position
    const { frozenScrollOffset } = dragAnchorRef.current;
    const finalGridY = ghostY.value + frozenScrollOffset;
    const newTime = yToTime(finalGridY);
    onUpdateTodo(dragTodo.id, { dueTime: newTime });

    setDragTodo(null);
    dragBlockRef.current = null;
    setScrollEnabled(true);
  }, [dragTodo, ghostY, onUpdateTodo]);

  const handleTap = useCallback((todo: Todo) => {
    onEditTodo(todo);
  }, [onEditTodo]);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.gridContent}
        scrollEnabled={scrollEnabled}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        onLayout={handleScrollViewLayout}
      >
        <View style={styles.grid}>
          {hours.map((hour) => (
            <HourRow key={hour} hour={hour} />
          ))}

          <CurrentTimeLine />

          {layoutBlocks.map((block) => (
            <TimeBlock
              key={block.todo.id}
              todo={block.todo}
              top={block.top}
              height={block.height}
              left={block.left}
              width={block.width}
              onTap={handleTap}
              onDragStart={handleDragStart}
              onDragUpdate={handleDragUpdate}
              onDragEnd={handleDragEnd}
            />
          ))}
        </View>
      </ScrollView>

      {/* Ghost overlay rendered outside ScrollView */}
      {dragTodo && dragBlockRef.current && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <DragGhost
            todo={dragTodo}
            ghostY={ghostY}
            width={dragBlockRef.current.width}
            height={dragBlockRef.current.height}
            left={dragBlockRef.current.left}
            timeLabel={dragTimeLabel}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  gridContent: {
    paddingBottom: 120, // space for bottom nav
  },
  grid: {
    height: GRID_HEIGHT,
    position: 'relative',
  },
});
