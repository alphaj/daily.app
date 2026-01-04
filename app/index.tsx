import { useRouter } from 'expo-router';
import { Plus, Trash2, Flame } from 'lucide-react-native';
import React, { useCallback, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useHabits } from '@/contexts/HabitContext';
import { WeeklyProgress } from '@/components/WeeklyProgress';
import { CelebrationOverlay } from '@/components/CelebrationOverlay';
import type { Habit } from '@/types/habit';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = -80;

function HabitItem({ habit, onDelete }: { habit: Habit; onDelete: () => void }) {
  const { toggleHabitCompletion, isCompletedToday, getWeeklyProgress } = useHabits();
  const completed = isCompletedToday(habit);
  const weeklyProgress = getWeeklyProgress(habit);
  
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const deleteOpacity = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(Math.max(gestureState.dx, -100));
          deleteOpacity.setValue(Math.min(Math.abs(gestureState.dx) / 80, 1));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < SWIPE_THRESHOLD) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          Animated.timing(translateX, {
            toValue: -SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onDelete();
          });
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
          Animated.timing(deleteOpacity, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        useNativeDriver: true,
        speed: 50,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
      }),
    ]).start();

    const wasJustCompleted = toggleHabitCompletion(habit.id);
    
    if (wasJustCompleted) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [habit.id, scaleAnim, toggleHabitCompletion]);

  return (
    <View style={styles.habitWrapper}>
      <Animated.View 
        style={[
          styles.deleteBackground,
          { opacity: deleteOpacity }
        ]}
      >
        <Trash2 size={20} color="#fff" />
      </Animated.View>
      
      <Animated.View 
        style={{ 
          transform: [{ scale: scaleAnim }, { translateX }] 
        }}
        {...panResponder.panHandlers}
      >
        <Pressable
          style={[styles.habitItem, completed && styles.habitItemCompleted]}
          onPress={handlePress}
        >
          <View style={styles.habitContent}>
            <View style={[styles.checkbox, completed && styles.checkboxCompleted]}>
              {completed && <View style={styles.checkmark} />}
            </View>
            <View style={styles.habitInfo}>
              <Text style={[styles.habitName, completed && styles.habitNameCompleted]}>
                {habit.name}
              </Text>
              {habit.intention?.cue && (
                <Text style={styles.cueText}>{habit.intention.cue}</Text>
              )}
              <View style={styles.habitMeta}>
                {habit.currentStreak > 0 && (
                  <View style={styles.streakBadge}>
                    <Flame size={12} color="#FF9500" />
                    <Text style={styles.streakText}>{habit.currentStreak}</Text>
                  </View>
                )}
                <WeeklyProgress progress={weeklyProgress} compact />
              </View>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { habits, isLoading, deleteHabit, getMotivationalMessage, getOverallStats } = useHabits();
  const [showCelebration, setShowCelebration] = useState(false);

  const stats = getOverallStats;
  const motivationalMessage = getMotivationalMessage();

  const completedCount = habits.filter(h => {
    const today = new Date().toISOString().split('T')[0];
    return h.completedDates.includes(today);
  }).length;

  const totalCount = habits.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleDelete = useCallback((id: string) => {
    deleteHabit(id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, [deleteHabit]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CelebrationOverlay 
        visible={showCelebration} 
        onComplete={() => setShowCelebration(false)} 
      />
      
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Daily</Text>
          <Text style={styles.motivational}>{motivationalMessage}</Text>
        </View>
        <Pressable
          style={styles.addButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/add-habit');
          }}
        >
          <Plus size={24} color="#007AFF" strokeWidth={2.5} />
        </Pressable>
      </View>

      {totalCount > 0 && (
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <Animated.View 
              style={[
                styles.progressFill, 
                { width: `${progressPercent}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {completedCount}/{totalCount} today
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Loading...</Text>
          </View>
        ) : habits.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Plus size={32} color="#C7C7CC" />
            </View>
            <Text style={styles.emptyTitle}>No habits yet</Text>
            <Text style={styles.emptySubtitle}>
              Add the things you absolutely must do every day
            </Text>
            <Pressable
              style={styles.emptyButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/add-habit');
              }}
            >
              <Text style={styles.emptyButtonText}>Add First Habit</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.habitList}>
            {habits.map(habit => (
              <HabitItem 
                key={habit.id} 
                habit={habit} 
                onDelete={() => handleDelete(habit.id)}
              />
            ))}
            
            {stats.longestStreak > 0 && (
              <View style={styles.statsCard}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.longestStreak}</Text>
                  <Text style={styles.statLabel}>Best Streak</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{Math.round(stats.weeklyCompletionRate * 100)}%</Text>
                  <Text style={styles.statLabel}>This Week</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.totalCompletions}</Text>
                  <Text style={styles.statLabel}>Total Done</Text>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#F2F2F7',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 0.4,
  },
  motivational: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 4,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  progressSection: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  habitList: {
    gap: 10,
  },
  habitWrapper: {
    position: 'relative',
  },
  deleteBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: '#FF3B30',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  habitItem: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  habitItemCompleted: {
    backgroundColor: '#F8FFF8',
  },
  habitContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#D1D1D6',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxCompleted: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  checkmark: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  habitInfo: {
    flex: 1,
    gap: 4,
  },
  habitName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    letterSpacing: -0.4,
  },
  habitNameCompleted: {
    color: '#34C759',
  },
  cueText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  habitMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF5E6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9500',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  statLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E5EA',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: '#007AFF',
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  emptyText: {
    fontSize: 15,
    color: '#8E8E93',
  },
});
