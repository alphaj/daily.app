import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  Share,
  ActivityIndicator,
  Switch,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  type SharedValue,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useGoBack } from '@/lib/useGoBack';
import {
  ArrowLeft,
  Copy,
  Share2,
  RefreshCw,
  UserCheck,
  Clock,
  Unlink,
  Send,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from '@/lib/haptics';
import * as Clipboard from 'expo-clipboard';

import { useAuth, PrivacyMode } from '@/contexts/AuthContext';
import { useBuddy, SharingPreferences, BuddyStatus } from '@/contexts/BuddyContext';
import { AmbientBackground } from '@/components/AmbientBackground';
import { Avatar } from '@/components/Avatar';
import { Fonts } from '@/lib/typography';

const SPRING_CONFIG = { damping: 28, stiffness: 420, mass: 0.9 };

// ── Animated section wrapper ────────────────────────────────────────

function AnimatedSection({
  index,
  entrance,
  children,
  style,
}: {
  index: number;
  entrance: SharedValue<number>;
  children: React.ReactNode;
  style?: any;
}) {
  const animStyle = useAnimatedStyle(() => {
    const delay = index * 0.08;
    const p = interpolate(entrance.value, [delay, delay + 0.5], [0, 1], 'clamp');
    return {
      opacity: p,
      transform: [{ translateY: interpolate(p, [0, 1], [16, 0]) }],
    };
  });

  return <Animated.View style={[animStyle, style]}>{children}</Animated.View>;
}

// ── Connect form ────────────────────────────────────────────────────

function ConnectSection({
  autoFocusInput,
  entrance,
}: {
  autoFocusInput?: boolean;
  entrance: SharedValue<number>;
}) {
  const { profile, regenerateBuddyCode } = useAuth();
  const { requestBuddy } = useBuddy();
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [connectCode, setConnectCode] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState('');

  const partnerCode = profile?.partner_code ?? '------';

  const handleCopyCode = async () => {
    if (!profile?.partner_code) return;
    await Clipboard.setStringAsync(profile.partner_code);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareCode = async () => {
    if (!profile?.partner_code) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Share.share({
      message: `Be my buddy on Daily! My code is: ${profile.partner_code}`,
    });
  };

  const handleConnect = async () => {
    const code = connectCode.trim().toUpperCase();
    if (code.length !== 6) {
      setConnectError('Code must be 6 characters');
      return;
    }

    setIsConnecting(true);
    setConnectError('');

    const { error } = await requestBuddy(code);

    setIsConnecting(false);

    if (error) {
      setConnectError(error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setConnectCode('');
    }
  };

  const handleRegenerateCode = () => {
    Alert.alert(
      'Regenerate Code',
      'This will invalidate your current code. Anyone who has your old code won\'t be able to use it.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Regenerate',
          style: 'destructive',
          onPress: async () => {
            setIsRegenerating(true);
            const { error } = await regenerateBuddyCode();
            setIsRegenerating(false);
            if (error) {
              Alert.alert('Error', error);
            } else {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          },
        },
      ]
    );
  };

  const copyScale = useSharedValue(1);
  const shareScale = useSharedValue(1);
  const connectScale = useSharedValue(1);

  const copyStyle = useAnimatedStyle(() => ({
    transform: [{ scale: copyScale.value }],
  }));
  const shareStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shareScale.value }],
  }));
  const connectBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: connectScale.value }],
  }));

  return (
    <>
      {/* Buddy Code Card */}
      <AnimatedSection index={0} entrance={entrance}>
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>YOUR BUDDY CODE</Text>
          <Text style={styles.codeText}>{partnerCode}</Text>
          <Text style={styles.codeHint}>
            Share this code with someone to connect
          </Text>

          <View style={styles.codeActions}>
            <Animated.View style={copyStyle}>
              <Pressable
                style={styles.codeAction}
                onPress={handleCopyCode}
                onPressIn={() => {
                  copyScale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
                }}
                onPressOut={() => {
                  copyScale.value = withSpring(1, { damping: 15, stiffness: 400 });
                }}
              >
                <Copy size={17} color="#007AFF" strokeWidth={2} />
                <Text style={styles.codeActionText}>
                  {copied ? 'Copied!' : 'Copy'}
                </Text>
              </Pressable>
            </Animated.View>

            <View style={styles.codeActionDivider} />

            <Animated.View style={shareStyle}>
              <Pressable
                style={styles.codeAction}
                onPress={handleShareCode}
                onPressIn={() => {
                  shareScale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
                }}
                onPressOut={() => {
                  shareScale.value = withSpring(1, { damping: 15, stiffness: 400 });
                }}
              >
                <Share2 size={17} color="#007AFF" strokeWidth={2} />
                <Text style={styles.codeActionText}>Share</Text>
              </Pressable>
            </Animated.View>
          </View>
        </View>
      </AnimatedSection>

      {/* Add a Buddy */}
      <AnimatedSection index={1} entrance={entrance}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Add a Buddy</Text>
          <Text style={styles.cardSubtitle}>
            Enter their 6-character code to send a request
          </Text>

          <TextInput
            style={styles.codeInput}
            placeholder="ABC123"
            placeholderTextColor="#C7C7CC"
            value={connectCode}
            onChangeText={(t) => {
              setConnectCode(t.toUpperCase());
              setConnectError('');
            }}
            maxLength={6}
            autoCapitalize="characters"
            autoCorrect={false}
            autoFocus={autoFocusInput}
          />

          {connectError ? <Text style={styles.errorText}>{connectError}</Text> : null}

          <Animated.View style={connectBtnStyle}>
            <Pressable
              style={[
                styles.connectButton,
                connectCode.trim().length !== 6 && styles.buttonDisabled,
              ]}
              onPress={handleConnect}
              disabled={connectCode.trim().length !== 6 || isConnecting}
              onPressIn={() => {
                connectScale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
              }}
              onPressOut={() => {
                connectScale.value = withSpring(1, { damping: 15, stiffness: 400 });
              }}
            >
              {isConnecting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.connectButtonText}>Send Request</Text>
              )}
            </Pressable>
          </Animated.View>
        </View>
      </AnimatedSection>

      {/* Regenerate Code */}
      <AnimatedSection index={2} entrance={entrance} style={styles.centered}>
        <Pressable
          style={styles.regenerateButton}
          onPress={handleRegenerateCode}
          disabled={isRegenerating}
        >
          {isRegenerating ? (
            <ActivityIndicator size="small" color="#8E8E93" />
          ) : (
            <RefreshCw size={16} color="#8E8E93" strokeWidth={2} />
          )}
          <Text style={styles.regenerateText}>Regenerate Code</Text>
        </Pressable>
      </AnimatedSection>
    </>
  );
}

