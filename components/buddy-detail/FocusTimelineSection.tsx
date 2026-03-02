import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  type SharedValue,
} from 'react-native-reanimated';
import type { BuddyFocusSession } from '@/lib/sync';

const SPRING_CONFIG = { damping: 28, stiffness: 420, mass: 0.9 };

function formatDuration(ms: number): string {
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
}

function formatTimeOfDay(isoString: string): string {
  const d = new Date(isoString);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}:${m.toString().padStart(2, '0')} ${ampm}`;
}

interface FocusTimelineSectionProps {
  sessions: BuddyFocusSession[];
}

function SessionRow({
  session,
  index,
  maxMs,
  isLast,
  progress,
}: {
  session: BuddyFocusSession;
  index: number;
  maxMs: number;
  isLast: boolean;
  progress: SharedValue<number>;
}) {
  const barWidth = Math.max(20, (session.actualMs / maxMs) * 100);

  const style = useAnimatedStyle(() => {
    const delay = index * 0.06;
    const p = interpolate(progress.value, [delay, delay + 0.5], [0, 1], 'clamp');
    return {
      opacity: p,
      transform: [{ translateX: interpolate(p, [0, 1], [16, 0]) }],
    };
  });

  return (
    <Animated.View style={[styles.sessionRow, style]}>
      {/* Time marker */}
      <View style={styles.timeColumn}>
        <Text style={styles.timeText}>{formatTimeOfDay(session.startedAt)}</Text>
        {!isLast && <View style={styles.connector} />}
      </View>

      {/* Bar + content */}
      <View style={styles.barColumn}>
        <View style={[styles.bar, { width: `${barWidth}%` }]}>
          <Text style={styles.barEmoji}>{session.todoEmoji ?? '⏱'}</Text>
          <Text style={styles.barTitle} numberOfLines={1}>
            {session.todoTitle ?? 'Focus'}
          </Text>
        </View>
        <Text style={styles.durationLabel}>{formatDuration(session.actualMs)}</Text>
      </View>
    </Animated.View>
  );
}

export function FocusTimelineSection({ sessions }: FocusTimelineSectionProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withSpring(1, SPRING_CONFIG);
  }, []);

  if (sessions.length === 0) return null;

  const totalMs = sessions.reduce((sum, s) => sum + s.actualMs, 0);
  const maxMs = Math.max(...sessions.map((s) => s.actualMs), 1);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Focus</Text>
        <View style={styles.totalBadge}>
          <Text style={styles.totalText}>{formatDuration(totalMs)} total</Text>
        </View>
      </View>
      {sessions.map((s, i) => (
        <SessionRow
          key={s.id}
          session={s}
          index={i}
          maxMs={maxMs}
          isLast={i === sessions.length - 1}
          progress={progress}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  totalBadge: {
    backgroundColor: 'rgba(0,122,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  totalText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
  },
  sessionRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  timeColumn: {
    width: 62,
    alignItems: 'flex-end',
    paddingRight: 12,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8E8E93',
    marginTop: 8,
  },
  connector: {
    width: 1,
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginTop: 4,
    alignSelf: 'center',
    marginRight: 4,
    minHeight: 12,
  },
  barColumn: {
    flex: 1,
    marginBottom: 8,
  },
  bar: {
    height: 32,
    backgroundColor: 'rgba(0,122,255,0.08)',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 6,
    minWidth: 60,
  },
  barEmoji: {
    fontSize: 14,
  },
  barTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1C1C1E',
    flex: 1,
  },
  durationLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 3,
    marginLeft: 2,
  },
});
