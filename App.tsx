import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import { AlertProvider } from './src/components';
import { useAuthContext } from './src/contexts/AuthContext';

/**
 * SkillMap 4.0 - Main App Component
 * Now using cloud backend with PostgreSQL instead of local SQLite
 */

const AppContent: React.FC = () => {
  const { authChangeKey } = useAuthContext();

  return (
    <NavigationContainer key={`nav-${authChangeKey}`}>
      <StatusBar style="light" />
      <AppNavigator />
    </NavigationContainer>
  );
};

const App: React.FC = () => {
  return (
    <AlertProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </AlertProvider>
  );
};

export default App;
