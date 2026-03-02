import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HOUR_HEIGHT, LEFT_GUTTER } from './constants';
import { formatHourLabel } from './utils';

interface HourRowProps {
  hour: number;
}

export const HourRow = memo(function HourRow({ hour }: HourRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{formatHourLabel(hour)}</Text>
      <View style={styles.line} />
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    height: HOUR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  label: {
    width: LEFT_GUTTER - 8,
    textAlign: 'right',
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '400',
    marginTop: -7,
    letterSpacing: -0.1,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(60,60,67,0.08)',
    marginLeft: 8,
  },
});
