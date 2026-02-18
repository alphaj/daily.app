import React, { memo, useMemo, useRef, useCallback, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList, Dimensions } from 'react-native';
import { Fonts } from '@/lib/typography';
import { MoreHorizontal, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { format, addDays, addWeeks, startOfWeek, isSameDay, differenceInCalendarWeeks } from 'date-fns';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PEEK_WIDTH = 24;
const ITEM_WIDTH = SCREEN_WIDTH - PEEK_WIDTH * 2;
const TOTAL_WEEKS = 105;
const CENTER_INDEX = 52;
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface HomeHeaderProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onMorePress: () => void;
  onAddPress: () => void;
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

const WeekItem = memo(
  function WeekItem({
    weekStart,
    selectedDate,
    onSelectDate,
  }: {
    weekStart: Date;
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
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
  onMorePress,
  onAddPress,
}: HomeHeaderProps) {
  const dayName = format(selectedDate, 'EEEE');
  const dateString = format(selectedDate, 'MMMM do, yyyy');

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
      />
    ),
    [selectedDate, onSelectDate]
  );

  const keyExtractor = useCallback((item: Date) => item.toISOString(), []);

  return (
    <View style={styles.container}>
      {/* Top row: logo + actions */}
      <View style={styles.topRow}>
        <Text style={styles.logo}>
          daily<Text style={styles.logoDot}>.app</Text>
        </Text>
        <View style={styles.topRight}>
          <Pressable
            style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
            onPress={() => {
              Haptics.selectionAsync();
              onMorePress();
            }}
            hitSlop={8}
          >
            <MoreHorizontal size={20} color="#1C1C1E" strokeWidth={2} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onAddPress();
            }}
            hitSlop={8}
          >
            <Plus size={22} color="#1C1C1E" strokeWidth={2} />
          </Pressable>
        </View>
      </View>

      <Text style={styles.dayName}>{dayName}</Text>
      <Text style={styles.dateText}>{dateString}</Text>

      <View style={styles.weekStripContainer}>
        <FlatList
          ref={flatListRef}
          data={weeks}
          renderItem={renderWeek}
          keyExtractor={keyExtractor}
          horizontal
          snapToInterval={ITEM_WIDTH}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          getItemLayout={getItemLayout}
          initialScrollIndex={initialIndex}
          contentContainerStyle={{ paddingHorizontal: PEEK_WIDTH }}
          onMomentumScrollEnd={handleScrollEnd}
        />
      </View>
    </View>
  );
});

const DAY_CIRCLE_SIZE = 40;

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: 'transparent',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  logo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.5,
  },
  logoDot: {
    color: '#8E8E93',
    fontWeight: '500',
  },
  topRight: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  dayName: {
    fontSize: 34,
    fontFamily: Fonts.heading,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 16,
  },
  weekStripContainer: {
    height: 64,
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
    backgroundColor: '#1C1C1E',
  },
  dayCircleSelected: {
    backgroundColor: '#1C1C1E',
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
    color: '#FFFFFF',
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8E8E93',
    textTransform: 'capitalize',
  },
  dayLabelSelected: {
    color: '#1C1C1E',
    fontWeight: '600',
  },
});
