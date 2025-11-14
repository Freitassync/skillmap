import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import DatabaseService from './src/services/DatabaseService';
import { COLORS } from './src/constants';

const App: React.FC = () => {
  const [dbInitialized, setDbInitialized] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Inicializa o banco de dados SQLite
      await DatabaseService.init();
      console.log('✅ App initialized successfully');
      setDbInitialized(true);
    } catch (error) {
      console.error('❌ Error initializing app:', error);
      // Mesmo com erro, permite usar o app (vai usar AsyncStorage/SecureStore)
      setDbInitialized(true);
    }
  };

  if (!dbInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.brand.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg.primary,
  },
});

export default App;
