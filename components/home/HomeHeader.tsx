import React, { memo, useMemo, useRef, useCallback, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList, Dimensions } from 'react-native';
import { ChevronLeft, ChevronRight, CircleDashed } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Fonts } from '@/lib/typography';
import * as Haptics from '@/lib/haptics';
import { format, addDays, addWeeks, startOfWeek, isSameDay, differenceInCalendarWeeks } from 'date-fns';

const SCREEN_WIDTH = Dimensions.get('window').width;
const ARROW_WIDTH = 24;
const ITEM_WIDTH = SCREEN_WIDTH - ARROW_WIDTH * 2;
const TOTAL_WEEKS = 105;
const CENTER_INDEX = 52;
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface HomeHeaderProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  incompleteDateMap?: Record<string, { incomplete: number; total: number }>;
  tasksCompleted?: number;
  tasksTotal?: number;
}

function generateWeeks(): Date[] {
  const todayWeekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  return Array.from({ length: TOTAL_WEEKS }, (_, i) =>
    addWeeks(todayWeekStart, i - CENTER_INDEX)
  );
}

function getWeekIndexForDate(date: Date): number {
  const todayWeekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  const dateWeekStart = startOfWeek(date, { weekStartsOn: 0 });
  const diff = differenceInCalendarWeeks(dateWeekStart, todayWeekStart, { weekStartsOn: 0 });
  return Math.max(0, Math.min(TOTAL_WEEKS - 1, CENTER_INDEX + diff));
}

function getIncompleteDotColor(count: number): string | null {
  if (count >= 3) return '#FF3B30';
  if (count >= 1) return '#FFCC00';
  return null;
}

