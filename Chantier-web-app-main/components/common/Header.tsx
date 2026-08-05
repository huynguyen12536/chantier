import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, FontWeight } from '@/constants';

interface HeaderProps {
  title: string;
  subtitle?: string;
  backgroundColor?: string;
}

export function Header({ title, subtitle, backgroundColor = Colors.primary }: HeaderProps) {
  return (
    <View style={[styles.header, { backgroundColor }]}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: Spacing.xxl,
    paddingTop: 60,
  },
  title: {
    fontSize: FontSize.huge,
    fontWeight: FontWeight.bold,
    color: Colors.text.inverse,
  },
  subtitle: {
    fontSize: FontSize.lg,
    color: Colors.text.inverse,
    opacity: 0.9,
    marginTop: Spacing.xs,
  },
});