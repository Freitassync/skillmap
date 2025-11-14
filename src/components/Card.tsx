import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../constants';

interface CardProps {
  children: ReactNode;
  variant?: 'default' | 'elevated';
  padding?: 'none' | 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'medium',
  style,
}) => {
  const getPaddingStyle = (): ViewStyle => {
    switch (padding) {
      case 'none':
        return { padding: 0 };
      case 'small':
        return { padding: SPACING.md };
      case 'large':
        return { padding: SPACING.xl };
      default:
        return { padding: SPACING.base };
    }
  };

  return (
    <View
      style={[
        styles.card,
        variant === 'elevated' && styles.elevated,
        getPaddingStyle(),
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bg.tertiary,
    borderRadius: RADIUS.lg,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
