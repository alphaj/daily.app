import React, { useState } from 'react';
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
} from 'react-native';
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
} from 'lucide-react-native';
import * as Haptics from '@/lib/haptics';
import * as Clipboard from 'expo-clipboard';

import { useAuth, PrivacyMode } from '@/contexts/AuthContext';
import { usePartnership, SharingPreferences, PartnershipStatus } from '@/contexts/PartnershipContext';
import { AmbientBackground } from '@/components/AmbientBackground';
import { Avatar } from '@/components/Avatar';
import { Fonts } from '@/lib/typography';

// ── Connect form (always visible at the top) ────────────────────────
function ConnectSection() {
  const { profile, regeneratePartnerCode } = useAuth();
  const { requestPartnership } = usePartnership();
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
      message: `Partner up with me on Daily! My code is: ${profile.partner_code}`,
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

    const { error } = await requestPartnership(code);

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
            const { error } = await regeneratePartnerCode();
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

  return (
    <>
      {/* Partner Code Card */}
      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>YOUR PARTNER CODE</Text>
        <Text style={styles.codeText}>{partnerCode}</Text>
        <Text style={styles.codeHint}>
          Share this code with someone to connect as partners
        </Text>

        <View style={styles.codeActions}>
          <Pressable
            style={({ pressed }) => [styles.codeAction, pressed && styles.pressedBg]}
            onPress={handleCopyCode}
          >
            <Copy size={18} color="#007AFF" strokeWidth={2} />
            <Text style={styles.codeActionText}>
              {copied ? 'Copied!' : 'Copy'}
            </Text>
          </Pressable>

          <View style={styles.codeActionDivider} />

          <Pressable
            style={({ pressed }) => [styles.codeAction, pressed && styles.pressedBg]}
            onPress={handleShareCode}
          >
            <Share2 size={18} color="#007AFF" strokeWidth={2} />
            <Text style={styles.codeActionText}>Share</Text>
          </Pressable>
        </View>
      </View>

      {/* Connect with Partner */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Add a Partner</Text>
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
        />

        {connectError ? <Text style={styles.errorText}>{connectError}</Text> : null}

        <Pressable
          style={({ pressed }) => [
            styles.connectButton,
            connectCode.trim().length !== 6 && styles.buttonDisabled,
            pressed && { opacity: 0.8 },
          ]}
          onPress={handleConnect}
          disabled={connectCode.trim().length !== 6 || isConnecting}
        >
          {isConnecting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.connectButtonText}>Send Request</Text>
          )}
        </Pressable>
      </View>

      {/* Regenerate Code */}
      <View style={styles.centered}>
        <Pressable
          style={({ pressed }) => [styles.regenerateButton, pressed && styles.pressedBg]}
          onPress={handleRegenerateCode}
          disabled={isRegenerating}
        >
          {isRegenerating ? (
            <ActivityIndicator size="small" color="#8E8E93" />
          ) : (
            <RefreshCw size={18} color="#8E8E93" strokeWidth={2} />
          )}
          <Text style={styles.regenerateText}>Regenerate Code</Text>
        </Pressable>
      </View>
    </>
  );
}

// ── Pending partnership card ─────────────────────────────────────────

