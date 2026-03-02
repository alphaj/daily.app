import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  type SharedValue,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Settings,
  UserPlus,
  Check,
  X,
  Clock,
  Send,
  ChevronRight,
  Heart,
} from 'lucide-react-native';
import * as Haptics from '@/lib/haptics';

import { useBuddy, BuddyStatus } from '@/contexts/BuddyContext';
import { useBuddyInteractions } from '@/hooks/useBuddyInteractions';
import { AmbientBackground } from '@/components/AmbientBackground';
import { Avatar } from '@/components/Avatar';
import { BottomNavBar } from '@/components/BottomNavBar';
import { Fonts } from '@/lib/typography';

// ── Partner Card ────────────────────────────────────────────────────

function BuddyCard({
  partner,
  index,
  entrance,
}: {
  partner: BuddyStatus;
  index: number;
  entrance: SharedValue<number>;
}) {
  const router = useRouter();
  const scale = useSharedValue(1);

  const entranceStyle = useAnimatedStyle(() => {
    const delay = index * 0.08;
    const p = interpolate(entrance.value, [delay, delay + 0.5], [0, 1], 'clamp');
    return {
      opacity: p,
      transform: [{ translateY: interpolate(p, [0, 1], [16, 0]) }],
    };
  });

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  }, []);

  const sinceLabel = partner.created_at
    ? new Date(partner.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'today';

  return (
    <Animated.View style={[entranceStyle, { marginBottom: 10 }]}>
      <Animated.View style={[pressStyle, styles.cardShadow]}>
        <Pressable
          style={styles.partnerCard}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push(`/buddy-detail?partnerId=${partner.partner_id}`);
          }}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Avatar
            uri={partner.partner_avatar_url}
            name={partner.partner_name}
            size={52}
          />
          <View style={styles.partnerCardInfo}>
            <Text style={styles.partnerCardName}>
              {partner.partner_name ?? 'Buddy'}
            </Text>
            <Text style={styles.partnerCardSince}>
              Since {sinceLabel}
            </Text>
          </View>
          <View style={styles.chevronWrap}>
            <ChevronRight size={18} color="#C7C7CC" strokeWidth={2} />
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

// ── Pending Request Card ────────────────────────────────────────────

function PendingRequestCard({
  partner,
  index,
  entrance,
}: {
  partner: BuddyStatus;
  index: number;
  entrance: SharedValue<number>;
}) {
  const { respondToBuddy, nudgePendingRequest } = useBuddy();
  const [isResponding, setIsResponding] = React.useState(false);
  const [isNudging, setIsNudging] = useState(false);
  const [nudgedToday, setNudgedToday] = useState(false);
  const scale = useSharedValue(1);

  const entranceStyle = useAnimatedStyle(() => {
    const delay = index * 0.08;
    const p = interpolate(entrance.value, [delay, delay + 0.5], [0, 1], 'clamp');
    return {
      opacity: p,
      transform: [{ translateY: interpolate(p, [0, 1], [16, 0]) }],
    };
  });

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    if (!partner.is_inviter || !partner.partnership_id) return;
    AsyncStorage.getItem(`nudge_last_${partner.partnership_id}`).then((val) => {
      if (val && Date.now() - parseInt(val, 10) < 24 * 60 * 60 * 1000) {
        setNudgedToday(true);
      }
    });
  }, [partner.is_inviter, partner.partnership_id]);

  const handleNudge = async () => {
    if (!partner.partnership_id || nudgedToday || isNudging) return;
    setIsNudging(true);
    const { error } = await nudgePendingRequest(partner.partnership_id);
    setIsNudging(false);
    if (error === 'already_nudged') {
      setNudgedToday(true);
    } else if (!error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setNudgedToday(true);
    }
  };

  const handleRespond = async (accept: boolean) => {
    if (!partner.partnership_id) return;
    setIsResponding(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await respondToBuddy(partner.partnership_id, accept);
    setIsResponding(false);
  };

  // We sent the request
  if (partner.is_inviter) {
    return (
      <Animated.View style={[entranceStyle, { marginBottom: 10 }]}>
        <Animated.View style={[pressStyle, styles.cardShadow]}>
          <View style={styles.pendingCard}>
            <Avatar
              uri={partner.partner_avatar_url}
              name={partner.partner_name}
              size={44}
            />
            <View style={styles.pendingCardInfo}>
              <Text style={styles.pendingCardName}>{partner.partner_name}</Text>
              <View style={styles.pendingBadge}>
                <Clock size={12} color="#FF9500" strokeWidth={2} />
                <Text style={styles.pendingBadgeText}>Waiting for response</Text>
              </View>
            </View>
            {isNudging ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Pressable
                style={[styles.nudgeBtn, nudgedToday && styles.nudgeBtnDisabled]}
                onPress={handleNudge}
                disabled={nudgedToday}
                hitSlop={8}
              >
                <Send size={14} color={nudgedToday ? '#C7C7CC' : '#007AFF'} strokeWidth={2} />
                <Text style={[styles.nudgeBtnText, nudgedToday && styles.nudgeBtnTextDisabled]}>
                  {nudgedToday ? 'Nudged' : 'Nudge'}
                </Text>
              </Pressable>
            )}
          </View>
        </Animated.View>
      </Animated.View>
    );
  }

  // We received the request
  return (
    <Animated.View style={[entranceStyle, { marginBottom: 10 }]}>
      <Animated.View style={[pressStyle, styles.cardShadow]}>
        <View style={styles.pendingCard}>
          <Avatar
            uri={partner.partner_avatar_url}
            name={partner.partner_name}
            size={44}
          />
          <View style={styles.pendingCardInfo}>
            <Text style={styles.pendingCardName}>{partner.partner_name}</Text>
            <Text style={styles.pendingCardSubtext}>Wants to be your buddy</Text>
          </View>
          {isResponding ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <View style={styles.pendingActions}>
              <Pressable
                style={styles.declineBtn}
                onPress={() => handleRespond(false)}
                hitSlop={8}
              >
                <X size={18} color="#8E8E93" strokeWidth={2.5} />
              </Pressable>
              <Pressable
                style={styles.acceptBtn}
                onPress={() => handleRespond(true)}
                hitSlop={8}
              >
                <Check size={18} color="#fff" strokeWidth={2.5} />
              </Pressable>
            </View>
          )}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

