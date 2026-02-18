import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Plus } from 'lucide-react-native';

interface QuickAddRowProps {
  placeholder: string;
  onAdd: () => void;
}

export const QuickAddRow = memo(function QuickAddRow({
  placeholder,
  onAdd,
}: QuickAddRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onAdd}
    >
      <Plus size={18} color="#007AFF" strokeWidth={2} />
      <Text style={styles.placeholder}>{placeholder}</Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  pressed: {
    opacity: 0.6,
  },
  placeholder: {
    fontSize: 15,
    fontWeight: '500',
    color: '#007AFF',
  },
});
