import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getStatusLabel, getStatusStyle } from '@/utils';
import { Colors, Spacing, BorderRadius, FontSize } from '@/constants';

interface StatusBadgeProps {
  status: string;
  size?: 'small' | 'medium';
}

export function StatusBadge({ status, size = 'medium' }: StatusBadgeProps) {
  const statusStyle = getStatusStyle(status);
  const label = getStatusLabel(status);

  return (
    <View style={[
      styles.badge,
      size === 'small' ? styles.badgeSmall : styles.badgeMedium,
      statusStyle
    ]}>
      <Text style={[
        styles.text,
        size === 'small' ? styles.textSmall : styles.textMedium
      ]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  badgeMedium: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  text: {
    color: Colors.text.inverse,
    fontWeight: '600',
  },
  textSmall: {
    fontSize: FontSize.xs,
  },
  textMedium: {
    fontSize: FontSize.sm,
  },
});