// ── Pending partnership card ─────────────────────────────────────────

function PendingBuddyCard({
  partnership,
  index,
  entrance,
}: {
  partnership: BuddyStatus;
  index: number;
  entrance: SharedValue<number>;
}) {
  const { respondToBuddy, nudgePendingRequest } = useBuddy();
  const [isResponding, setIsResponding] = useState(false);
  const [isNudging, setIsNudging] = useState(false);
  const [nudgedToday, setNudgedToday] = useState(false);

  useEffect(() => {
    if (!partnership.is_inviter || !partnership.partnership_id) return;
    AsyncStorage.getItem(`nudge_last_${partnership.partnership_id}`).then((val) => {
      if (val && Date.now() - parseInt(val, 10) < 24 * 60 * 60 * 1000) {
        setNudgedToday(true);
      }
    });
  }, [partnership.is_inviter, partnership.partnership_id]);

  const handleNudge = async () => {
    if (!partnership.partnership_id || nudgedToday || isNudging) return;
    setIsNudging(true);
    const { error } = await nudgePendingRequest(partnership.partnership_id);
    setIsNudging(false);
    if (error === 'already_nudged') {
      setNudgedToday(true);
    } else if (!error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setNudgedToday(true);
    }
  };

  const handleRespond = async (accept: boolean) => {
    if (!partnership.partnership_id) return;
    setIsResponding(true);
    const { error } = await respondToBuddy(partnership.partnership_id, accept);
    setIsResponding(false);
    if (error) {
      Alert.alert('Error', error);
    } else {
      Haptics.notificationAsync(
        accept
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning
      );
    }
  };

  if (partnership.is_inviter) {
    return (
      <AnimatedSection index={index} entrance={entrance} style={{ marginBottom: 10 }}>
        <View style={styles.statusCard}>
          <View style={styles.statusIconWrap}>
            <Clock size={20} color="#FF9500" strokeWidth={2} />
          </View>
          <View style={styles.statusCardInfo}>
            <Text style={styles.statusCardName}>{partnership.partner_name}</Text>
            <Text style={styles.statusCardSubtext}>Waiting for response</Text>
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
      </AnimatedSection>
    );
  }

  return (
    <AnimatedSection index={index} entrance={entrance} style={{ marginBottom: 10 }}>
      <View style={styles.statusCard}>
        <View style={[styles.statusIconWrap, { backgroundColor: 'rgba(0,122,255,0.1)' }]}>
          <UserCheck size={20} color="#007AFF" strokeWidth={2} />
        </View>
        <View style={styles.statusCardInfo}>
          <Text style={styles.statusCardName}>{partnership.partner_name}</Text>
          <Text style={styles.statusCardSubtext}>Wants to be your buddy</Text>
        </View>
        {isResponding ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : (
          <View style={styles.responseActions}>
            <Pressable
              style={styles.declineButton}
              onPress={() => handleRespond(false)}
            >
              <Text style={styles.declineButtonText}>Decline</Text>
            </Pressable>
            <Pressable
              style={styles.acceptButton}
              onPress={() => handleRespond(true)}
            >
              <Text style={styles.acceptButtonText}>Accept</Text>
            </Pressable>
          </View>
        )}
      </View>
    </AnimatedSection>
  );
}

