import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants';

interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  isLoading?: boolean;
  fullWidth?: boolean;
  size?: 'small' | 'medium' | 'large';
  containerStyle?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  isLoading = false,
  fullWidth = true,
  size = 'medium',
  disabled,
  containerStyle,
  ...touchableProps
}) => {
  const getButtonStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle[] = [styles.button, styles[size]];

    if (fullWidth) baseStyle.push(styles.fullWidth);
    if (disabled || isLoading) baseStyle.push(styles.disabled);

    switch (variant) {
      case 'secondary':
        baseStyle.push(styles.secondary);
        break;
      case 'outline':
        baseStyle.push(styles.outline);
        break;
      case 'danger':
        baseStyle.push(styles.danger);
        break;
      default:
        baseStyle.push(styles.primary);
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle[] => {
    const baseStyle: TextStyle[] = [styles.text];

    switch (variant) {
      case 'outline':
        baseStyle.push(styles.textOutline);
        break;
      default:
        baseStyle.push(styles.textPrimary);
    }

    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), containerStyle]}
      disabled={disabled || isLoading}
      {...touchableProps}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'outline' ? COLORS.brand.primary : COLORS.bg.primary} />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  // Sizes
  small: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.base,
  },
  medium: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  large: {
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.xl,
  },
  // Variants
  primary: {
    backgroundColor: COLORS.brand.primary,
  },
  secondary: {
    backgroundColor: COLORS.brand.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.brand.primary,
  },
  danger: {
    backgroundColor: COLORS.status.error,
  },
  disabled: {
    opacity: 0.5,
  },
  // Text
  text: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  textPrimary: {
    color: COLORS.bg.primary,
  },
  textOutline: {
    color: COLORS.brand.primary,
  },
});
