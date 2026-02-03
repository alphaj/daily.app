import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  Animated,
  LayoutAnimation,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Inbox, Briefcase, Sun, Moon, ChevronDown } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { format, subDays, isSameDay } from 'date-fns';
import { useWorkMode } from '@/contexts/WorkModeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_WIDTH = 48;
const DAY_GAP = 6;
const DAY_TOTAL_WIDTH = DAY_WIDTH + DAY_GAP;

interface CalendarHeaderProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onOpenCalendar: () => void;
  onOpenInbox: () => void;
  inboxCount: number;
  hasNoteForDate: (date: Date) => boolean;
}

/**
 * CalendarHeader: A unified navigation pattern
 * 
 * Design:
 * - Replaced segmented control with a premium "Focus Capsule"
 * - Cleaner, more minimal layout
 */
export function CalendarHeader({
  selectedDate,
  onSelectDate,
  onOpenCalendar,
  onOpenInbox,
  inboxCount,
  hasNoteForDate,
}: CalendarHeaderProps) {
  const { currentMode, setMode } = useWorkMode();
  const isWork = currentMode === 'work';
  const scrollRef = useRef<ScrollView>(null);

  // Animate the capsule
  const modeScale = useRef(new Animated.Value(1)).current;

  // Generate calendar days
  const today = new Date();
  const calendarDays = Array.from({ length: 61 }).map((_, i) => subDays(today, 30 - i));
  const todayIndex = 30;

  // Auto-scroll to selected date
  useEffect(() => {
    const selectedIndex = calendarDays.findIndex(d => isSameDay(d, selectedDate));
    if (selectedIndex >= 0 && scrollRef.current) {
      const scrollX = selectedIndex * DAY_TOTAL_WIDTH - (SCREEN_WIDTH / 2) + (DAY_TOTAL_WIDTH / 2);
      scrollRef.current.scrollTo({ x: Math.max(0, scrollX), animated: true });
    }
  }, [selectedDate]);

  const handleDayPress = useCallback((date: Date) => {
    Haptics.selectionAsync();
    if (isSameDay(date, selectedDate)) {
      if (!isSameDay(date, today)) {
        onSelectDate(today);
      }
    } else {
      onSelectDate(date);
    }
  }, [selectedDate, onSelectDate, today]);

  const handleModeToggle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Animate press
    Animated.sequence([
      Animated.timing(modeScale, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.timing(modeScale, { toValue: 1, duration: 150, useNativeDriver: true })
    ]).start();

    // Toggle mode
    setMode(isWork ? 'life' : 'work');
  }, [isWork, setMode]);

  const isToday = isSameDay(selectedDate, today);

  return (
    <View style={styles.container}>
      {/* Context Row */}
      <View style={styles.contextRow}>

        {/* Focus Capsule - The New Switcher */}
        <Pressable onPress={handleModeToggle}>
          <Animated.View style={[
            styles.focusCapsule,
            { transform: [{ scale: modeScale }] }
          ]}>
            <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
            <View style={styles.focusContent}>
              {isWork ? (
                <Briefcase size={14} color="#5856D6" strokeWidth={2.5} />
              ) : (
                <Sun size={14} color="#FF9500" strokeWidth={2.5} />
              )}
              <Text style={styles.focusLabel}>
                {isWork ? 'Work Focus' : 'Life Focus'}
              </Text>
            </View>
          </Animated.View>
        </Pressable>

        {/* Center context */}
        <View style={styles.contextCenter}>
          {isToday ? (
            <Text style={styles.todayLabel}>Today</Text>
          ) : (
            <Pressable onPress={() => onSelectDate(today)}>
              <Text style={styles.dateLabel}>
                {format(selectedDate, 'MMMM d')}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Inbox button */}
        <Pressable style={styles.inboxButton} onPress={onOpenInbox}>
          <Inbox size={20} color="#000" strokeWidth={1.5} />
          {inboxCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {inboxCount > 9 ? '9+' : inboxCount}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Calendar Strip */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.calendarScroll}
        contentContainerStyle={styles.calendarContent}
        decelerationRate="fast"
        snapToInterval={DAY_TOTAL_WIDTH}
        onLayout={() => {
          const selectedIndex = calendarDays.findIndex(d => isSameDay(d, selectedDate));
          const scrollX = (selectedIndex >= 0 ? selectedIndex : todayIndex) * DAY_TOTAL_WIDTH - (SCREEN_WIDTH / 2) + (DAY_TOTAL_WIDTH / 2);
          scrollRef.current?.scrollTo({ x: Math.max(0, scrollX), animated: false });
        }}
      >
        {calendarDays.map((date, index) => {
          const isSelected = isSameDay(date, selectedDate);
          const isTodayDate = isSameDay(date, today);
          const hasNote = hasNoteForDate(date);

          return (
            <Pressable
              key={index}
              style={[styles.dayItem, isSelected && styles.dayItemSelected]}
              onPress={() => handleDayPress(date)}
            >
              <Text style={[
                styles.dayName,
                isSelected && styles.dayNameSelected,
                !isSelected && isTodayDate && styles.dayNameToday,
              ]}>
                {format(date, 'EEE').toUpperCase()}
              </Text>
              <Text style={[
                styles.dayNumber,
                isSelected && styles.dayNumberSelected,
                !isSelected && isTodayDate && styles.dayNumberToday,
              ]}>
                {format(date, 'd')}
              </Text>
              {hasNote && !isSelected && <View style={styles.activityDot} />}
              {isTodayDate && !isSelected && <View style={styles.todayRing} />}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 4,
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 44,
  },
  // Focus Capsule Styles
  focusCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 100, // Pill shape
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.5)', // Fallback
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  focusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  focusLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    letterSpacing: -0.2,
  },
  contextCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: -1,
  },
  todayLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
    letterSpacing: -0.3,
  },
  dateLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
    letterSpacing: -0.3,
  },
  inboxButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  calendarScroll: {
    maxHeight: 80,
  },
  calendarContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: DAY_GAP,
  },
  dayItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: DAY_WIDTH,
    height: 64,
    borderRadius: 20,
    gap: 2,
  },
  dayItemSelected: {
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  dayName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: 0.3,
  },
  dayNameSelected: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  dayNameToday: {
    color: '#007AFF',
    fontWeight: '700',
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  dayNumberSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  dayNumberToday: {
    color: '#007AFF',
    fontWeight: '700',
  },
  activityDot: {
    position: 'absolute',
    bottom: 8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#5856D6',
  },
  todayRing: {
    position: 'absolute',
    width: DAY_WIDTH - 4,
    height: 64 - 4,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(0, 122, 255, 0.25)',
  },
});
