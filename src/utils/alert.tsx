import { Platform, Alert as RNAlert } from 'react-native';
import React from 'react';
import type { AlertButton } from '../components/AlertModal';

interface AlertState {
  visible: boolean;
  title?: string;
  message: string;
  buttons?: AlertButton[];
}

let alertStateListener: ((state: AlertState) => void) | null = null;

export const setAlertListener = (listener: (state: AlertState) => void) => {
  alertStateListener = listener;
};

export const Alert = {
  alert: (
    title: string,
    message?: string,
    buttons?: Array<{
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }>
  ) => {
    if (Platform.OS === 'web') {
      const alertMessage = message || title;
      const alertTitle = message ? title : undefined;

      if (alertStateListener) {
        alertStateListener({
          visible: true,
          title: alertTitle,
          message: alertMessage,
          buttons: buttons || [{ text: 'OK', style: 'default' }],
        });
      } else {
        window.alert(`${alertTitle ? `${alertTitle}\n\n` : ''}${alertMessage}`);
      }
    } else {
      RNAlert.alert(title, message, buttons as any);
    }
  },
};
