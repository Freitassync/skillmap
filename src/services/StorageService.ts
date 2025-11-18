import { Platform } from 'react-native';

let SecureStore: any = null;

if (Platform.OS !== 'web') {
  SecureStore = require('expo-secure-store');
}

/**
 * Cross-platform secure storage
 * Uses SecureStore on native (iOS/Android) and localStorage on web
 */
class StorageService {
  /**
   * Store a key-value pair securely
   */
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, value);
      }
    } else {
      if (SecureStore) {
        await SecureStore.setItemAsync(key, value);
      }
    }
  }

  /**
   * Retrieve a value by key
   */
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem(key);
      }
      return null;
    } else {
      if (SecureStore) {
        return await SecureStore.getItemAsync(key);
      }
      return null;
    }
  }

  /**
   * Delete a key-value pair
   */
  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(key);
      }
    } else {
      if (SecureStore) {
        await SecureStore.deleteItemAsync(key);
      }
    }
  }
}

export default new StorageService();