function PendingPartnershipCard({ partnership }: { partnership: PartnershipStatus }) {
  const { respondToPartnership } = usePartnership();
  const [isResponding, setIsResponding] = useState(false);

  const handleRespond = async (accept: boolean) => {
    if (!partnership.partnership_id) return;
    setIsResponding(true);
    const { error } = await respondToPartnership(partnership.partnership_id, accept);
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
      <View style={styles.statusCard}>
        <Clock size={28} color="#FF9500" strokeWidth={1.5} />
        <View style={styles.statusCardInfo}>
          <Text style={styles.statusCardName}>{partnership.partner_name}</Text>
          <Text style={styles.statusCardSubtext}>Waiting for response</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.statusCard}>
      <UserCheck size={28} color="#007AFF" strokeWidth={1.5} />
      <View style={styles.statusCardInfo}>
        <Text style={styles.statusCardName}>{partnership.partner_name}</Text>
        <Text style={styles.statusCardSubtext}>Wants to partner with you</Text>
      </View>
      {isResponding ? (
        <ActivityIndicator size="small" color="#007AFF" />
      ) : (
        <View style={styles.responseActions}>
          <Pressable
            style={({ pressed }) => [styles.declineButton, pressed && { opacity: 0.8 }]}
            onPress={() => handleRespond(false)}
          >
            <Text style={styles.declineButtonText}>Decline</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.acceptButton, pressed && { opacity: 0.8 }]}
            onPress={() => handleRespond(true)}
          >
            <Text style={styles.acceptButtonText}>Accept</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ── Active partnership card ─────────────────────────────────────────

const SHARING_OPTIONS: { key: keyof SharingPreferences; label: string; description: string }[] = [
  { key: 'share_todos', label: 'Tasks', description: 'Your daily tasks and completion status' },
  { key: 'share_events', label: 'Calendar Events', description: 'Your scheduled events' },
  { key: 'share_focus', label: 'Focus Sessions', description: 'When you\'re focusing and for how long' },
  { key: 'share_inbox', label: 'Brain Dump', description: 'Your captured thoughts and ideas' },
  { key: 'share_notes', label: 'Notes', description: 'Your daily notes' },
  { key: 'share_work_items', label: 'Work Tasks', description: 'Tasks marked as work-related' },
  { key: 'share_later', label: 'Later / Someday', description: 'Your someday/maybe items' },
];

function ActivePartnershipCard({ partnership }: { partnership: PartnershipStatus }) {
  const { sharingPrefsMap, dissolvePartnership, updateSharingPrefs } = usePartnership();
  const partnershipId = partnership.partnership_id!;
  const sharingPrefs = sharingPrefsMap[partnershipId] ?? null;
  const [showPrefs, setShowPrefs] = useState(false);

  const handleDissolve = () => {
    Alert.alert(
      'End Partnership',
      `This will disconnect you from ${partnership.partner_name}. They will no longer be able to see your shared data.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Partnership',
          style: 'destructive',
          onPress: async () => {
            const { error } = await dissolvePartnership(partnershipId);
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

  return (
    <View style={styles.activeCard}>
      <View style={styles.activeCardHeader}>
        <Avatar
          uri={partnership.partner_avatar_url}
          name={partnership.partner_name}
          size={48}
        />
        <View style={styles.activeCardInfo}>
          <Text style={styles.activeCardName}>{partnership.partner_name}</Text>
          <Text style={styles.activeCardSince}>
            Since {partnership.created_at
              ? new Date(partnership.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'today'}
          </Text>
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
        <Unlink size={16} color="#FF3B30" strokeWidth={2} />
        <Text style={styles.dissolveRowText}>End partnership</Text>
      </Pressable>
    </View>
  );
}

// ── Privacy mode (global, not per-partner) ──────────────────────────

const PRIVACY_MODES: { value: PrivacyMode; label: string; description: string }[] = [
  { value: 'open', label: 'Open', description: 'Partners see everything you share' },
  { value: 'focus', label: 'Focus', description: 'Partners see you\'re busy, not details' },
  { value: 'private', label: 'Private', description: 'All shared data hidden temporarily' },
];

function PrivacyModeSection() {
  const { privacyMode, setPrivacyMode } = useAuth();

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Privacy Mode</Text>
      <Text style={styles.cardSubtitle}>
        Quickly control your visibility to all partners
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
              <Text style={[styles.privacyModeLabel, isActive && styles.privacyModeLabelActive]}>
                {mode.label}
              </Text>
              <Text style={[styles.privacyModeDesc, isActive && styles.privacyModeDescActive]} numberOfLines={2}>
                {mode.description}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────
export default function PartnerSettingsScreen() {
  const router = useRouter();
  const goBack = useGoBack();
  const { activePartners, pendingPartners, hasActivePartnership, isLoading } = usePartnership();

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
          <Text style={styles.headerTitle}>Partner Mode</Text>
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
          >
            {/* Connect form — always visible */}
            <ConnectSection />

            {/* Privacy mode — only if has any active partnership */}
            {hasActivePartnership && <PrivacyModeSection />}

            {/* Pending partnerships */}
            {pendingPartners.length > 0 && (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionLabel}>PENDING</Text>
                {pendingPartners.map((p) => (
                  <PendingPartnershipCard key={p.partnership_id} partnership={p} />
                ))}
              </View>
            )}

            {/* Active partnerships */}
            {activePartners.length > 0 && (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionLabel}>ACTIVE PARTNERSHIPS</Text>
                {activePartners.map((p) => (
                  <ActivePartnershipCard key={p.partnership_id} partnership={p} />
                ))}
              </View>
            )}
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
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 17, fontWeight: '600', color: '#000',
    position: 'absolute', left: 0, right: 0,
    textAlign: 'center', zIndex: -1,
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingTop: 24, paddingBottom: 40, gap: 24 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // ── Section blocks ──
  sectionBlock: {
    marginHorizontal: 16,
    gap: 10,
  },
  sectionLabel: {
    fontSize: 12, fontWeight: '600', color: '#8E8E93',
    letterSpacing: 1.5, marginBottom: 4,
  },

  // ── Code card ──
  codeCard: {
    marginHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 20, padding: 28, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8,
  },
  codeLabel: {
    fontSize: 12, fontWeight: '600', color: '#8E8E93',
    letterSpacing: 1.5, marginBottom: 12,
  },
  codeText: {
    fontSize: 40, fontFamily: Fonts.heading, fontWeight: '700',
    color: '#000', letterSpacing: 6, marginBottom: 12,
  },
  codeHint: {
    fontSize: 14, color: '#8E8E93', textAlign: 'center',
    lineHeight: 20, marginBottom: 20,
  },
  codeActions: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,122,255,0.08)',
    borderRadius: 12, overflow: 'hidden',
  },
  codeAction: {
    flexDirection: 'row', alignItems: 'center',
    gap: 6, paddingVertical: 10, paddingHorizontal: 20,
  },
  codeActionText: { fontSize: 15, fontWeight: '500', color: '#007AFF' },
  codeActionDivider: {
    width: 1, height: 20, backgroundColor: 'rgba(0,122,255,0.2)',
  },

  // ── Generic card ──
  card: {
    marginHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8,
  },
  cardTitle: {
    fontSize: 20, fontWeight: '700', color: '#000',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14, color: '#8E8E93', marginBottom: 20,
  },

  // ── Code input ──
  codeInput: {
    fontSize: 24, fontWeight: '600', color: '#000',
    backgroundColor: '#F5F5F7', borderRadius: 12,
    padding: 16, textAlign: 'center', letterSpacing: 4,
    marginBottom: 16,
  },

  // ── Buttons ──
  connectButton: {
    backgroundColor: '#000', borderRadius: 28,
    paddingVertical: 16, alignItems: 'center',
  },
  connectButtonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  buttonDisabled: { backgroundColor: '#E5E5EA' },

  // ── Status card (pending) ──
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4,
    gap: 12,
  },
  statusCardInfo: {
    flex: 1,
  },
  statusCardName: {
    fontSize: 16, fontWeight: '600', color: '#000',
  },
  statusCardSubtext: {
    fontSize: 14, color: '#8E8E93', marginTop: 2,
  },

  responseActions: {
    flexDirection: 'row', gap: 8,
  },
  declineButton: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#F5F5F7',
  },
  declineButtonText: { fontSize: 14, fontWeight: '600', color: '#8E8E93' },
  acceptButton: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#007AFF',
  },
  acceptButtonText: { fontSize: 14, fontWeight: '600', color: '#fff' },

  // ── Active partnership card ──
  activeCard: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8,
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
    fontSize: 18, fontWeight: '600', color: '#000',
  },
  activeCardSince: {
    fontSize: 14, color: '#8E8E93', marginTop: 2,
  },
  showPrefsButton: {
    marginTop: 16,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(0,122,255,0.06)',
    borderRadius: 12,
  },
  showPrefsText: {
    fontSize: 14, fontWeight: '600', color: '#007AFF',
  },

  // ── Sharing prefs ──
  prefsList: { marginTop: 12 },
  prefRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14,
  },
  prefRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(60,60,67,0.1)',
  },
  prefInfo: { flex: 1, marginRight: 12 },
  prefLabel: { fontSize: 16, fontWeight: '500', color: '#000' },
  prefDescription: { fontSize: 13, color: '#8E8E93', marginTop: 2 },

  // ── Dissolve ──
  dissolveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    paddingVertical: 10,
  },
  dissolveRowText: { fontSize: 14, color: '#FF3B30', fontWeight: '500' },

  // ── Privacy mode ──
  privacyModeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  privacyModeOption: {
    flex: 1,
    backgroundColor: '#F5F5F7',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  privacyModeOptionActive: {
    backgroundColor: '#E8F0FE',
    borderColor: '#007AFF',
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

  // ── Misc ──
  centered: { alignItems: 'center', marginHorizontal: 16 },
  pressedBg: { backgroundColor: 'rgba(0,0,0,0.05)' },
  errorText: { color: '#FF3B30', fontSize: 14, marginBottom: 12, textAlign: 'center' },
  regenerateButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 12, paddingHorizontal: 20,
    borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.7)',
  },
  regenerateText: { fontSize: 15, color: '#8E8E93', fontWeight: '500' },
});
