import { useRouter } from 'expo-router';
import {
  Plus,
  Home,
  User,
  FolderKanban,
  Clock,
  Settings,
  Archive,
  Trash2,
  RotateCcw,
  X,
  GripVertical,
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
  PanResponder,
  LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useLater } from '@/contexts/LaterContext';
import { AREA_CONFIG, type LaterArea, type LaterItem } from '@/types/later';
import { BottomNavBar } from '@/components/BottomNavBar';

const PADDING = 20;

const AREAS = Object.keys(AREA_CONFIG) as LaterArea[];

function DraggableLaterCard({
  item,
  index,
  onPress,
  onDragStart,
  onDragEnd,
  isDragging,
  draggedOverIndex,
  pan,
}: {
  item: LaterItem;
  index: number;
  onPress: () => void;
  onDragStart: (index: number) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  draggedOverIndex: number | null;
  pan: Animated.ValueXY;
}) {
  const config = AREA_CONFIG[item.area];
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isDraggingState, setIsDraggingState] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only trigger if moving vertically significantly
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderGrant: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsDraggingState(true);
        onDragStart(index);
        pan.setOffset({
          x: 0,
          y: 0,
        });
      },
      onPanResponderMove: Animated.event([null, { dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => {
        setIsDraggingState(false);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
          speed: 20,
          bounciness: 8,
        }).start();
        pan.flattenOffset();
        onDragEnd();
      },
    })
  ).current;

  const handlePressIn = () => {
    if (isDraggingState) return;
    Animated.spring(scaleAnim, {
      toValue: 0.96,
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

  const showSpacerAbove = draggedOverIndex !== null && draggedOverIndex === index && !isDraggingState;
  const showSpacerBelow = draggedOverIndex !== null && draggedOverIndex === index + 1 && !isDraggingState;

  return (
    <>
      {showSpacerAbove && <View style={styles.dropSpacer} />}
      <Animated.View
        style={[
          styles.cardWrapper,
          {
            transform: [
              { scale: scaleAnim },
              { translateY: isDraggingState ? pan.y : 0 },
            ],
            zIndex: isDraggingState ? 100 : 1,
          },
          isDraggingState && styles.cardDragging,
        ]}
      >
        <Pressable
          style={styles.card}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          // Enable long press to drag
          onLongPress={() => {
            // This is handled by PanResponder on the wrapper or handle
            // But if we want whole card draggable:
            // For now, let's use a specific handle or just the card itself
          }}
          delayLongPress={200}
        >
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={[styles.areaBadge, { backgroundColor: config.color + '15' }]}>
                <Text style={styles.areaEmoji}>{config.emoji}</Text>
                <Text style={[styles.areaLabel, { color: config.color }]}>{config.label}</Text>
              </View>
            </View>
            
            <Text style={styles.cardTitle}>{item.title}</Text>
            
            {item.note && (
              <Text style={styles.cardNote} numberOfLines={2}>
                {item.note}
              </Text>
            )}
          </View>
          
          {/* Drag Handle */}
          <View style={styles.dragHandle} {...panResponder.panHandlers}>
            <GripVertical size={20} color="#E5E5EA" />
          </View>
        </Pressable>
      </Animated.View>
      {showSpacerBelow && <View style={styles.dropSpacer} />}
    </>
  );
}

function ArchivedItemRow({
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
    <View style={styles.archivedRow}>
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
  const { activeItems, archivedItems, addItem, archiveItem, deleteItem, restoreItem, updateItem, reorderItems } = useLater();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [editingItem, setEditingItem] = useState<LaterItem | null>(null);

  // Drag and Drop State
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null);
  const taskLayoutsRef = useRef<{ y: number; height: number }[]>([]);
  const pan = useRef(new Animated.ValueXY()).current;
  const scrollViewRef = useRef<ScrollView>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [selectedArea, setSelectedArea] = useState<LaterArea>('personal');

  const handleAddPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTitle('');
    setNote('');
    setSelectedArea('personal');
    setEditingItem(null);
    setShowAddModal(true);
  };

  const handleEditPress = (item: LaterItem) => {
    if (draggingIndex !== null) return;
    Haptics.selectionAsync();
    setTitle(item.title);
    setNote(item.note || '');
    setSelectedArea(item.area);
    setEditingItem(item);
    setShowAddModal(true);
  };

  const handleSave = () => {
    if (!title.trim()) return;
    
    if (editingItem) {
      updateItem(editingItem.id, {
        title: title.trim(),
        note: note.trim() || undefined,
        area: selectedArea,
      });
    } else {
      addItem(title.trim(), selectedArea, note.trim() || undefined);
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

  const handleArchive = (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    archiveItem(id);
    if (editingItem?.id === id) {
      setShowAddModal(false);
    }
  };

  // Drag and Drop Logic
  const handleDragStart = useCallback((index: number) => {
    setDraggingIndex(index);
  }, []);

  const handleDragRelease = useCallback(() => {
    setDraggingIndex(null);
  }, []);

  const handleTaskLayout = useCallback((index: number, event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;
    taskLayoutsRef.current[index] = { y, height };
  }, []);

  const handleDragEnd = useCallback(() => {
    if (draggingIndex === null || draggedOverIndex === null) {
      setDraggingIndex(null);
      setDraggedOverIndex(null);
      return;
    }

    if (draggingIndex !== draggedOverIndex && draggedOverIndex !== draggingIndex + 1) {
      const newItems = [...activeItems];
      const [movedItem] = newItems.splice(draggingIndex, 1);
      // Adjust index if we moved from top to bottom
      const insertIndex = draggedOverIndex > draggingIndex ? draggedOverIndex - 1 : draggedOverIndex;
      newItems.splice(insertIndex, 0, movedItem);
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      reorderItems(newItems.map(t => t.id));
    }

    setDraggingIndex(null);
    setDraggedOverIndex(null);
  }, [draggingIndex, draggedOverIndex, activeItems, reorderItems]);

  React.useEffect(() => {
    if (draggingIndex === null) {
      setDraggedOverIndex(null);
    }
  }, [draggingIndex]);

  const updateDraggedOverIndex = useCallback((dragY: number) => {
    if (draggingIndex === null) return;

    const draggedTaskY = taskLayoutsRef.current[draggingIndex]?.y || 0;
    const absoluteDragY = draggedTaskY + dragY;

    let newIndex = draggingIndex;
    for (let i = 0; i < activeItems.length; i++) {
      const layout = taskLayoutsRef.current[i];
      if (!layout) continue;

      const taskMiddle = layout.y + layout.height / 2;
      if (absoluteDragY < taskMiddle) {
        newIndex = i;
        break;
      }
      newIndex = i + 1;
    }

    if (newIndex !== draggedOverIndex) {
      setDraggedOverIndex(newIndex);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [draggingIndex, activeItems.length, draggedOverIndex]);

  React.useEffect(() => {
    if (draggingIndex !== null) {
      const listener = pan.y.addListener(({ value }) => {
        updateDraggedOverIndex(value);
      });
      return () => {
        pan.y.removeListener(listener);
      };
    }
  }, [draggingIndex, updateDraggedOverIndex, pan.y]);

  React.useEffect(() => {
    if (draggingIndex === null && draggedOverIndex !== null) {
      handleDragEnd();
    }
  }, [draggingIndex, draggedOverIndex, handleDragEnd]);


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
        ref={scrollViewRef}
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        scrollEnabled={draggingIndex === null}
      >
        {activeItems.length === 0 && !showArchive ? (
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
          <View style={styles.scrollContent}>
            {/* Draggable List */}
            <View style={styles.listContainer}>
              {activeItems.map((item, index) => (
                <View 
                    key={item.id} 
                    onLayout={(e) => handleTaskLayout(index, e)}
                    style={{ zIndex: draggingIndex === index ? 100 : 1 }}
                >
                  <DraggableLaterCard
                    item={item}
                    index={index}
                    onPress={() => handleEditPress(item)}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragRelease}
                    isDragging={draggingIndex === index}
                    draggedOverIndex={draggedOverIndex}
                    pan={pan}
                  />
                </View>
              ))}
            </View>

            {/* Archive Section */}
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
                      <ArchivedItemRow
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
          </View>
        )}
      </ScrollView>

      {/* FAB for adding items */}
      <Pressable style={[styles.floatingFab, { bottom: Math.max(insets.bottom, 20) + 90 }]} onPress={handleAddPress}>
        <Plus size={28} color="#fff" strokeWidth={2} />
      </Pressable>

      {/* Bottom Navigation */}
      <BottomNavBar />

      {/* Add/Edit Modal */}
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
              <Text style={styles.modalTitle}>
                {editingItem ? 'Edit Idea' : 'Park an idea'}
              </Text>
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
              value={title}
              onChangeText={setTitle}
              autoFocus={!editingItem}
            />

            <TextInput
              style={[styles.modalInput, styles.modalNoteInput]}
              placeholder="Add a note (optional)"
              placeholderTextColor="#C7C7CC"
              value={note}
              onChangeText={setNote}
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

            <View style={styles.modalFooter}>
                {editingItem && (
                    <Pressable
                        style={styles.archiveButton}
                        onPress={() => handleArchive(editingItem.id)}
                    >
                        <Archive size={20} color="#FF3B30" strokeWidth={2} />
                    </Pressable>
                )}
                
                <Pressable
                style={[
                    styles.saveButton, 
                    !title.trim() && styles.saveButtonDisabled,
                    editingItem ? { flex: 1 } : { width: '100%' }
                ]}
                onPress={handleSave}
                disabled={!title.trim()}
                >
                <Text style={styles.saveButtonText}>
                    {editingItem ? 'Update' : 'Save for later'}
                </Text>
                </Pressable>
            </View>
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
    paddingBottom: 24,
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
  scrollContent: {
    paddingHorizontal: PADDING,
  },
  listContainer: {
    gap: 12,
  },
  cardWrapper: {
    marginBottom: 0,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardDragging: {
    zIndex: 1000,
    elevation: 8,
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    transform: [{ scale: 1.02 }],
  },
  dropSpacer: {
    height: 80, // Approx card height
    borderRadius: 20,
    backgroundColor: '#E5E5EA',
    borderWidth: 2,
    borderColor: '#C7C7CC',
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  cardContent: {
    flex: 1,
  },
  dragHandle: {
    padding: 10,
    marginRight: -10,
  },
  cardHeader: {
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
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    lineHeight: 22,
    marginBottom: 4,
  },
  cardNote: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  // Archive
  archiveSection: {
    marginTop: 32,
    marginBottom: 20,
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
  archivedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EAEAEE',
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
    backgroundColor: '#fff',
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
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
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
  // Floating FAB
  floatingFab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
  },
  // Bottom Bar (legacy - kept for reference)
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
  modalFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
  },
  archiveButton: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#FFE5E5',
      alignItems: 'center',
      justifyContent: 'center',
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
