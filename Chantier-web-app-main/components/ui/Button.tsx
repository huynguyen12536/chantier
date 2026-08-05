import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/constants';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
}: ButtonProps) {
  const buttonStyle = [
    styles.base,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? Colors.primary : Colors.text.inverse} />
      ) : (
        <>
          {icon}
          <Text style={textStyles}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  
  // Variants
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.secondary,
  },
  success: {
    backgroundColor: Colors.success,
  },
  warning: {
    backgroundColor: Colors.warning,
  },
  error: {
    backgroundColor: Colors.error,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  
  // Sizes
  small: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  medium: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  large: {
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
  },
  
  // States
  disabled: {
    opacity: 0.6,
  },
  
  // Text styles
  text: {
    fontWeight: FontWeight.bold,
  },
  primaryText: {
    color: Colors.text.inverse,
    fontSize: FontSize.lg,
  },
  secondaryText: {
    color: Colors.text.inverse,
    fontSize: FontSize.lg,
  },
  successText: {
    color: Colors.text.inverse,
    fontSize: FontSize.lg,
  },
  warningText: {
    color: Colors.text.inverse,
    fontSize: FontSize.lg,
  },
  errorText: {
    color: Colors.text.inverse,
    fontSize: FontSize.lg,
  },
  outlineText: {
    color: Colors.primary,
    fontSize: FontSize.lg,
  },
  
  smallText: {
    fontSize: FontSize.md,
  },
  mediumText: {
    fontSize: FontSize.lg,
  },
  largeText: {
    fontSize: FontSize.xl,
  },
});