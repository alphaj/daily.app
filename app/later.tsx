import { useRouter } from 'expo-router';
import {
  Plus,
  Home,
  Brain,
  FolderKanban,
  Clock,
  Settings,
  Archive,
  Trash2,
  RotateCcw,
  X,
} from 'lucide-react-native';
import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  Animated,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useLater } from '@/contexts/LaterContext';
import { AREA_CONFIG, type LaterArea, type LaterItem } from '@/types/later';
import SwipeableRow from '@/components/SwipeableRow';

const AREAS = Object.keys(AREA_CONFIG) as LaterArea[];

function LaterItemCard({
  item,
  onArchive,
  onDelete,
}: {
  item: LaterItem;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const config = AREA_CONFIG[item.area];
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Haptics.selectionAsync();
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleArchive = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onArchive(item.id);
  };

  return (
    <SwipeableRow onDelete={() => onDelete(item.id)}>
      <Pressable onPress={handlePress} onLongPress={handleArchive} delayLongPress={500}>
        <Animated.View style={[styles.itemCard, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.itemHeader}>
            <View style={[styles.areaBadge, { backgroundColor: config.color + '15' }]}>
              <Text style={styles.areaEmoji}>{config.emoji}</Text>
              <Text style={[styles.areaLabel, { color: config.color }]}>{config.label}</Text>
            </View>
          </View>
          <Text style={styles.itemTitle}>{item.title}</Text>
          {item.note && (
            <Text style={styles.itemNote} numberOfLines={2}>
              {item.note}
            </Text>
          )}
        </Animated.View>
      </Pressable>
    </SwipeableRow>
  );
}

function ArchivedItemCard({
  item,
  onRestore,
  onDelete,
}: {
  item: LaterItem;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const config = AREA_CONFIG[item.area];

  return (
    <View style={styles.archivedCard}>
      <View style={styles.archivedContent}>
        <Text style={styles.archivedEmoji}>{config.emoji}</Text>
        <Text style={styles.archivedTitle} numberOfLines={1}>{item.title}</Text>
      </View>
      <View style={styles.archivedActions}>
        <Pressable
          style={styles.archivedAction}
          onPress={() => {
            Haptics.selectionAsync();
            onRestore(item.id);
          }}
        >
          <RotateCcw size={16} color="#5856D6" />
        </Pressable>
        <Pressable
          style={styles.archivedAction}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            onDelete(item.id);
          }}
        >
          <Trash2 size={16} color="#FF3B30" />
        </Pressable>
      </View>
    </View>
  );
}

