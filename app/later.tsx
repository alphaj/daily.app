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

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  const handlePress = () => {
    Haptics.selectionAsync();
  };

  const handleArchive = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onArchive(item.id);
  };

  return (
    <SwipeableRow onDelete={() => onDelete(item.id)}>
      <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
        <Pressable
            style={styles.itemCard}
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onLongPress={handleArchive}
            delayLongPress={500}
        >
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
        </Pressable>
      </Animated.View>
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
        <View style={[styles.archivedIcon, { backgroundColor: config.color + '15' }]}>
            <Text style={{ fontSize: 14 }}>{config.emoji}</Text>
        </View>
        <Text style={styles.archivedTitle} numberOfLines={1}>{item.title}</Text>
      </View>
      <View style={styles.archivedActions}>
        <Pressable
          style={styles.archivedAction}
          onPress={() => {
            Haptics.selectionAsync();
            onRestore(item.id);
          }}
          hitSlop={10}
        >
          <RotateCcw size={18} color="#5856D6" strokeWidth={2} />
        </Pressable>
        <Pressable
          style={styles.archivedAction}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            onDelete(item.id);
          }}
          hitSlop={10}
        >
          <Trash2 size={18} color="#FF3B30" strokeWidth={2} />
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
        <Text style={styles.headerTitle}>Later</Text>
        <Pressable 
          style={styles.headerButton} 
          onPress={() => router.push('/menu')}
        >
          <Settings size={22} color="#000" strokeWidth={1.5} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        {!hasItems && !showArchive ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Clock size={48} color="#C7C7CC" strokeWidth={1} />
            </View>
            <Text style={styles.emptyTitle}>Someday</Text>
            <Text style={styles.emptySubtitle}>
              Capture ideas and tasks you want to do someday, without cluttering your today.
            </Text>
            <Pressable style={styles.createButton} onPress={handleAddPress}>
              <Plus size={20} color="#fff" strokeWidth={2.5} />
              <Text style={styles.createButtonText}>Add Idea</Text>
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
                    <View style={[styles.countBadge, { backgroundColor: config.color + '15' }]}>
                        <Text style={[styles.countText, { color: config.color }]}>{items.length}</Text>
                    </View>
                  </View>
                  <View style={styles.itemsList}>
                    {items.map(item => (
                        <LaterItemCard
                        key={item.id}
                        item={item}
                        onArchive={archiveItem}
                        onDelete={handleDelete}
                        />
                    ))}
                  </View>
                </View>
              );
            })}

            {/* Archive Toggle */}
            {archivedItems.length > 0 && (
                <View style={styles.archiveSection}>
                     <Pressable
                        style={styles.archiveToggle}
                        onPress={() => {
                        Haptics.selectionAsync();
                        setShowArchive(!showArchive);
                        }}
                    >
                        <Archive size={16} color="#8E8E93" strokeWidth={2} />
                        <Text style={styles.archiveToggleText}>
                        {showArchive ? 'Hide' : 'Show'} Archived ({archivedItems.length})
                        </Text>
                    </Pressable>

                    {showArchive && (
                        <View style={styles.archivedList}>
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
                </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Floating Add Button */}
      {hasItems && (
        <Pressable style={styles.fab} onPress={handleAddPress}>
          <Plus size={28} color="#fff" strokeWidth={2} />
        </Pressable>
      )}

      {/* Bottom Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Pressable style={styles.bottomTab} onPress={() => router.replace('/')}>
          <Home size={24} color="#000" strokeWidth={1.5} />
        </Pressable>
        <Pressable style={styles.bottomTab} onPress={() => router.replace('/brain-dump')}>
          <Brain size={24} color="#000" strokeWidth={1.5} />
        </Pressable>

        <Pressable style={styles.bottomFabPlaceholder} onPress={handleAddPress}>
            {/* Placeholder for center alignment if needed, or use specific add logic */}
             <Plus size={24} color="#000" strokeWidth={2} />
        </Pressable>

        <Pressable style={styles.bottomTab} onPress={() => router.replace('/projects')}>
          <FolderKanban size={24} color="#000" strokeWidth={1.5} />
        </Pressable>
        <Pressable style={[styles.bottomTab, styles.bottomTabActive]}>
          <Clock size={24} color="#5856D6" strokeWidth={1.5} />
        </Pressable>
      </View>
      
      {/* Center FAB override for consistency with other pages */}
      <View pointerEvents="box-none" style={[styles.centerFabContainer, { bottom: Math.max(insets.bottom, 20) + 12 }]}>
         <Pressable style={styles.centerFab} onPress={handleAddPress}>
            <Plus size={28} color="#000" strokeWidth={1.5} />
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
                hitSlop={10}
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
                      isSelected && { backgroundColor: config.color + '15', borderColor: config.color },
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
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000',
    letterSpacing: -0.5,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  content: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 22,
    marginBottom: 32,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  areaSection: {
    marginBottom: 24,
  },
  areaSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingLeft: 4,
  },
  areaSectionEmoji: {
    fontSize: 18,
  },
  areaSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
  },
  itemsList: {
    gap: 12,
  },
  cardWrapper: {
    marginBottom: 0,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  areaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  areaEmoji: {
    fontSize: 10,
  },
  areaLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  itemTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    lineHeight: 22,
    marginBottom: 4,
  },
  itemNote: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  archiveSection: {
    marginTop: 16,
    marginBottom: 32,
  },
  archiveToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  archiveToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  archivedList: {
    marginTop: 16,
    gap: 10,
  },
  archivedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    padding: 12,
  },
  archivedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  archivedIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  archivedTitle: {
    fontSize: 15,
    color: '#8E8E93',
    flex: 1,
    fontWeight: '500',
    textDecorationLine: 'line-through',
  },
  archivedActions: {
    flexDirection: 'row',
    gap: 12,
    paddingLeft: 12,
  },
  archivedAction: {
    padding: 6,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  // Bottom Bar
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
  bottomFabPlaceholder: {
     width: 52,
     height: 52,
     opacity: 0, // Hidden but takes space
  },
  centerFabContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  centerFab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  // Floating Add Button (when scrolling)
  fab: {
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
    zIndex: 100,
  },
  // Modal
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
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    letterSpacing: -0.5,
  },
  modalClose: {
    padding: 4,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
  },
  modalInput: {
    fontSize: 18,
    color: '#000',
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    fontWeight: '500',
  },
  modalNoteInput: {
    height: 100,
    textAlignVertical: 'top',
    fontSize: 16,
    fontWeight: '400',
  },
  areaPickerLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 16,
  },
  areaPicker: {
    marginBottom: 24,
  },
  areaPickerContent: {
    gap: 10,
  },
  areaOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  areaOptionEmoji: {
    fontSize: 16,
  },
  areaOptionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  saveButton: {
    backgroundColor: '#000',
    borderRadius: 100,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  saveButtonDisabled: {
    backgroundColor: '#E5E5EA',
    shadowOpacity: 0,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
});
