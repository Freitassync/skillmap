import * as Updates from 'expo-updates';
import { Platform } from 'react-native';

/**
 * Reloads the app in a way that works in both development and production
 * In production: Uses expo-updates
 * In development: Returns false to indicate manual navigation reset needed
 */
export const reloadApp = async (): Promise<boolean> => {
  try {
    if (__DEV__) {
      console.log('[AppReload] Development mode - skipping Updates.reloadAsync()');
      return false;
    }

    if (Updates.isEnabled) {
      console.log('[AppReload] Reloading app using expo-updates');
      await Updates.reloadAsync();
      return true;
    }

    console.log('[AppReload] Updates not enabled');
    return false;
  } catch (error) {
    console.error('[AppReload] Error reloading app:', error);
    return false;
  }
};
