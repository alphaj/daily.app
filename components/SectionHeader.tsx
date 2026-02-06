import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Plus } from 'lucide-react-native';

interface SectionHeaderProps {
  icon: React.ReactNode;
  label: string;
  completed?: number;
  total?: number;
  onAdd?: () => void;
  addLabel?: string;
}

export function SectionHeader({
  icon,
  label,
  completed,
  total,
  onAdd,
  addLabel = 'Add',
}: SectionHeaderProps) {
  const showCount = total !== undefined && total > 0;

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        {icon}
        <Text style={styles.label}>{label}</Text>
        {showCount && (
          <Text style={styles.count}>{`\u00B7 ${completed}/${total}`}</Text>
        )}
      </View>
      {onAdd && (
        <Pressable onPress={onAdd} style={styles.addButton} hitSlop={20}>
          <Plus size={18} color="#007AFF" strokeWidth={2} />
          <Text style={styles.addLink}>{addLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    letterSpacing: -0.4,
  },
  count: {
    fontSize: 22,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: -0.4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
  },
  addLink: {
    fontSize: 17,
    fontWeight: '400',
    color: '#007AFF',
  },
});
