import React from 'react';
import { Text, StyleSheet } from 'react-native';

export function Logo() {
  return (
    <Text style={styles.logo}>
      daily<Text style={styles.logoDot}>.app</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  logo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.5,
  },
  logoDot: {
    color: '#8E8E93',
    fontWeight: '500',
  },
});
