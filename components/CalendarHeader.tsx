import React, { useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { Inbox, Briefcase, Sun, Settings } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { format, isSameDay } from 'date-fns';
import { useWorkMode } from '@/contexts/WorkModeContext';

interface CalendarHeaderProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onOpenCalendar: () => void;
  onOpenInbox: () => void;
  onOpenSettings: () => void;
  inboxCount: number;
  headerLeft?: React.ReactNode;
}

const SEGMENT_WIDTH = 72;
const SEGMENT_HEIGHT = 30;

/**
 * CalendarHeader: Compact header with date, mode toggle, and inbox.
 */
export function CalendarHeader({
  selectedDate,
  onSelectDate,
  onOpenCalendar,
  onOpenInbox,
  onOpenSettings,
  inboxCount,
  headerLeft,
}: CalendarHeaderProps) {
  const { currentMode, setMode } = useWorkMode();
  const isWork = currentMode === 'work';
  const slideAnim = useRef(new Animated.Value(isWork ? 1 : 0)).current;

  const today = new Date();
  const isToday = isSameDay(selectedDate, today);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isWork ? 1 : 0,
      useNativeDriver: false,
      tension: 120,
      friction: 14,
    }).start();
  }, [isWork]);

  const handleSelectMode = useCallback((mode: 'life' | 'work') => {
    if (mode === currentMode) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMode(mode);
  }, [currentMode, setMode]);

  const thumbLeft = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, SEGMENT_WIDTH + 2],
  });

  const thumbColor = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#5AC8FA', '#5856D6'],
  });

  return (
    <View style={styles.container}>
      {/* Top Row: Date (Left) | Actions (Right) */}
      <View style={styles.topRow}>
        <Text style={styles.dateLabel}>
          {format(today, 'EEEE, MMMM d').toUpperCase()}
        </Text>

        <View style={styles.topActions}>
          {/* Settings */}
          <Pressable
            style={({ pressed }) => [styles.inboxButton, pressed && { opacity: 0.6 }]}
            onPress={onOpenSettings}
          >
            <Settings size={20} color="#8E8E93" />
          </Pressable>
          {/* Inbox */}
          <Pressable
            style={({ pressed }) => [styles.inboxButton, pressed && { opacity: 0.6 }]}
            onPress={onOpenInbox}
          >
            <Inbox size={20} color="#007AFF" />
            {inboxCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {inboxCount > 9 ? '9+' : inboxCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* Large Title Row with segmented toggle */}
      <View style={styles.titleRow}>
        <Pressable onPress={onOpenCalendar}>
          <Text style={styles.largeTitle}>{isToday ? 'Today' : format(selectedDate, 'MMM d')}</Text>
        </Pressable>

        {/* Segmented Control */}
        <View style={styles.segmentedTrack}>
          {/* Sliding thumb */}
          <Animated.View
            style={[
              styles.segmentedThumb,
              {
                left: thumbLeft,
                backgroundColor: thumbColor,
              },
            ]}
          />
          {/* Life option */}
          <Pressable
            style={styles.segmentedOption}
            onPress={() => handleSelectMode('life')}
          >
            <Sun size={12} color={isWork ? '#8E8E93' : '#fff'} strokeWidth={2.5} />
            <Text style={[styles.segmentedLabel, !isWork && styles.segmentedLabelActive]}>
              Life
            </Text>
          </Pressable>
          {/* Work option */}
          <Pressable
            style={styles.segmentedOption}
            onPress={() => handleSelectMode('work')}
          >
            <Briefcase size={12} color={isWork ? '#fff' : '#8E8E93'} strokeWidth={2.5} />
            <Text style={[styles.segmentedLabel, isWork && styles.segmentedLabelActive]}>
              Work
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 10,
    backgroundColor: 'transparent',
    paddingBottom: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 4,
    height: 32,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: 0.5,
  },
  inboxButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(242, 242, 247, 0.8)',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF3B30',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  // Title row
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 0.3,
  },
  // Segmented control
  segmentedTrack: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 18,
    height: SEGMENT_HEIGHT + 4,
    width: SEGMENT_WIDTH * 2 + 4,
    alignItems: 'center',
    position: 'relative',
  },
  segmentedThumb: {
    position: 'absolute',
    width: SEGMENT_WIDTH,
    height: SEGMENT_HEIGHT,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentedOption: {
    width: SEGMENT_WIDTH,
    height: SEGMENT_HEIGHT + 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    zIndex: 1,
  },
  segmentedLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
  },
  segmentedLabelActive: {
    color: '#fff',
  },
});