// ── Add Buddy Card ──────────────────────────────────────────────────

function AddBuddyCard({
  index,
  entrance,
}: {
  index: number;
  entrance: SharedValue<number>;
}) {
  const router = useRouter();
  const scale = useSharedValue(1);

  const entranceStyle = useAnimatedStyle(() => {
    const delay = index * 0.08;
    const p = interpolate(entrance.value, [delay, delay + 0.5], [0, 1], 'clamp');
    return {
      opacity: p,
      transform: [{ translateY: interpolate(p, [0, 1], [16, 0]) }],
    };
  });

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[entranceStyle, { marginBottom: 10 }]}>
      <Animated.View style={pressStyle}>
        <Pressable
          style={styles.addBuddyCard}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/buddy-settings');
          }}
          onPressIn={() => {
            scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
          }}
          onPressOut={() => {
            scale.value = withSpring(1, { damping: 15, stiffness: 400 });
          }}
        >
          <View style={styles.addBuddyIcon}>
            <UserPlus size={20} color="#007AFF" strokeWidth={2} />
          </View>
          <Text style={styles.addBuddyText}>Add a buddy</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

// ── Empty State ─────────────────────────────────────────────────────

function EmptyState() {
  const router = useRouter();
  const entrance = useSharedValue(0);

  useEffect(() => {
    entrance.value = withSpring(1, { damping: 20, stiffness: 300 });
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [{ scale: interpolate(entrance.value, [0, 1], [0.92, 1]) }],
  }));

  const buttonScale = useSharedValue(1);
  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <Animated.View style={[styles.emptyContainer, containerStyle]}>
      {/* Decorative circles */}
      <View style={styles.emptyVisual}>
        <View style={[styles.emptyCircle, styles.emptyCircle1]} />
        <View style={[styles.emptyCircle, styles.emptyCircle2]} />
        <View style={[styles.emptyCircle, styles.emptyCircle3]} />
        <View style={styles.emptyHeartWrap}>
          <Heart size={32} color="#FF2D55" strokeWidth={2} fill="#FF2D55" />
        </View>
      </View>

      <Text style={styles.emptyTitle}>No buddies yet</Text>
      <Text style={styles.emptySubtitle}>
        Connect with friends, family, or anyone{'\n'}
        to share daily progress and stay motivated
      </Text>

      <Animated.View style={buttonStyle}>
        <Pressable
          style={styles.addButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/buddy-settings');
          }}
          onPressIn={() => {
            buttonScale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
          }}
          onPressOut={() => {
            buttonScale.value = withSpring(1, { damping: 15, stiffness: 400 });
          }}
        >
          <UserPlus size={20} color="#fff" strokeWidth={2} />
          <Text style={styles.addButtonText}>Add a Buddy</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

// ── Main Screen ─────────────────────────────────────────────────────

