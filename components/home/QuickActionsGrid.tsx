import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { AnimatedPressable } from '@/components/AnimatedPressable';

interface QuickAction {
  key: string;
  label: string;
  emoji: string;
  bg: string;
  route: string;
  todayOnly?: boolean;
}

const ALL_ACTIONS: QuickAction[] = [
  { key: 'add', label: 'Add Task', emoji: '➕', bg: '#E8F5E9', route: '/add-todo' },
  { key: 'focus', label: 'Focus', emoji: '🎯', bg: '#FFF3E0', route: '/flow' },
  { key: 'buddy', label: 'Buddy', emoji: '👯', bg: '#E3F2FD', route: '/buddy' },
  { key: 'review', label: 'Review', emoji: '📋', bg: '#FCE4EC', route: '/incomplete', todayOnly: true },
];

interface QuickActionsGridProps {
  isToday: boolean;
}

export const QuickActionsGrid = memo(function QuickActionsGrid({ isToday }: QuickActionsGridProps) {
  const router = useRouter();

  const actions = useMemo(
    () => ALL_ACTIONS.filter((a) => !a.todayOnly || isToday),
    [isToday],
  );

  return (
    <View style={styles.container}>
      {actions.map((action) => (
        <AnimatedPressable
          key={action.key}
          style={styles.item}
          scaleValue={0.92}
          onPress={() => router.push(action.route as any)}
        >
          <View style={[styles.circle, { backgroundColor: action.bg }]}>
            <Text style={styles.emoji}>{action.emoji}</Text>
          </View>
          <Text style={styles.label}>{action.label}</Text>
        </AnimatedPressable>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  item: {
    alignItems: 'center',
    gap: 6,
  },
  circle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 24,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6C6C70',
  },
});
