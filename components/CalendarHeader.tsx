import React, { useRef, useCallback } from 'react';
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
  const modeScale = useRef(new Animated.Value(1)).current;

  const today = new Date();
  const isToday = isSameDay(selectedDate, today);

  const handleModeToggle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(modeScale, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.timing(modeScale, { toValue: 1, duration: 150, useNativeDriver: true })
    ]).start();
    setMode(isWork ? 'life' : 'work');
  }, [isWork, setMode]);

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

      {/* Large Title Row with capsules */}
      <View style={styles.titleRow}>
        <Pressable onPress={onOpenCalendar}>
          <Text style={styles.largeTitle}>{isToday ? 'Today' : format(selectedDate, 'MMM d')}</Text>
        </Pressable>

        <View style={styles.capsuleRow}>
          {/* Mode Toggle */}
          <Pressable onPress={handleModeToggle}>
            <Animated.View style={[
              styles.focusCapsule,
              { transform: [{ scale: modeScale }] }
            ]}>
              {isWork ? (
                <Briefcase size={12} color="#5856D6" strokeWidth={2.5} />
              ) : (
                <Sun size={12} color="#FF9500" strokeWidth={2.5} />
              )}
              <Text style={styles.focusLabel}>
                {isWork ? 'Work' : 'Life'}
              </Text>
            </Animated.View>
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
  capsuleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  focusCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    gap: 6,
  },
  focusLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
});
