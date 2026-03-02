import React, { memo, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { HOUR_HEIGHT, START_HOUR, LEFT_GUTTER } from './constants';

export const CurrentTimeLine = memo(function CurrentTimeLine() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const hours = now.getHours();
  const minutes = now.getMinutes();
  const top = (hours - START_HOUR) * HOUR_HEIGHT + (minutes / 60) * HOUR_HEIGHT;

  if (top < 0) return null;

  return (
    <View style={[styles.container, { top }]} pointerEvents="none">
      <View style={styles.dot} />
      <View style={styles.line} />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: LEFT_GUTTER - 4,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 50,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: '#FF3B30',
  },
});
