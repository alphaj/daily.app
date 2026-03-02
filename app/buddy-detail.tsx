import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useGoBack } from '@/lib/useGoBack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Settings, Plus } from 'lucide-react-native';
import * as Haptics from '@/lib/haptics';

import { useAuth } from '@/contexts/AuthContext';
import { useBuddy } from '@/contexts/BuddyContext';
import { useSync } from '@/contexts/SyncContext';
import { useBuddyPresence } from '@/hooks/useBuddyPresence';
import { useBuddyInteractions } from '@/hooks/useBuddyInteractions';
import { AmbientBackground } from '@/components/AmbientBackground';
import { BottomNavBar } from '@/components/BottomNavBar';
import { ReactionPicker } from '@/components/buddy/ReactionPicker';
import { NudgePicker } from '@/components/buddy/NudgePicker';

import { HeroProfileCard } from '@/components/buddy-detail/HeroProfileCard';
import { ActivitySummaryStrip } from '@/components/buddy-detail/ActivitySummaryStrip';
import { BuddyTaskList } from '@/components/buddy-detail/BuddyTaskList';
import { FocusTimelineSection } from '@/components/buddy-detail/FocusTimelineSection';
import { BuddyEmptyState } from '@/components/buddy-detail/BuddyEmptyState';
import { BuddyPrivacyState } from '@/components/buddy-detail/BuddyPrivacyState';

import type {
  BuddyData,
  BuddyTodo,
  BuddyPrivacyMode,
} from '@/lib/sync';
import { fetchBuddyPrivacyMode, deleteAssignedTask } from '@/lib/sync';

// ── Main Screen ────────────────────────────────────────────────────

