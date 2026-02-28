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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useGoBack } from '@/lib/useGoBack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock, Eye, Plus, Send, ArrowLeft, Settings } from 'lucide-react-native';
import * as Haptics from '@/lib/haptics';

import { useAuth } from '@/contexts/AuthContext';
import { usePartnership } from '@/contexts/PartnershipContext';
import { useSync } from '@/contexts/SyncContext';
import { usePartnerPresence } from '@/hooks/usePartnerPresence';
import { usePartnerInteractions } from '@/hooks/usePartnerInteractions';
import { AmbientBackground } from '@/components/AmbientBackground';
import { Avatar } from '@/components/Avatar';
import { BottomNavBar } from '@/components/BottomNavBar';
import { ReactionPicker } from '@/components/partner/ReactionPicker';
import { NudgePicker } from '@/components/partner/NudgePicker';
import { Fonts } from '@/lib/typography';
import type {
  PartnerData,
  PartnerTodo,
  PartnerEvent,
  PartnerFocusSession,
  PartnerPrivacyMode,
} from '@/lib/sync';
import { fetchPartnerPrivacyMode, deleteAssignedTask } from '@/lib/sync';

function formatTime(time: string | null): string {
  if (!time) return '';
  const [h, m] = time.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${display}:${m} ${ampm}`;
}

function formatDuration(ms: number): string {
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
}

// ── Sections ───────────────────────────────────────────────────────

interface TodoRowProps {
  todo: PartnerTodo;
  onReact?: (todoId: string, pageY: number) => void;
  onLongPress?: (todo: PartnerTodo) => void;
  sentReaction?: string;
}

function TodoRow({ todo, onReact, onLongPress, sentReaction }: TodoRowProps) {
  const handlePress = useCallback(
    (evt: any) => {
      if (todo.completed && onReact) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onReact(todo.id, evt.nativeEvent.pageY);
      }
    },
    [todo.completed, todo.id, onReact],
  );

  const handleLongPress = useCallback(() => {
    if (onLongPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      onLongPress(todo);
    }
  }, [todo, onLongPress]);

  const inner = (
    <View style={styles.todoRow}>
      <View
        style={[
          styles.todoCheckbox,
          todo.completed && styles.todoCheckboxDone,
        ]}
      >
        {todo.completed && <Text style={styles.todoCheckmark}>✓</Text>}
      </View>
      <View style={styles.todoContent}>
        <View style={styles.todoTitleRow}>
          <Text
            style={[
              styles.todoTitle,
              todo.completed && styles.todoTitleDone,
            ]}
          >
            {todo.emoji ? `${todo.emoji} ` : ''}
            {todo.title}
          </Text>
          {sentReaction && (
            <Text style={styles.reactionBadge}>{sentReaction}</Text>
          )}
        </View>
        {todo.dueTime && (
          <Text style={styles.todoTime}>{formatTime(todo.dueTime)}</Text>
        )}
        {todo.subtasks && todo.subtasks.length > 0 && (
          <View style={styles.subtaskList}>
            {todo.subtasks.map((st: any) => (
              <View key={st.id} style={styles.subtaskRow}>
                <View
                  style={[
                    styles.subtaskCheckbox,
                    st.completed && styles.subtaskCheckboxDone,
                  ]}
                >
                  {st.completed && (
                    <Text style={styles.subtaskCheckmark}>✓</Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.subtaskTitle,
                    st.completed && styles.subtaskTitleDone,
                  ]}
                >
                  {st.title}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  if (onReact || onLongPress) {
    return (
      <Pressable
        onPress={todo.completed && onReact ? handlePress : undefined}
        onLongPress={onLongPress ? handleLongPress : undefined}
      >
        {inner}
      </Pressable>
    );
  }

  return inner;
}

interface TodosSectionProps {
  todos: PartnerTodo[];
  currentUserId?: string;
  onReact?: (todoId: string, pageY: number) => void;
  onAssignedTaskAction?: (todo: PartnerTodo) => void;
  sentReactions?: Map<string, string>;
}

function TodosSection({ todos, currentUserId, onReact, onAssignedTaskAction, sentReactions }: TodosSectionProps) {
  if (todos.length === 0) return null;

  const theirTasks = todos.filter((t) => !t.assignedById);
  const fromYou = todos.filter((t) => t.assignedById === currentUserId);
  const completedAll = todos.filter((t) => t.completed).length;

  return (
    <>
      {theirTasks.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tasks</Text>
            <Text style={styles.sectionBadge}>
              {completedAll}/{todos.length}
            </Text>
          </View>
          {theirTasks.map((todo) => (
            <TodoRow
              key={todo.id}
              todo={todo}
              onReact={onReact}
              sentReaction={sentReactions?.get(todo.id)}
            />
          ))}
        </View>
      )}
      {fromYou.length > 0 && (
        <View style={[styles.section, styles.sectionAssigned]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, styles.sectionTitleAssigned]}>From you</Text>
            <Text style={styles.sectionBadge}>
              {fromYou.filter((t) => t.completed).length}/{fromYou.length}
            </Text>
          </View>
          {fromYou.map((todo) => (
            <TodoRow
              key={todo.id}
              todo={todo}
              onReact={onReact}
              onLongPress={onAssignedTaskAction}
              sentReaction={sentReactions?.get(todo.id)}
            />
          ))}
        </View>
      )}
    </>
  );
}

function EventsSection({ events }: { events: PartnerEvent[] }) {
  if (events.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Events</Text>
      {events.map((event) => (
        <View key={event.id} style={styles.eventRow}>
          <View style={[styles.eventDot, { backgroundColor: event.color }]} />
          <View style={styles.eventContent}>
            <Text style={styles.eventTitle}>{event.title}</Text>
            <Text style={styles.eventTime}>
              {event.isAllDay
                ? 'All day'
                : `${formatTime(event.startTime)}${event.endTime ? ` – ${formatTime(event.endTime)}` : ''}`}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function FocusSection({ sessions }: { sessions: PartnerFocusSession[] }) {
  if (sessions.length === 0) return null;

  const totalMs = sessions.reduce((sum, s) => sum + s.actualMs, 0);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Focus</Text>
        <Text style={styles.sectionBadge}>{formatDuration(totalMs)} total</Text>
      </View>
      {sessions.map((s) => (
        <View key={s.id} style={styles.focusRow}>
          <Text style={styles.focusEmoji}>{s.todoEmoji ?? '⏱'}</Text>
          <View style={styles.focusContent}>
            <Text style={styles.focusTitle}>
              {s.todoTitle ?? 'Focus session'}
            </Text>
            <Text style={styles.focusTime}>{formatDuration(s.actualMs)}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────

export default function PartnerDetailScreen() {
  const router = useRouter();
  const goBack = useGoBack();
  const { partnerId: partnerIdParam } = useLocalSearchParams<{ partnerId: string }>();
  const { session } = useAuth();
  const { getPartnership } = usePartnership();
  const { fetchPartnerData, syncNow } = useSync();

  const partnership = partnerIdParam ? getPartnership(partnerIdParam) : undefined;
  const partnerId = partnership?.partner_id ?? null;
  const partnershipId = partnership?.partnership_id ?? null;

  const { isOnline, lastActiveText } = usePartnerPresence(partnerId, partnershipId);
  const { sendReaction, sendNudge, sentReactions, markAllRead } = usePartnerInteractions(partnerId);
  const [data, setData] = useState<PartnerData | null>(null);
  const [privacyMode, setPrivacyMode] = useState<PartnerPrivacyMode>('open');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Reaction picker state
  const [reactionTarget, setReactionTarget] = useState<{ todoId: string; pageY: number } | null>(null);
  // Nudge picker state
  const [nudgePickerVisible, setNudgePickerVisible] = useState(false);

  // Mark all interactions read when screen loads and when interactions data changes
  useEffect(() => {
    markAllRead();
  }, [markAllRead]);

  const loadData = useCallback(async () => {
    // Fetch privacy mode first
    if (partnerId) {
      const mode = await fetchPartnerPrivacyMode(partnerId);
      setPrivacyMode(mode);

      // Only fetch full data if partner is in open mode
      if (mode === 'open') {
        const result = await fetchPartnerData(partnerId);
        setData(result);
      } else {
        setData(null);
      }
    }
  }, [fetchPartnerData, partnerId]);

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

  const partnerName = partnership?.partner_name ?? 'Partner';

  const handleAssignedTaskAction = useCallback((todo: PartnerTodo) => {
    const options = ['Edit', 'Delete', 'Cancel'];
    const destructiveButtonIndex = 1;
    const cancelButtonIndex = 2;

    const doAction = (buttonIndex: number) => {
      if (buttonIndex === 0) {
        // Edit - navigate to add-todo in edit-assigned mode
        router.push(
          `/add-todo?forPartnerId=${partnerId}&editAssignedId=${todo.id}` as any,
        );
      } else if (buttonIndex === 1) {
        // Delete
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
      // Android fallback using Alert
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
    data.events.length === 0 &&
    data.focusSessions.length === 0;

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={styles.container}>
      <AmbientBackground />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable
              style={styles.backButton}
              onPress={goBack}
              hitSlop={20}
            >
              <ArrowLeft size={20} color="#000" strokeWidth={2.5} />
            </Pressable>
            <View>
              <Text style={styles.headerName}>{partnerName}</Text>
              {privacyMode === 'open' && isOnline ? (
                <View style={styles.presenceRow}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.presenceOnline}>Online now</Text>
                </View>
              ) : privacyMode === 'open' && lastActiveText ? (
                <Text style={styles.presenceOffline}>Active {lastActiveText}</Text>
              ) : (
                <Text style={styles.headerDate}>{today}</Text>
              )}
            </View>
          </View>
          <View style={styles.headerRight}>
            {privacyMode === 'open' && (
              <Pressable
                style={styles.nudgeButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setNudgePickerVisible(true);
                }}
              >
                <Send size={16} color="#007AFF" strokeWidth={2.2} />
                <Text style={styles.nudgeButtonText}>Nudge</Text>
              </Pressable>
            )}
            <Pressable
              style={styles.settingsButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/partner-settings');
              }}
              hitSlop={20}
            >
              <Settings size={20} color="#000" strokeWidth={1.8} />
            </Pressable>
            <Avatar
              uri={partnership?.partner_avatar_url}
              name={partnerName}
              size={44}
              showOnlineBadge={isOnline && privacyMode === 'open'}
            />
          </View>
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
              <View style={styles.privacyContainer}>
                <Lock size={48} color="#8E8E93" strokeWidth={1.5} />
                <Text style={styles.privacyTitle}>Private Mode</Text>
                <Text style={styles.privacySubtitle}>
                  {partnerName} has turned on private mode.{'\n'}
                  Their data is hidden for now.
                </Text>
              </View>
            ) : privacyMode === 'focus' ? (
              <View style={styles.privacyContainer}>
                <Eye size={48} color="#FF9500" strokeWidth={1.5} />
                <Text style={styles.privacyTitle}>Focus Mode</Text>
                <Text style={styles.privacySubtitle}>
                  {partnerName} is currently focusing.{'\n'}
                  Details are hidden while they concentrate.
                </Text>
              </View>
            ) : isEmpty ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>Nothing shared yet</Text>
                <Text style={styles.emptySubtitle}>
                  {partnerName}'s shared data will appear here
                </Text>
              </View>
            ) : (
              <>
                {data && (
                  <TodosSection
                    todos={data.todos}
                    currentUserId={session?.user?.id}
                    onReact={handleReact}
                    onAssignedTaskAction={handleAssignedTaskAction}
                    sentReactions={sentReactions}
                  />
                )}
                {data && <EventsSection events={data.events} />}
                {data && <FocusSection sessions={data.focusSessions} />}
              </>
            )}

            {/* Bottom spacer for nav bar */}
            <View style={{ height: 100 }} />
          </ScrollView>
        )}
      </SafeAreaView>
      {privacyMode === 'open' && (
        <Pressable
          style={styles.fab}
          onPress={() => router.push(`/add-todo?forPartnerId=${partnerId}`)}
        >
          <Plus size={24} color="#fff" strokeWidth={2.5} />
        </Pressable>
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
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
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
  headerName: {
    fontSize: 28,
    fontFamily: Fonts.heading,
    fontWeight: '700',
    color: '#000',
    letterSpacing: -0.5,
  },
  headerDate: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 2,
  },
  presenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34C759',
    marginRight: 6,
  },
  presenceOnline: {
    fontSize: 15,
    color: '#34C759',
    fontWeight: '500',
  },
  presenceOffline: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 2,
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // ── Sections ──
  section: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  sectionBadge: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },

  // ── Todos ──
  todoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  todoCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D1D6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  todoCheckboxDone: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  todoCheckmark: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  todoContent: { flex: 1 },
  todoTitle: {
    fontSize: 16,
    color: '#000',
    fontWeight: '400',
  },
  todoTitleDone: {
    color: '#8E8E93',
    textDecorationLine: 'line-through',
  },
  todoTime: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  subtaskList: {
    marginTop: 6,
    marginLeft: 2,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
  },
  subtaskCheckbox: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#D1D1D6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  subtaskCheckboxDone: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  subtaskCheckmark: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  subtaskTitle: {
    fontSize: 14,
    color: '#3C3C43',
  },
  subtaskTitleDone: {
    color: '#8E8E93',
    textDecorationLine: 'line-through',
  },

  // ── Events ──
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  eventDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  eventContent: { flex: 1 },
  eventTitle: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  eventTime: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },

  // ── Focus ──
  focusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  focusEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  focusContent: { flex: 1 },
  focusTitle: {
    fontSize: 16,
    color: '#000',
    fontWeight: '400',
  },
  focusTime: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },

  // ── Privacy modes ──
  privacyContainer: {
    paddingTop: 80,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  privacyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  privacySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },

  // ── Header right ──
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  settingsButton: {
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
  nudgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,122,255,0.08)',
  },
  nudgeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },

  // ── Todo title row + reaction badge ──
  todoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reactionBadge: {
    fontSize: 16,
    marginLeft: 6,
  },

  // ── Assigned section ──
  sectionAssigned: {
    backgroundColor: 'rgba(0,122,255,0.06)',
  },
  sectionTitleAssigned: {
    color: '#007AFF',
  },

  // ── FAB ──
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },

  // ── Empty ──
  emptyContainer: {
    paddingTop: 80,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
});
