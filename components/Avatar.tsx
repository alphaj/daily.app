import React, { memo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: number;
  fallbackColor?: string;
  onPress?: () => void;
  showOnlineBadge?: boolean;
}

export const Avatar = memo(function Avatar({
  uri,
  name,
  size = 44,
  fallbackColor = '#007AFF',
  onPress,
  showOnlineBadge,
}: AvatarProps) {
  const borderRadius = size / 2;
  const fontSize = size * 0.45;
  const badgeSize = Math.max(12, size * 0.3);
  const [imgError, setImgError] = useState(false);

  const fallback = (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: fallbackColor,
        },
      ]}
    >
      <Text style={[styles.fallbackText, { fontSize }]}>
        {name?.charAt(0).toUpperCase() ?? '?'}
      </Text>
    </View>
  );

  const content = uri && !imgError ? (
    <Image
      source={{ uri }}
      style={{ width: size, height: size, borderRadius }}
      cachePolicy="memory-disk"
      contentFit="cover"
      transition={200}
      onError={() => setImgError(true)}
    />
  ) : fallback;

  const badge = showOnlineBadge ? (
    <View
      style={[
        styles.badge,
        {
          width: badgeSize,
          height: badgeSize,
          borderRadius: badgeSize / 2,
          borderWidth: Math.max(2, badgeSize * 0.15),
        },
      ]}
    />
  ) : null;

  const inner = (
    <View style={{ position: 'relative' }}>
      {content}
      {badge}
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{inner}</Pressable>;
  }

  return inner;
});

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    fontWeight: '700',
    color: '#fff',
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#34C759',
    borderColor: '#fff',
  },
});