export default function BuddyDetailScreen() {
  const router = useRouter();
  const goBack = useGoBack();
  const { partnerId: partnerIdParam } = useLocalSearchParams<{ partnerId: string }>();
  const { session } = useAuth();
  const { getBuddy } = useBuddy();
  const { fetchBuddyData, syncNow } = useSync();

  const partnership = partnerIdParam ? getBuddy(partnerIdParam) : undefined;
  const partnerId = partnership?.partner_id ?? null;
  const partnershipId = partnership?.partnership_id ?? null;

  const { isOnline, lastActiveText } = useBuddyPresence(partnerId, partnershipId);
  const { sendReaction, sendNudge, sentReactions, markAllRead } = useBuddyInteractions(partnerId);
  const [data, setData] = useState<BuddyData | null>(null);
  const [privacyMode, setPrivacyMode] = useState<BuddyPrivacyMode>('visible');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Reaction picker state
  const [reactionTarget, setReactionTarget] = useState<{ todoId: string; pageY: number } | null>(null);
  // Nudge picker state
  const [nudgePickerVisible, setNudgePickerVisible] = useState(false);

  // FAB press animation
  const fabScale = useSharedValue(1);
  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  useEffect(() => {
    markAllRead();
  }, [markAllRead]);

  const loadData = useCallback(async () => {
    if (partnerId) {
      const mode = await fetchBuddyPrivacyMode(partnerId);
      setPrivacyMode(mode);

      if (mode === 'visible') {
        const result = await fetchBuddyData(partnerId);
        setData(result);
      } else {
        setData(null);
      }
    }
  }, [fetchBuddyData, partnerId]);

  useEffect(() => {
    (async () => {
      await loadData();
      setIsLoading(false);
    })();
  }, [loadData]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await syncNow();
    await loadData();
    setIsRefreshing(false);
  }, [syncNow, loadData]);

  const handleReact = useCallback((todoId: string, pageY: number) => {
    setReactionTarget({ todoId, pageY });
  }, []);

  const handleReactionSelect = useCallback(
    (emoji: string) => {
      if (reactionTarget) {
        sendReaction(reactionTarget.todoId, emoji);
      }
      setReactionTarget(null);
    },
    [reactionTarget, sendReaction],
  );

  const handleNudgeSelect = useCallback(
    (emoji: string, message: string) => {
      sendNudge(emoji, message);
      setNudgePickerVisible(false);
    },
    [sendNudge],
  );

  const partnerName = partnership?.partner_name ?? 'Buddy';

  const handleAssignedTaskAction = useCallback((todo: BuddyTodo) => {
    const options = ['Edit', 'Delete', 'Cancel'];
    const destructiveButtonIndex = 1;
    const cancelButtonIndex = 2;

    const doAction = (buttonIndex: number) => {
      if (buttonIndex === 0) {
        router.push(
          `/add-todo?forPartnerId=${partnerId}&editAssignedId=${todo.id}` as any,
        );
      } else if (buttonIndex === 1) {
        Alert.alert(
          'Delete assigned task?',
          `This will remove "${todo.title}" from ${partnerName}'s tasks.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                if (!partnerId) return;
                const result = await deleteAssignedTask(todo.id, partnerId);
                if (result.success) {
                  await loadData();
                }
              },
            },
          ],
        );
      }
    };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, destructiveButtonIndex, cancelButtonIndex },
        doAction,
      );
    } else {
      Alert.alert(
        todo.title,
        undefined,
        [
          { text: 'Edit', onPress: () => doAction(0) },
          { text: 'Delete', style: 'destructive', onPress: () => doAction(1) },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
    }
  }, [partnerId, partnerName, router, loadData]);

  const isEmpty =
    data &&
    data.todos.length === 0 &&
    data.focusSessions.length === 0;

  // Derived stats
  const completedCount = data?.todos.filter((t) => t.completed).length ?? 0;
  const totalCount = data?.todos.length ?? 0;
  const completionRatio = totalCount > 0 ? completedCount / totalCount : 0;
  const totalFocusMs = data?.focusSessions.reduce((s, f) => s + f.actualMs, 0) ?? 0;
  const focusMinutes = Math.round(totalFocusMs / 60000);
  const sessionCount = data?.focusSessions.length ?? 0;

  return (
    <View style={styles.container}>
      <AmbientBackground />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Minimal header: back + settings */}
        <View style={styles.header}>
          <Pressable
            style={styles.headerButton}
            onPress={goBack}
            hitSlop={20}
          >
            <ArrowLeft size={20} color="#000" strokeWidth={2.5} />
          </Pressable>
          <Pressable
            style={styles.headerButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/buddy-settings');
            }}
            hitSlop={20}
          >
            <Settings size={20} color="#000" strokeWidth={1.8} />
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
            }
          >
            {privacyMode === 'private' ? (
              <BuddyPrivacyState partnerName={partnerName} />
            ) : (
              <>
                {/* Hero card — always shows when visible */}
                <HeroProfileCard
                  avatarUri={partnership?.partner_avatar_url}
                  name={partnerName}
                  isOnline={isOnline}
                  lastActiveText={lastActiveText}
                  completionRatio={completionRatio}
                  partnerSinceDate={partnership?.created_at}
                  onNudge={() => setNudgePickerVisible(true)}
                />

                {isEmpty ? (
                  <BuddyEmptyState partnerName={partnerName} />
                ) : (
                  <>
                    {/* Stats strip */}
                    <ActivitySummaryStrip
                      completedCount={completedCount}
                      totalCount={totalCount}
                      focusMinutes={focusMinutes}
                      sessionCount={sessionCount}
                    />

                    {/* Task list */}
                    {data && (
                      <BuddyTaskList
                        todos={data.todos}
                        currentUserId={session?.user?.id}
                        onReact={handleReact}
                        onAssignedTaskAction={handleAssignedTaskAction}
                        sentReactions={sentReactions}
                      />
                    )}

                    {/* Focus timeline */}
                    {data && data.focusSessions.length > 0 && (
                      <FocusTimelineSection sessions={data.focusSessions} />
                    )}
                  </>
                )}
              </>
            )}

            {/* Bottom spacer for nav bar */}
            <View style={{ height: 100 }} />
          </ScrollView>
        )}
      </SafeAreaView>

      {/* FAB — capsule with label */}
      {privacyMode === 'visible' && (
        <Animated.View style={[styles.fab, fabStyle]}>
          <Pressable
            style={styles.fabInner}
            onPress={() => router.push(`/add-todo?forBuddyId=${partnerId}`)}
            onPressIn={() => {
              fabScale.value = withSpring(0.94, { damping: 15, stiffness: 400 });
            }}
            onPressOut={() => {
              fabScale.value = withSpring(1, { damping: 15, stiffness: 400 });
            }}
          >
            <Plus size={20} color="#fff" strokeWidth={2.5} />
            <Text style={styles.fabLabel}>Assign task</Text>
          </Pressable>
        </Animated.View>
      )}

      <BottomNavBar />
      <ReactionPicker
        visible={!!reactionTarget}
        anchorY={reactionTarget?.pageY ?? 0}
        onSelect={handleReactionSelect}
        onDismiss={() => setReactionTarget(null)}
      />
      <NudgePicker
        visible={nudgePickerVisible}
        onSelect={handleNudgeSelect}
        onDismiss={() => setNudgePickerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingTop: 4 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // FAB — capsule shape
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    zIndex: 10,
  },
  fabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#007AFF',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 24,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: -0.2,
  },
});
