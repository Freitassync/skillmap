import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import { AlertProvider } from './src/components';

/**
 * SkillMap 4.0 - Main App Component
 * Now using cloud backend with PostgreSQL instead of local SQLite
 */
const App: React.FC = () => {
  return (
    <AlertProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </NavigationContainer>
    </AlertProvider>
  );
};

export default App;