// ── Active partnership card ─────────────────────────────────────────

const SHARING_OPTIONS: { key: keyof SharingPreferences; label: string; description: string }[] = [
  { key: 'share_todos', label: 'Tasks', description: 'Your daily tasks and completion status' },
  { key: 'share_focus', label: 'Focus Sessions', description: 'When you\'re focusing and for how long' },
  { key: 'share_inbox', label: 'Brain Dump', description: 'Your captured thoughts and ideas' },
  { key: 'share_notes', label: 'Notes', description: 'Your daily notes' },
  { key: 'share_work_items', label: 'Work Tasks', description: 'Tasks marked as work-related' },
];

function ActiveBuddyCard({
  partnership,
  index,
  entrance,
}: {
  partnership: BuddyStatus;
  index: number;
  entrance: SharedValue<number>;
}) {
  const { sharingPrefsMap, dissolveBuddy, updateSharingPrefs } = useBuddy();
  const partnershipId = partnership.partnership_id!;
  const sharingPrefs = sharingPrefsMap[partnershipId] ?? null;
  const [showPrefs, setShowPrefs] = useState(false);

  const handleDissolve = () => {
    Alert.alert(
      'Remove Buddy',
      `This will disconnect you from ${partnership.partner_name}. They will no longer be able to see your shared data.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove Buddy',
          style: 'destructive',
          onPress: async () => {
            const { error } = await dissolveBuddy(partnershipId);
            if (error) {
              Alert.alert('Error', error);
            } else {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
          },
        },
      ]
    );
  };

  const togglePref = (key: keyof SharingPreferences) => {
    if (!sharingPrefs) return;
    updateSharingPrefs(partnershipId, { [key]: !sharingPrefs[key] });
    Haptics.selectionAsync();
  };

  const sinceLabel = partnership.created_at
    ? new Date(partnership.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'today';

  return (
    <AnimatedSection index={index} entrance={entrance} style={{ marginBottom: 12 }}>
      <View style={styles.activeCard}>
        <View style={styles.activeCardHeader}>
          <Avatar
            uri={partnership.partner_avatar_url}
            name={partnership.partner_name}
            size={48}
          />
          <View style={styles.activeCardInfo}>
            <Text style={styles.activeCardName}>{partnership.partner_name}</Text>
            <Text style={styles.activeCardSince}>Since {sinceLabel}</Text>
          </View>
        </View>

        {/* Sharing Preferences Toggle */}
        <Pressable
          style={styles.showPrefsButton}
          onPress={() => {
            Haptics.selectionAsync();
            setShowPrefs(!showPrefs);
          }}
        >
          <Text style={styles.showPrefsText}>
            {showPrefs ? 'Hide sharing settings' : 'Sharing settings'}
          </Text>
          {showPrefs ? (
            <ChevronUp size={16} color="#007AFF" />
          ) : (
            <ChevronDown size={16} color="#007AFF" />
          )}
        </Pressable>

        {showPrefs && sharingPrefs && (
          <View style={styles.prefsList}>
            {SHARING_OPTIONS.map((opt, i) => (
              <View
                key={opt.key}
                style={[
                  styles.prefRow,
                  i < SHARING_OPTIONS.length - 1 && styles.prefRowBorder,
                ]}
              >
                <View style={styles.prefInfo}>
                  <Text style={styles.prefLabel}>{opt.label}</Text>
                  <Text style={styles.prefDescription}>{opt.description}</Text>
                </View>
                <Switch
                  value={sharingPrefs[opt.key]}
                  onValueChange={() => togglePref(opt.key)}
                  trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                  thumbColor="#fff"
                />
              </View>
            ))}
          </View>
        )}

        {/* Dissolve */}
        <Pressable
          style={styles.dissolveRow}
          onPress={handleDissolve}
        >
          <Unlink size={15} color="#FF3B30" strokeWidth={2} />
          <Text style={styles.dissolveRowText}>Remove buddy</Text>
        </Pressable>
      </View>
    </AnimatedSection>
  );
}

// ── Privacy mode ────────────────────────────────────────────────────

const PRIVACY_MODES: { value: PrivacyMode; label: string; description: string; Icon: any }[] = [
  { value: 'visible', label: 'Visible', description: 'Based on sharing settings', Icon: Eye },
  { value: 'private', label: 'Private', description: 'Hidden from all buddies', Icon: EyeOff },
];

function PrivacyModeSection({
  index,
  entrance,
}: {
  index: number;
  entrance: SharedValue<number>;
}) {
  const { privacyMode, setPrivacyMode } = useAuth();

  return (
    <AnimatedSection index={index} entrance={entrance}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Privacy Mode</Text>
        <Text style={styles.cardSubtitle}>
          Control your visibility to all buddies
        </Text>
        <View style={styles.privacyModeContainer}>
          {PRIVACY_MODES.map((mode) => {
            const isActive = privacyMode === mode.value;
            return (
              <Pressable
                key={mode.value}
                style={[styles.privacyModeOption, isActive && styles.privacyModeOptionActive]}
                onPress={async () => {
                  Haptics.selectionAsync();
                  await setPrivacyMode(mode.value);
                }}
              >
                <View style={[styles.privacyIconWrap, isActive && styles.privacyIconWrapActive]}>
                  <mode.Icon size={18} color={isActive ? '#007AFF' : '#8E8E93'} strokeWidth={2} />
                </View>
                <Text style={[styles.privacyModeLabel, isActive && styles.privacyModeLabelActive]}>
                  {mode.label}
                </Text>
                <Text style={[styles.privacyModeDesc, isActive && styles.privacyModeDescActive]}>
                  {mode.description}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </AnimatedSection>
  );
}

// ── Main Screen ────────────────────────────────────────────────────

export default function BuddySettingsScreen() {
  const goBack = useGoBack();
  const { activeBuddies, pendingBuddies, hasActiveBuddy, isLoading } = useBuddy();
  const entrance = useSharedValue(0);

  useEffect(() => {
    if (!isLoading) {
      entrance.value = 0;
      entrance.value = withSpring(1, SPRING_CONFIG);
    }
  }, [isLoading]);

  // Running stagger index — connect sections use 0, 1, 2
  let staggerIdx = 3;

  return (
    <View style={styles.container}>
      <AmbientBackground />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButtonCircle}
            onPress={goBack}
            hitSlop={20}
          >
            <ArrowLeft size={20} color="#000" strokeWidth={2.5} />
          </Pressable>
          <Text style={styles.headerTitle}>Buddy Mode</Text>
          <View style={{ width: 36 }} />
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
            keyboardShouldPersistTaps="handled"
          >
            {/* Connect form — always visible */}
            <ConnectSection
              autoFocusInput={!hasActiveBuddy}
              entrance={entrance}
            />

            {/* Privacy mode — only if has active partnership */}
            {hasActiveBuddy && (
              <PrivacyModeSection index={staggerIdx++} entrance={entrance} />
            )}

            {/* Pending partnerships */}
            {pendingBuddies.length > 0 && (
              <View style={styles.sectionBlock}>
                <AnimatedSection index={staggerIdx} entrance={entrance}>
                  <Text style={styles.sectionLabel}>PENDING</Text>
                </AnimatedSection>
                {pendingBuddies.map((p) => (
                  <PendingBuddyCard
                    key={p.partnership_id}
                    partnership={p}
                    index={staggerIdx++}
                    entrance={entrance}
                  />
                ))}
              </View>
            )}

            {/* Active partnerships */}
            {activeBuddies.length > 0 && (
              <View style={styles.sectionBlock}>
                <AnimatedSection index={staggerIdx} entrance={entrance}>
                  <Text style={styles.sectionLabel}>ACTIVE BUDDIES</Text>
                </AnimatedSection>
                {activeBuddies.map((p) => (
                  <ActiveBuddyCard
                    key={p.partnership_id}
                    partnership={p}
                    index={staggerIdx++}
                    entrance={entrance}
                  />
                ))}
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  backButtonCircle: {
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
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: -1,
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingTop: 20, paddingBottom: 40, gap: 22 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // ── Section blocks ──
  sectionBlock: {
    marginHorizontal: 16,
    gap: 4,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: 1.5,
    marginBottom: 8,
  },

  // ── Code card ──
  codeCard: {
    marginHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    padding: 28,
    alignItems: 'center',
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
  codeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E8E93',
    letterSpacing: 2,
    marginBottom: 14,
  },
  codeText: {
    fontSize: 38,
    fontFamily: Fonts.heading,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 8,
    marginBottom: 10,
  },
  codeHint: {
    fontSize: 13,
    color: '#AEAEB2',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  codeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,122,255,0.06)',
    borderRadius: 14,
    overflow: 'hidden',
  },
  codeAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  codeActionText: { fontSize: 14, fontWeight: '600', color: '#007AFF' },
  codeActionDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(0,122,255,0.15)',
  },

  // ── Generic card ──
  card: {
    marginHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    padding: 24,
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
  cardTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 20,
  },

  // ── Code input ──
  codeInput: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    padding: 16,
    textAlign: 'center',
    letterSpacing: 6,
    marginBottom: 16,
  },

  // ── Buttons ──
  connectButton: {
    backgroundColor: '#000',
    borderRadius: 24,
    paddingVertical: 15,
    alignItems: 'center',
  },
  connectButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  buttonDisabled: { backgroundColor: '#E5E5EA' },

  // ── Status card (pending) ──
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    padding: 16,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  statusIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,149,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCardInfo: {
    flex: 1,
  },
  statusCardName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.2,
  },
  statusCardSubtext: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },

  responseActions: {
    flexDirection: 'row',
    gap: 8,
  },
  declineButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  declineButtonText: { fontSize: 13, fontWeight: '600', color: '#8E8E93' },
  acceptButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#007AFF',
  },
  acceptButtonText: { fontSize: 13, fontWeight: '600', color: '#fff' },

  // ── Active partnership card ──
  activeCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    padding: 20,
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
  activeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeCardInfo: {
    flex: 1,
    marginLeft: 14,
  },
  activeCardName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.2,
  },
  activeCardSince: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  showPrefsButton: {
    marginTop: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,122,255,0.05)',
    borderRadius: 12,
  },
  showPrefsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },

  // ── Sharing prefs ──
  prefsList: { marginTop: 12 },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  prefRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(60,60,67,0.08)',
  },
  prefInfo: { flex: 1, marginRight: 12 },
  prefLabel: { fontSize: 15, fontWeight: '500', color: '#1C1C1E' },
  prefDescription: { fontSize: 12, color: '#8E8E93', marginTop: 2 },

  // ── Dissolve ──
  dissolveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,59,48,0.05)',
  },
  dissolveRowText: { fontSize: 14, color: '#FF3B30', fontWeight: '500' },

  // ── Privacy mode ──
  privacyModeContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  privacyModeOption: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  privacyModeOptionActive: {
    backgroundColor: 'rgba(0,122,255,0.06)',
    borderColor: '#007AFF',
  },
  privacyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  privacyIconWrapActive: {
    backgroundColor: 'rgba(0,122,255,0.1)',
  },
  privacyModeLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
  },
  privacyModeLabelActive: {
    color: '#007AFF',
  },
  privacyModeDesc: {
    fontSize: 11,
    color: '#AEAEB2',
    textAlign: 'center',
    lineHeight: 14,
  },
  privacyModeDescActive: {
    color: '#5E9EFF',
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

  // ── Misc ──
  centered: { alignItems: 'center', marginHorizontal: 16 },
  errorText: { color: '#FF3B30', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  regenerateText: { fontSize: 14, color: '#8E8E93', fontWeight: '500' },
});
