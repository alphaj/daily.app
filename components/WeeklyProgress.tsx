import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { DayCompletion } from '@/types/habit';

interface WeeklyProgressProps {
  progress: DayCompletion[];
  compact?: boolean;
}

export function WeeklyProgress({ progress, compact = false }: WeeklyProgressProps) {
  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {progress.map((day, index) => (
        <View key={day.date} style={styles.dayContainer}>
          <View
            style={[
              styles.dot,
              compact && styles.dotCompact,
              day.completed && styles.dotCompleted,
              day.isToday && !day.completed && styles.dotToday,
            ]}
          >
            {day.completed && <View style={[styles.checkInner, compact && styles.checkInnerCompact]} />}
          </View>
          {!compact && (
            <Text style={[styles.dayLabel, day.isToday && styles.dayLabelToday]}>
              {day.dayName}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  containerCompact: {
    gap: 4,
  },
  dayContainer: {
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotCompact: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  dotCompleted: {
    backgroundColor: '#34C759',
  },
  dotToday: {
    borderWidth: 2,
    borderColor: '#007AFF',
    backgroundColor: 'transparent',
  },
  checkInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  checkInnerCompact: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dayLabel: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
  },
  dayLabelToday: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