export default function BuddyListScreen() {
  const router = useRouter();
  const { activeBuddies, pendingBuddies, isLoading } = useBuddy();
  const { markAllRead } = useBuddyInteractions();
  const entrance = useSharedValue(0);

  // If exactly one active partner and no pending, navigate directly to detail
  const hasAutoRedirected = useRef(false);
  useEffect(() => {
    if (!isLoading && activeBuddies.length === 1 && pendingBuddies.length === 0 && !hasAutoRedirected.current) {
      hasAutoRedirected.current = true;
      router.replace(`/buddy-detail?partnerId=${activeBuddies[0].partner_id}`);
    }
  }, [isLoading, activeBuddies, pendingBuddies, router]);

  useEffect(() => {
    markAllRead();
  }, [markAllRead]);

  // Trigger entrance animation when data loads
  useEffect(() => {
    if (!isLoading) {
      entrance.value = 0;
      entrance.value = withSpring(1, { damping: 28, stiffness: 420, mass: 0.9 });
    }
  }, [isLoading]);

  const hasAny = activeBuddies.length > 0 || pendingBuddies.length > 0;

  // Running index for stagger across all cards
  let staggerIndex = 0;

  return (
    <View style={styles.container}>
      <AmbientBackground />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.topRow}>
          <View>
            <Text style={styles.headerTitle}>Buddies</Text>
            {hasAny && !isLoading && (
              <Text style={styles.headerSubtitle}>
                {activeBuddies.length} active{pendingBuddies.length > 0 ? ` · ${pendingBuddies.length} pending` : ''}
              </Text>
            )}
          </View>
          <Pressable
            style={styles.settingsButton}
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
        ) : !hasAny ? (
          <EmptyState />
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Pending Requests */}
            {pendingBuddies.length > 0 && (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionLabel}>PENDING</Text>
                {pendingBuddies.map((p) => {
                  const idx = staggerIndex++;
                  return (
                    <PendingRequestCard
                      key={p.partnership_id}
                      partner={p}
                      index={idx}
                      entrance={entrance}
                    />
                  );
                })}
              </View>
            )}

            {/* Active Partners */}
            {activeBuddies.length > 0 && (
              <View style={styles.sectionBlock}>
                {pendingBuddies.length > 0 && (
                  <Text style={styles.sectionLabel}>ACTIVE</Text>
                )}
                {activeBuddies.map((p) => {
                  const idx = staggerIndex++;
                  return (
                    <BuddyCard
                      key={p.partnership_id}
                      partner={p}
                      index={idx}
                      entrance={entrance}
                    />
                  );
                })}
              </View>
            )}

            {/* Add Another — dashed card */}
            <AddBuddyCard index={staggerIndex} entrance={entrance} />

            <View style={{ height: 100 }} />
          </ScrollView>
        )}
      </SafeAreaView>
      <BottomNavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: Fonts.heading,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
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
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 4 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // ── Section block ──
  sectionBlock: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 4,
  },

  // ── Card shadow wrapper ──
  cardShadow: {
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },

  // ── Partner card ──
  partnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    padding: 16,
  },
  partnerCardInfo: {
    flex: 1,
    marginLeft: 14,
  },
  partnerCardName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.2,
  },
  partnerCardSince: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  chevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Pending card ──
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    padding: 16,
  },
  pendingCardInfo: {
    flex: 1,
    marginLeft: 14,
  },
  pendingCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.2,
  },
  pendingCardSubtext: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  pendingBadgeText: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '600',
  },
  pendingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  declineBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Nudge button ──
  nudgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: 'rgba(0,122,255,0.08)',
  },
  nudgeBtnDisabled: {
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  nudgeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
  },
  nudgeBtnTextDisabled: {
    color: '#C7C7CC',
  },

  // ── Add buddy card (dashed) ──
  addBuddyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(0,122,255,0.2)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(0,122,255,0.03)',
  },
  addBuddyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,122,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBuddyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
  },

  // ── Empty ──
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyVisual: {
    width: 120,
    height: 100,
    marginBottom: 28,
    position: 'relative',
  },
  emptyCircle: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  emptyCircle1: {
    backgroundColor: 'rgba(0,122,255,0.12)',
    left: 0,
    top: 16,
  },
  emptyCircle2: {
    backgroundColor: 'rgba(255,45,85,0.12)',
    left: 30,
    top: 0,
  },
  emptyCircle3: {
    backgroundColor: 'rgba(255,149,0,0.12)',
    left: 58,
    top: 22,
  },
  emptyHeartWrap: {
    position: 'absolute',
    left: 42,
    top: 30,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
