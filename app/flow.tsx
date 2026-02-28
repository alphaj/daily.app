import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { AmbientBackground } from '@/components/AmbientBackground';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from '@/lib/haptics';
import { Pause, Play, RotateCcw } from 'lucide-react-native';
import { format } from 'date-fns';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Easing,
} from 'react-native-reanimated';

import { Fonts } from '@/lib/typography';
import { Logo } from '@/components/Logo';
import { useFocus } from '@/contexts/FocusContext';
import { FocusProgressRing } from '@/components/focus/FocusProgressRing';
import { FocusTaskCarousel } from '@/components/focus/FocusTaskCarousel';
import { FocusOverlay } from '@/components/focus/FocusOverlay';
import { BottomNavBar } from '@/components/BottomNavBar';

const DURATION_PRESETS = [25, 30, 45, 60, 90];

function formatMMSS(ms: number): string {
  const totalSeconds = Math.max(Math.ceil(ms / 1000), 0);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function FlowScreen() {
  const {
    session,
    status,
    remainingMs,
    progress,
    startSession,
    pauseSession,
    resumeSession,
    cancelSession,
    resetSession,
  } = useFocus();

  const [selectedDuration, setSelectedDuration] = useState(45);
  const [selectedTask, setSelectedTask] = useState<{
    todoId: string;
    title: string;
    emoji?: string;
  } | null>(null);


  // 0 = idle, 1 = in-cocoon (running/paused), 2 = completed
  const cocoon = useSharedValue(0);

  const isInCocoon = status === 'running' || status === 'paused';
  const isCompleted = status === 'completed';

  useEffect(() => {
    if (isInCocoon) {
      // Enter cocoon — slightly slower for that deliberate "sinking in" feel
      cocoon.value = withTiming(1, {
        duration: 700,
        easing: Easing.out(Easing.cubic),
      });
    } else if (isCompleted) {
      cocoon.value = withTiming(2, {
        duration: 500,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      // Return to idle — spring back out
      cocoon.value = withSpring(0, { damping: 20, stiffness: 180 });
    }
  }, [isInCocoon, isCompleted]);

  // -- Idle layer: visible at cocoon=0, fades/scales out toward 1 --
  const idleStyle = useAnimatedStyle(() => {
    const opacity = interpolate(cocoon.value, [0, 0.6], [1, 0], 'clamp');
    const scale = interpolate(cocoon.value, [0, 1], [1, 0.92], 'clamp');
    const translateY = interpolate(cocoon.value, [0, 1], [0, 20], 'clamp');
    return {
      opacity,
      transform: [{ scale }, { translateY }],
      // Keep interactive only when visible
      pointerEvents: opacity > 0.1 ? 'auto' : 'none',
    };
  });

  // -- Running layer: invisible at cocoon=0, fades/scales in at 1 --
  const runningStyle = useAnimatedStyle(() => {
    const opacity = interpolate(cocoon.value, [0.4, 1], [0, 1], 'clamp');
    const scale = interpolate(cocoon.value, [0, 1], [1.06, 1], 'clamp');
    const translateY = interpolate(cocoon.value, [0, 1], [-15, 0], 'clamp');
    return {
      opacity,
      transform: [{ scale }, { translateY }],
      pointerEvents: opacity > 0.1 ? 'auto' : 'none',
    };
  });

  // -- Completed layer: invisible until cocoon=2 --
  const completedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(cocoon.value, [1.3, 2], [0, 1], 'clamp');
    const scale = interpolate(cocoon.value, [1.3, 2], [0.95, 1], 'clamp');
    return {
      opacity,
      transform: [{ scale }],
      pointerEvents: opacity > 0.1 ? 'auto' : 'none',
    };
  });

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    requestAnimationFrame(() => startSession(selectedDuration, selectedTask));
  };

  const handlePauseResume = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    requestAnimationFrame(() => {
      if (status === 'running') {
        pauseSession();
      } else if (status === 'paused') {
        resumeSession();
      }
    });
  };


  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    requestAnimationFrame(() => cancelSession());
  };

  const handleNewSession = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    requestAnimationFrame(() => {
      resetSession();
      setSelectedTask(null);
    });
  };

  const insets = useSafeAreaInsets();

  const startTime = session ? format(new Date(session.startedAt), 'h:mm a') : '';
  const endTime = session ? format(new Date(session.endAt), 'h:mm a') : '';

  return (
    <View style={styles.container}>
      <AmbientBackground />
      <FocusOverlay active={isInCocoon} running={status === 'running'} />

      <View style={styles.safeArea}>
        {/* ===== PERSISTENT TITLE — stays perfectly still during transitions ===== */}
        <View style={[styles.persistentHeader, { paddingTop: insets.top + 8 }]} pointerEvents="none">
          <View style={styles.logoRow}>
            <Logo />
          </View>
          <Text style={styles.title}>Focus</Text>
        </View>

        {/* ===== IDLE LAYER ===== */}
        <Animated.View style={[styles.layer, idleStyle]}>
          <View style={[styles.headerSpacer, { paddingTop: insets.top + 8 }]}>
            <View style={styles.logoPlaceholder} />
            <View style={styles.titlePlaceholder} />
          </View>

          <View style={styles.centerContent}>
            <FocusProgressRing
              progress={0}
              emoji={selectedTask?.emoji}
              timerStatus="paused"
              onPress={handleStart}
            />

            <FocusTaskCarousel
              selectedTodoId={selectedTask?.todoId ?? null}
              onSelectTodo={(todo) => {
                if (todo) {
                  setSelectedTask({ todoId: todo.id, title: todo.title, emoji: todo.emoji });
                } else {
                  setSelectedTask(null);
                }
              }}
            />

            <Text style={styles.countdown}>
              {String(selectedDuration).padStart(2, '0')}:00
            </Text>

            <View style={styles.presetRow}>
              {DURATION_PRESETS.map((min) => (
                <Pressable
                  key={min}
                  style={[
                    styles.presetPill,
                    selectedDuration === min && styles.presetPillActive,
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedDuration(min);
                  }}
                >
                  <Text
                    style={[
                      styles.presetText,
                      selectedDuration === min && styles.presetTextActive,
                    ]}
                  >
                    {min}m
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* ===== RUNNING / PAUSED LAYER ===== */}
        <Animated.View style={[styles.layer, runningStyle]}>
          <View style={[styles.headerSpacer, { paddingTop: insets.top + 8 }]}>
            <View style={styles.logoPlaceholder} />
            <View style={styles.titlePlaceholder} />
          </View>

          <View style={styles.centerContent}>
            {session?.todoTitle && (
              <Text style={styles.taskTitle}>{session.todoTitle}</Text>
            )}

            <Text style={styles.timeRange}>
              {startTime}  →  {endTime}
            </Text>

            <FocusProgressRing
              progress={progress}
              emoji={session?.todoEmoji}
              timerStatus={isInCocoon ? status as 'running' | 'paused' : null}
              onPress={handlePauseResume}
            />

            <Text style={styles.countdown}>{formatMMSS(remainingMs)}</Text>

            <View style={styles.controlsRow}>
              <Pressable style={styles.endCircle} onPress={handleCancel}>
                <Text style={styles.endCircleText}>End</Text>
              </Pressable>

              <Pressable style={styles.pauseCircle} onPress={handlePauseResume}>
                {status === 'running' ? (
                  <Pause size={24} color="#fff" fill="#fff" strokeWidth={0} />
                ) : (
                  <Play size={24} color="#fff" fill="#fff" strokeWidth={0} />
                )}
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {/* ===== COMPLETED LAYER ===== */}
        <Animated.View style={[styles.layer, completedStyle]}>
          <View style={[styles.headerSpacer, { paddingTop: insets.top + 8 }]}>
            <View style={styles.logoPlaceholder} />
            <View style={styles.titlePlaceholder} />
          </View>

          <View style={styles.centerContent}>
            <Text style={styles.completedEmoji}>🎉</Text>
            <Text style={styles.completedTitle}>Session Complete!</Text>
            {session?.todoTitle && (
              <Text style={styles.completedTaskLabel}>
                {session.todoEmoji ? `${session.todoEmoji} ` : ''}{session.todoTitle}
              </Text>
            )}
            {session && (
              <Text style={styles.completedSubtitle}>
                {Math.round(session.durationMs / 60000)} minutes of focus
              </Text>
            )}

            <Pressable style={styles.newSessionButton} onPress={handleNewSession}>
              <RotateCcw size={18} color="#fff" strokeWidth={2} />
              <Text style={styles.newSessionText}>Start another</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>

      <BottomNavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  safeArea: {
    flex: 1,
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  logoRow: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  persistentHeader: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerSpacer: {
    // invisible spacer matching the persistent header height
  },
  logoPlaceholder: {
    height: 22, // matches Logo text height
    marginBottom: 16,
  },
  titlePlaceholder: {
    height: 41, // matches title line height
  },
  title: {
    fontSize: 34,
    fontFamily: Fonts.heading,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  endCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  endCircleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
  pauseCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
    gap: 20,
  },
  taskTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 4,
  },
  timeRange: {
    fontSize: 15,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 8,
  },
  countdown: {
    fontSize: 64,
    fontWeight: '300',
    color: '#1C1C1E',
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
    marginTop: 4,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
    marginTop: 8,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  presetPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  presetPillActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.12)',
  },
  presetText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8E8E93',
  },
  presetTextActive: {
    color: '#007AFF',
  },
  completedEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  completedTitle: {
    fontSize: 28,
    fontFamily: Fonts.heading,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  completedTaskLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 4,
  },
  completedSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 24,
  },
  newSessionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
  },
  newSessionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
