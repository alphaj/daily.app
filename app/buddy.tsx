import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, UserPlus, Check, X, Clock } from 'lucide-react-native';
import * as Haptics from '@/lib/haptics';

import { useBuddy, BuddyStatus } from '@/contexts/BuddyContext';
import { useBuddyInteractions } from '@/hooks/useBuddyInteractions';
import { AmbientBackground } from '@/components/AmbientBackground';
import { Avatar } from '@/components/Avatar';
import { BottomNavBar } from '@/components/BottomNavBar';
import { Fonts } from '@/lib/typography';
import { Logo } from '@/components/Logo';

// ── Partner Card ────────────────────────────────────────────────────

function BuddyCard({ partner }: { partner: BuddyStatus }) {
  const router = useRouter();

  return (
    <Pressable
      style={({ pressed }) => [styles.partnerCard, pressed && styles.partnerCardPressed]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/buddy-detail?partnerId=${partner.partner_id}`);
      }}
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
          Buddies since {partner.created_at
            ? new Date(partner.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : 'today'}
        </Text>
      </View>
    </Pressable>
  );
}

// ── Pending Request Card ────────────────────────────────────────────

function PendingRequestCard({ partner }: { partner: BuddyStatus }) {
  const { respondToBuddy } = useBuddy();
  const [isResponding, setIsResponding] = React.useState(false);

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
      </View>
    );
  }

  // We received the request
  return (
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
  );
}

// ── Empty State ─────────────────────────────────────────────────────

function EmptyState() {
  const router = useRouter();

  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>👥</Text>
      <Text style={styles.emptyTitle}>No buddies yet</Text>
      <Text style={styles.emptySubtitle}>
        Connect with friends, family, or anyone{'\n'}
        to share daily progress and stay motivated
      </Text>
      <Pressable
        style={({ pressed }) => [styles.addButton, pressed && { opacity: 0.8 }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/buddy-settings');
        }}
      >
        <UserPlus size={20} color="#fff" strokeWidth={2} />
        <Text style={styles.addButtonText}>Add a Buddy</Text>
      </Pressable>
    </View>
  );
}

// ── Main Screen ─────────────────────────────────────────────────────

export default function BuddyListScreen() {
  const router = useRouter();
  const { activeBuddies, pendingBuddies, isLoading } = useBuddy();
  const { markAllRead } = useBuddyInteractions();

  // If exactly one active partner and no pending, navigate directly to detail
  // Use a ref to prevent re-redirect if the user navigates back
  const hasAutoRedirected = useRef(false);
  useEffect(() => {
    if (!isLoading && activeBuddies.length === 1 && pendingBuddies.length === 0 && !hasAutoRedirected.current) {
      hasAutoRedirected.current = true;
      router.replace(`/buddy-detail?partnerId=${activeBuddies[0].partner_id}`);
    }
  }, [isLoading, activeBuddies, pendingBuddies, router]);

  // Mark all interactions read when viewing partner screen
  // Wait until interactions have loaded (markAllRead depends on interactions data)
  useEffect(() => {
    markAllRead();
  }, [markAllRead]);

  const hasAny = activeBuddies.length > 0 || pendingBuddies.length > 0;

  return (
    <View style={styles.container}>
      <AmbientBackground />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header — matches Home layout */}
        <View style={styles.topRow}>
          <Logo />
          <Pressable
            style={styles.settingsButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/buddy-settings');
            }}
            hitSlop={20}
          >
            <Settings size={22} color="#000" strokeWidth={1.8} />
          </Pressable>
        </View>
        <Text style={styles.headerTitle}>Buddies</Text>
        <View style={{ height: 16 }} />

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
                {pendingBuddies.map((p) => (
                  <PendingRequestCard key={p.partnership_id} partner={p} />
                ))}
              </View>
            )}

            {/* Active Partners */}
            {activeBuddies.length > 0 && (
              <View style={styles.sectionBlock}>
                {pendingBuddies.length > 0 && (
                  <Text style={styles.sectionLabel}>ACTIVE</Text>
                )}
                {activeBuddies.map((p) => (
                  <BuddyCard key={p.partnership_id} partner={p} />
                ))}
              </View>
            )}

            {/* Add Another */}
            <Pressable
              style={({ pressed }) => [styles.addAnotherButton, pressed && { opacity: 0.7 }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/buddy-settings');
              }}
            >
              <UserPlus size={18} color="#007AFF" strokeWidth={2} />
              <Text style={styles.addAnotherText}>Add another buddy</Text>
            </Pressable>

            <View style={{ height: 100 }} />
          </ScrollView>
        )}
      </SafeAreaView>
      <BottomNavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
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
    fontSize: 34,
    fontFamily: Fonts.heading,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // ── Section block ──
  sectionBlock: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 4,
  },

  // ── Partner card ──
  partnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  partnerCardPressed: {
    opacity: 0.7,
  },
  partnerCardInfo: {
    flex: 1,
    marginLeft: 14,
  },
  partnerCardName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  partnerCardSince: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },

  // ── Pending card ──
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  pendingCardInfo: {
    flex: 1,
    marginLeft: 14,
  },
  pendingCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  pendingCardSubtext: {
    fontSize: 14,
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
    fontSize: 13,
    color: '#FF9500',
    fontWeight: '500',
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
    backgroundColor: '#F2F2F7',
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

  // ── Add another ──
  addAnotherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginTop: 4,
  },
  addAnotherText: {
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
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
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
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
  },
  addButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
});
