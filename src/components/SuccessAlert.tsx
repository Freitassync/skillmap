import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SuccessAlertProps {
  message: string;
  visible: boolean;
  onHide?: () => void;
}

export const SuccessAlert: React.FC<SuccessAlertProps> = ({
  message,
  visible,
  onHide,
}) => {
  const slideAnim = new Animated.Value(-100);

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          onHide?.();
        });
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>✅</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.base,
    backgroundColor: COLORS.status.success,
    marginHorizontal: SPACING.base,
    marginTop: SPACING.base,
    borderRadius: 12,
    gap: SPACING.md,
  },
  icon: {
    fontSize: 20,
  },
  message: {
    color: '#fff',
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    flex: 1,
  },
});