export default function LaterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeItems, archivedItems, addItem, archiveItem, deleteItem, restoreItem } = useLater();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newNote, setNewNote] = useState('');
  const [selectedArea, setSelectedArea] = useState<LaterArea>('personal');

  const handleAddPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowAddModal(true);
  };

  const handleSave = () => {
    if (!newTitle.trim()) return;
    
    addItem(newTitle.trim(), selectedArea, newNote.trim() || undefined);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    setNewTitle('');
    setNewNote('');
    setSelectedArea('personal');
    setShowAddModal(false);
  };

  const handleDelete = useCallback((id: string) => {
    Alert.alert(
      'Delete Item',
      'This will permanently remove this item.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteItem(id),
        },
      ]
    );
  }, [deleteItem]);

  const groupedItems = AREAS.reduce((acc, area) => {
    const items = activeItems.filter(item => item.area === area);
    if (items.length > 0) {
      acc[area] = items;
    }
    return acc;
  }, {} as Record<LaterArea, LaterItem[]>);

  const hasItems = activeItems.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconButton} />

        <View style={styles.headerCenter}>
          <Text style={styles.logoText}>daily.app</Text>
          <Text style={styles.headerTitle}>Later</Text>
        </View>

        <Pressable 
          style={styles.iconButton} 
          onPress={() => router.push('/menu')}
        >
          <Settings size={22} color="#000" strokeWidth={1.5} />
        </Pressable>
      </View>

      {/* Subheader */}
      <View style={styles.subheader}>
        <Text style={styles.subheaderText}>
          {activeItems.length} {activeItems.length === 1 ? 'idea' : 'ideas'} parked
        </Text>
        {archivedItems.length > 0 && (
          <Pressable
            style={styles.archiveToggle}
            onPress={() => {
              Haptics.selectionAsync();
              setShowArchive(!showArchive);
            }}
          >
            <Archive size={16} color="#8E8E93" />
            <Text style={styles.archiveToggleText}>
              {showArchive ? 'Hide' : 'Show'} archived ({archivedItems.length})
            </Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        {!hasItems && !showArchive ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Clock size={48} color="#C7C7CC" strokeWidth={1} />
            </View>
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptySubtitle}>
              Capture ideas, tasks, and things you want to do{'\n'}
              someday without cluttering your daily focus.
            </Text>
            <Pressable style={styles.emptyButton} onPress={handleAddPress}>
              <Plus size={18} color="#fff" strokeWidth={2} />
              <Text style={styles.emptyButtonText}>Add your first idea</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Active Items by Area */}
            {Object.entries(groupedItems).map(([area, items]) => {
              const config = AREA_CONFIG[area as LaterArea];
              return (
                <View key={area} style={styles.areaSection}>
                  <View style={styles.areaSectionHeader}>
                    <Text style={styles.areaSectionEmoji}>{config.emoji}</Text>
                    <Text style={[styles.areaSectionTitle, { color: config.color }]}>
                      {config.label}
                    </Text>
                    <Text style={styles.areaSectionCount}>{items.length}</Text>
                  </View>
                  {items.map(item => (
                    <LaterItemCard
                      key={item.id}
                      item={item}
                      onArchive={archiveItem}
                      onDelete={handleDelete}
                    />
                  ))}
                </View>
              );
            })}

            {/* Archived Section */}
            {showArchive && archivedItems.length > 0 && (
              <View style={styles.archivedSection}>
                <Text style={styles.archivedSectionTitle}>Archived</Text>
                {archivedItems.map(item => (
                  <ArchivedItemCard
                    key={item.id}
                    item={item}
                    onRestore={restoreItem}
                    onDelete={handleDelete}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Floating Add Button */}
      {hasItems && (
        <Pressable style={styles.floatingAdd} onPress={handleAddPress}>
          <Plus size={24} color="#fff" strokeWidth={2} />
        </Pressable>
      )}

      {/* Bottom Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Pressable style={styles.bottomTab} onPress={() => router.replace('/')}>
          <Home size={24} color="#000" strokeWidth={1.5} />
        </Pressable>
        <Pressable style={styles.bottomTab} onPress={() => router.push('/brain-dump')}>
          <Brain size={24} color="#000" strokeWidth={1.5} />
        </Pressable>

        <Pressable style={styles.fab} onPress={handleAddPress}>
          <Plus size={24} color="#000" strokeWidth={2} />
        </Pressable>

        <Pressable style={styles.bottomTab} onPress={() => router.push('/projects')}>
          <FolderKanban size={24} color="#000" strokeWidth={1.5} />
        </Pressable>
        <Pressable style={[styles.bottomTab, styles.bottomTabActive]}>
          <Clock size={24} color="#5856D6" strokeWidth={1.5} />
        </Pressable>
      </View>

      {/* Add Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowAddModal(false)} />
          <View style={[styles.addModal, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Park an idea</Text>
              <Pressable
                style={styles.modalClose}
                onPress={() => setShowAddModal(false)}
              >
                <X size={24} color="#8E8E93" />
              </Pressable>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="What's on your mind?"
              placeholderTextColor="#C7C7CC"
              value={newTitle}
              onChangeText={setNewTitle}
              autoFocus
            />

            <TextInput
              style={[styles.modalInput, styles.modalNoteInput]}
              placeholder="Add a note (optional)"
              placeholderTextColor="#C7C7CC"
              value={newNote}
              onChangeText={setNewNote}
              multiline
            />

            <Text style={styles.areaPickerLabel}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.areaPicker}
              contentContainerStyle={styles.areaPickerContent}
            >
              {AREAS.map(area => {
                const config = AREA_CONFIG[area];
                const isSelected = selectedArea === area;
                return (
                  <Pressable
                    key={area}
                    style={[
                      styles.areaOption,
                      isSelected && { backgroundColor: config.color + '20', borderColor: config.color },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedArea(area);
                    }}
                  >
                    <Text style={styles.areaOptionEmoji}>{config.emoji}</Text>
                    <Text style={[styles.areaOptionLabel, isSelected && { color: config.color }]}>
                      {config.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable
              style={[styles.saveButton, !newTitle.trim() && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={!newTitle.trim()}
            >
              <Text style={styles.saveButtonText}>Save for later</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  iconButton: {
    padding: 8,
    width: 40,
  },
  headerCenter: {
    alignItems: 'center',
    gap: 4,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#000',
    letterSpacing: -1.0,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#8E8E93',
  },
  subheader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  subheaderText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#8E8E93',
  },
  archiveToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  archiveToggleText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#8E8E93',
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#000',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#000',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 100,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  areaSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  areaSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  areaSectionEmoji: {
    fontSize: 18,
  },
  areaSectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  areaSectionCount: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#8E8E93',
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  areaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
  },
  areaEmoji: {
    fontSize: 12,
  },
  areaLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  itemTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#000',
    lineHeight: 24,
  },
  itemNote: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 6,
    lineHeight: 20,
  },
  archivedSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  archivedSectionTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#8E8E93',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  archivedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    opacity: 0.7,
  },
  archivedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  archivedEmoji: {
    fontSize: 16,
  },
  archivedTitle: {
    fontSize: 15,
    color: '#8E8E93',
    flex: 1,
  },
  archivedActions: {
    flexDirection: 'row',
    gap: 12,
  },
  archivedAction: {
    padding: 4,
  },
  floatingAdd: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingTop: 16,
    backgroundColor: '#fff',
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
  },
  bottomTab: {
    padding: 8,
  },
  bottomTabActive: {
    opacity: 1,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  addModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#000',
  },
  modalClose: {
    padding: 4,
  },
  modalInput: {
    fontSize: 17,
    color: '#000',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  modalNoteInput: {
    height: 80,
    textAlignVertical: 'top' as const,
  },
  areaPickerLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#8E8E93',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 12,
  },
  areaPicker: {
    marginBottom: 20,
  },
  areaPickerContent: {
    gap: 8,
  },
  areaOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 100,
    backgroundColor: '#F2F2F7',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  areaOptionEmoji: {
    fontSize: 14,
  },
  areaOptionLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#000',
  },
  saveButton: {
    backgroundColor: '#000',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#E5E5EA',
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
