import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthContext } from '../contexts/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import CadastroScreen from '../screens/RegisterScreen';
import OnboardingCadastroScreen from '../screens/OnboardingCadastroScreen';
import OnboardingLoginScreen from '../screens/OnboardingLoginScreen';
import HomeScreen from '../screens/HomeScreen';
import GeradorRoadmapScreen from '../screens/RoadmapGeneratorScreen';
import RoadmapTrackerScreen from '../screens/RoadmapTrackerScreen';
import ChatBotScreen from '../screens/ChatBotScreen';
import SkillDetailScreen from '../screens/SkillDetailScreen';
import { RootStackParamList, TabParamList } from './types';
import { COLORS, TYPOGRAPHY, STORAGE_KEYS } from '../constants';
import { logger } from '../utils/logger';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const MainTabs: React.FC = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.bg.secondary,
          borderTopColor: COLORS.bg.tertiary,
          borderTopWidth: 1,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
          height: (insets.bottom > 0 ? insets.bottom : 8) + 56,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarActiveTintColor: COLORS.brand.primary,
        tabBarInactiveTintColor: COLORS.text.muted,
        tabBarLabelStyle: {
          fontSize: TYPOGRAPHY.fontSize.xs,
          fontWeight: TYPOGRAPHY.fontWeight.semibold,
          marginBottom: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Início',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size || 24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="GeradorRoadmap"
        component={GeradorRoadmapScreen}
        options={{
          tabBarLabel: 'Gerador',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="map-marker-path" size={size || 24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="RoadmapTracker"
        component={RoadmapTrackerScreen}
        options={{
          tabBarLabel: 'Tracker',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkmark-done" size={size || 24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ChatBot"
        component={ChatBotScreen}
        options={{
          tabBarLabel: 'IA Chat',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size || 24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator: React.FC = () => {
  const { user, isLoading } = useAuthContext();
  const [initializing, setInitializing] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, [user, isLoading]);

  const checkOnboardingStatus = async () => {
    
    if (isLoading) {
      return;
    }


    if (!user) {
      setHasSeenOnboarding(false);
      setInitializing(false);
      return;
    }

    try {
      const onboardingKey = `${STORAGE_KEYS.ONBOARDING}_login_${user.id}`;
      const seen = await AsyncStorage.getItem(onboardingKey);
      logger.debug('Onboarding status:', { userId: user.id, seen: !!seen });
      setHasSeenOnboarding(!!seen);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setHasSeenOnboarding(true); // Em caso de erro, pula o onboarding
    } finally {
      setInitializing(false);
    }
  };

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.brand.primary} />
      </View>
    );
  }

  logger.debug('Navigator state:', {
    userId: user?.id,
    userNome: user?.name,
    hasSeenOnboarding,
    isAuthenticated: !!user
  });

  return (
    <Stack.Navigator
      key={user ? `auth-${user.id}` : 'guest'}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: COLORS.bg.primary },
      }}
    >
      {user ? (
        <>
          {!hasSeenOnboarding && (
            <Stack.Screen
              name="OnboardingLogin"
              component={OnboardingLoginScreen}
              options={{ gestureEnabled: false }}
            />
          )}
          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
            options={{ gestureEnabled: false }}
          />
          <Stack.Screen
            name="SkillDetail"
            component={SkillDetailScreen}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="OnboardingCadastro" component={OnboardingCadastroScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Cadastro" component={CadastroScreen} />
        </>
      )}
    </Stack.Navigator>
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

export default AppNavigator;