const WeekItem = memo(
  function WeekItem({
    weekStart,
    selectedDate,
    onSelectDate,
    incompleteDateMap,
  }: {
    weekStart: Date;
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
    incompleteDateMap?: Record<string, { incomplete: number; total: number }>;
  }) {
    const days = useMemo(
      () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
      [weekStart]
    );

    return (
      <View style={styles.weekItem}>
        {days.map((day, index) => {
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          const dateKey = format(day, 'yyyy-MM-dd');
          const incompleteData = incompleteDateMap?.[dateKey];
          const dotColor = incompleteData ? getIncompleteDotColor(incompleteData.incomplete) : null;
          return (
            <Pressable
              key={day.toISOString()}
              style={styles.dayColumn}
              onPress={() => {
                Haptics.selectionAsync();
                onSelectDate(day);
              }}
            >
              <View style={[
                styles.dayCircle,
                isToday && !isSelected && styles.dayCircleToday,
                isSelected && styles.dayCircleSelected,
                dotColor && !isSelected && { borderWidth: 2, borderColor: dotColor },
              ]}>
                <Text style={[
                  styles.dayNumber,
                  isSelected && styles.dayNumberSelected,
                  isToday && !isSelected && styles.dayNumberToday,
                ]}>
                  {format(day, 'd')}
                </Text>
              </View>
              <Text style={[
                styles.dayLabel,
                isSelected && styles.dayLabelSelected,
              ]}>
                {DAY_LABELS[index]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  },
  (prev, next) => {
    if (prev.weekStart.getTime() !== next.weekStart.getTime()) return false;
    if (prev.onSelectDate !== next.onSelectDate) return false;
    if (prev.incompleteDateMap !== next.incompleteDateMap) return false;
    const weekEndTime = addDays(prev.weekStart, 7).getTime();
    const wsTime = prev.weekStart.getTime();
    const prevIn = prev.selectedDate.getTime() >= wsTime && prev.selectedDate.getTime() < weekEndTime;
    const nextIn = next.selectedDate.getTime() >= wsTime && next.selectedDate.getTime() < weekEndTime;
    if (!prevIn && !nextIn) return true;
    if (prevIn && nextIn) return prev.selectedDate.getTime() === next.selectedDate.getTime();
    return false;
  }
);

export const HomeHeader = memo(function HomeHeader({
  selectedDate,
  onSelectDate,
  incompleteDateMap,
  tasksCompleted = 0,
  tasksTotal = 0,
}: HomeHeaderProps) {
  const router = useRouter();
  const dateLabel = format(selectedDate, 'EEEE, MMM d');
  const showProgress = tasksTotal > 0;
  const allDone = tasksCompleted === tasksTotal && tasksTotal > 0;

  const flatListRef = useRef<FlatList>(null);
  const weeks = useMemo(() => generateWeeks(), []);
  const initialIndex = useMemo(() => getWeekIndexForDate(selectedDate), []);
  const scrollTargetIndex = useRef(initialIndex);

  useEffect(() => {
    const index = getWeekIndexForDate(selectedDate);
    if (index !== scrollTargetIndex.current) {
      scrollTargetIndex.current = index;
      flatListRef.current?.scrollToOffset({ offset: index * ITEM_WIDTH, animated: true });
    }
  }, [selectedDate]);

  const handleScrollEnd = useCallback(
    (event: any) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const weekIndex = Math.round(offsetX / ITEM_WIDTH);
      scrollTargetIndex.current = weekIndex;

      if (weekIndex >= 0 && weekIndex < TOTAL_WEEKS) {
        const weekStart = weeks[weekIndex];
        const dayOfWeek = selectedDate.getDay();
        const newDate = addDays(weekStart, dayOfWeek);
        if (!isSameDay(newDate, selectedDate)) {
          Haptics.selectionAsync();
          onSelectDate(newDate);
        }
      }
    },
    [weeks, selectedDate, onSelectDate]
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: ITEM_WIDTH,
      offset: ITEM_WIDTH * index,
      index,
    }),
    []
  );

  const renderWeek = useCallback(
    ({ item }: { item: Date }) => (
      <WeekItem
        weekStart={item}
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
        incompleteDateMap={incompleteDateMap}
      />
    ),
    [selectedDate, onSelectDate, incompleteDateMap]
  );

  const keyExtractor = useCallback((item: Date) => item.toISOString(), []);

  const scrollToWeek = useCallback(
    (direction: 'prev' | 'next') => {
      const newIndex = scrollTargetIndex.current + (direction === 'next' ? 1 : -1);
      if (newIndex >= 0 && newIndex < TOTAL_WEEKS) {
        scrollTargetIndex.current = newIndex;
        flatListRef.current?.scrollToOffset({ offset: newIndex * ITEM_WIDTH, animated: true });
        const weekStart = weeks[newIndex];
        const dayOfWeek = selectedDate.getDay();
        const newDate = addDays(weekStart, dayOfWeek);
        Haptics.selectionAsync();
        onSelectDate(newDate);
      }
    },
    [weeks, selectedDate, onSelectDate]
  );

  return (
    <View style={styles.container}>
      {/* Date + progress + focus */}
      <View style={styles.topRow}>
        <View style={styles.dateLine}>
          <Text style={styles.dateLabel}>{dateLabel}</Text>
          {showProgress && (
            <View style={[styles.progressPill, allDone && styles.progressPillDone]}>
              <Text style={[styles.progressText, allDone && styles.progressTextDone]}>
                {tasksCompleted}/{tasksTotal}
              </Text>
            </View>
          )}
        </View>
        <Pressable
          style={({ pressed }) => [styles.focusButton, pressed && styles.focusButtonPressed]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/flow' as any);
          }}
          hitSlop={8}
        >
          <CircleDashed size={20} color="#1C1C1E" strokeWidth={1.8} />
        </Pressable>
      </View>

      <View style={styles.weekStripContainer}>
        <Pressable
          style={({ pressed }) => [styles.arrowButton, pressed && styles.arrowButtonPressed]}
          onPress={() => scrollToWeek('prev')}
          hitSlop={4}
        >
          <ChevronLeft size={14} color="#C7C7CC" strokeWidth={2.5} />
        </Pressable>
        <FlatList
          ref={flatListRef}
          data={weeks}
          renderItem={renderWeek}
          keyExtractor={keyExtractor}
          horizontal
          style={styles.weekList}
          snapToInterval={ITEM_WIDTH}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          getItemLayout={getItemLayout}
          initialScrollIndex={initialIndex}
          onMomentumScrollEnd={handleScrollEnd}
        />
        <Pressable
          style={({ pressed }) => [styles.arrowButton, pressed && styles.arrowButtonPressed]}
          onPress={() => scrollToWeek('next')}
          hitSlop={4}
        >
          <ChevronRight size={14} color="#C7C7CC" strokeWidth={2.5} />
        </Pressable>
      </View>
    </View>
  );
});

const DAY_CIRCLE_SIZE = 40;

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: 'transparent',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  dateLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  focusButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(120, 120, 128, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  focusButtonPressed: {
    opacity: 0.5,
  },
  dateLabel: {
    fontSize: 28,
    fontFamily: Fonts.heading,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.5,
  },
  progressPill: {
    backgroundColor: 'rgba(142, 142, 147, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  progressPillDone: {
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    fontVariant: ['tabular-nums'],
  },
  progressTextDone: {
    color: '#34C759',
  },
  weekStripContainer: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowButton: {
    width: ARROW_WIDTH,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowButtonPressed: {
    opacity: 0.4,
  },
  weekList: {
    flex: 1,
  },
  weekItem: {
    width: ITEM_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  dayCircle: {
    width: DAY_CIRCLE_SIZE,
    height: DAY_CIRCLE_SIZE,
    borderRadius: DAY_CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
  },
  dayCircleToday: {
    backgroundColor: '#F2F2F7',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  dayCircleSelected: {
    backgroundColor: '#007AFF',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  dayNumberSelected: {
    color: '#FFFFFF',
  },
  dayNumberToday: {
    color: '#1C1C1E',
    fontWeight: '700',
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8E8E93',
    textTransform: 'capitalize',
  },
  dayLabelSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
