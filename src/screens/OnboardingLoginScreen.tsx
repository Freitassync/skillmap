import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, STORAGE_KEYS } from '../constants';
import { useAuth } from '../hooks/useAuth';

const SCREEN_WIDTH = Dimensions.get('window').width;
const isSmallDevice = SCREEN_WIDTH < 375;

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'OnboardingLogin'>;
};

const tutorialSteps = [
  {
    title: 'Explore o Dashboard',
    description: 'Aqui você vê seu nível de XP, roadmaps criados e estatísticas de progresso.',
    emoji: '🏠',
    highlight: 'Home',
  },
  {
    title: 'Gere Roadmaps com IA',
    description: 'Use nossa inteligência artificial para criar planos de carreira personalizados.',
    emoji: '🎯',
    highlight: 'Gerador',
  },
  {
    title: 'Acompanhe Skills',
    description: 'Marque habilidades como concluídas e ganhe XP conforme progride!',
    emoji: '✅',
    highlight: 'Tracker',
  },
  {
    title: 'Converse com a IA',
    description: 'Tire dúvidas e receba orientação profissional no chat sempre que precisar.',
    emoji: '💬',
    highlight: 'ChatBot',
  },
];

const OnboardingLoginScreen: React.FC<Props> = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const { user } = useAuth();

  const markOnboardingComplete = async () => {
    if (user) {
      try {
        const onboardingKey = `${STORAGE_KEYS.ONBOARDING}_login_${user.id}`;
        await AsyncStorage.setItem(onboardingKey, 'true');
        console.log('✅ Onboarding marked as complete for user:', user.id);
      } catch (error) {
        console.error('Error marking onboarding as complete:', error);
      }
    }
  };

  const handleNext = async () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Marca onboarding como visto e vai para MainTabs
      await markOnboardingComplete();
      navigation.replace('MainTabs');
    }
  };

  const handleSkip = async () => {
    // Marca onboarding como visto e vai para MainTabs
    await markOnboardingComplete();
    navigation.replace('MainTabs');
  };

  const step = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Skip button */}
        {!isLastStep && (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Pular tutorial</Text>
          </TouchableOpacity>
        )}

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.emojiContainer}>
            <Text style={styles.emoji}>{step.emoji}</Text>
          </View>

          <View style={styles.highlightBadge}>
            <Text style={styles.highlightText}>{step.highlight}</Text>
          </View>

          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.description}>{step.description}</Text>

          {/* Progress indicator */}
          <Text style={styles.progressText}>
            Passo {currentStep + 1} de {tutorialSteps.length}
          </Text>
        </View>

        {/* Pagination dots */}
        <View style={styles.pagination}>
          {tutorialSteps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentStep && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>

        {/* Navigation button */}
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>
            {isLastStep ? 'Começar a usar' : 'Próximo'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg.primary,
  },
  container: {
    flex: 1,
    paddingHorizontal: isSmallDevice ? SPACING.lg : SPACING.xl,
  },
  skipButton: {
    alignSelf: 'flex-end',
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.lg,
  },
  skipText: {
    color: COLORS.text.secondary,
    fontSize: isSmallDevice ? TYPOGRAPHY.fontSize.sm : TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiContainer: {
    width: isSmallDevice ? 100 : 120,
    height: isSmallDevice ? 100 : 120,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bg.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  emoji: {
    fontSize: isSmallDevice ? 50 : 60,
  },
  highlightBadge: {
    backgroundColor: `${COLORS.brand.primary}33`,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.base,
  },
  highlightText: {
    color: COLORS.brand.primary,
    fontSize: isSmallDevice ? TYPOGRAPHY.fontSize.sm : TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  title: {
    fontSize: isSmallDevice ? TYPOGRAPHY.fontSize.xl : TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SPACING.base,
  },
  description: {
    fontSize: isSmallDevice ? TYPOGRAPHY.fontSize.sm : TYPOGRAPHY.fontSize.base,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: isSmallDevice ? 20 : 24,
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.lg,
  },
  progressText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.tertiary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: isSmallDevice ? SPACING.lg : SPACING.xl,
    gap: SPACING.sm,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bg.secondary,
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: COLORS.brand.primary,
  },
  button: {
    backgroundColor: COLORS.brand.primary,
    paddingVertical: isSmallDevice ? SPACING.sm : SPACING.base,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  buttonText: {
    color: COLORS.bg.primary,
    fontSize: isSmallDevice ? TYPOGRAPHY.fontSize.base : TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
});

export default OnboardingLoginScreen;
