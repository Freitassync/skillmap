import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../constants';

const SCREEN_WIDTH = Dimensions.get('window').width;
const isSmallDevice = SCREEN_WIDTH < 375;

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'OnboardingCadastro'>;
};

const slides = [
  {
    title: 'Bem-vindo ao SkillMap 4.0',
    description: 'Sua jornada de requalificação profissional começa aqui. Vamos te guiar passo a passo!',
    emoji: '🚀',
  },
  {
    title: 'Crie Roadmaps Personalizados',
    description: 'Nossa IA te ajuda a criar planos de carreira sob medida para seus objetivos.',
    emoji: '🗺️',
  },
  {
    title: 'Acompanhe seu Progresso',
    description: 'Marque skills como concluídas, ganhe XP e acompanhe sua evolução em tempo real.',
    emoji: '📈',
  },
  {
    title: 'Assistente IA 24/7',
    description: 'Tire dúvidas e receba orientação profissional a qualquer momento com nosso chatbot.',
    emoji: '🤖',
  },
];

const OnboardingCadastroScreen: React.FC<Props> = ({ navigation }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigation.navigate('Cadastro');
    }
  };

  const handleSkip = () => {
    navigation.navigate('Cadastro');
  };

  const slide = slides[currentSlide];
  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Skip button */}
        {!isLastSlide && (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Pular</Text>
          </TouchableOpacity>
        )}

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.emojiContainer}>
            <Text style={styles.emoji}>{slide.emoji}</Text>
          </View>

          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.description}>{slide.description}</Text>
        </View>

        {/* Pagination dots */}
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentSlide && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>

        {/* Navigation button */}
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>
            {isLastSlide ? 'Começar' : 'Próximo'}
          </Text>
        </TouchableOpacity>

        {/* Login link */}
        {isLastSlide && (
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>
              Já tem uma conta? <Text style={styles.loginLinkBold}>Fazer login</Text>
            </Text>
          </TouchableOpacity>
        )}
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
    width: isSmallDevice ? 120 : 150,
    height: isSmallDevice ? 120 : 150,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bg.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: isSmallDevice ? SPACING.xl : SPACING['3xl'],
  },
  emoji: {
    fontSize: isSmallDevice ? 60 : 80,
  },
  title: {
    fontSize: isSmallDevice ? TYPOGRAPHY.fontSize['2xl'] : TYPOGRAPHY.fontSize['3xl'],
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
    marginBottom: SPACING.base,
  },
  buttonText: {
    color: COLORS.bg.primary,
    fontSize: isSmallDevice ? TYPOGRAPHY.fontSize.base : TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  loginLink: {
    color: COLORS.text.secondary,
    fontSize: isSmallDevice ? TYPOGRAPHY.fontSize.sm : TYPOGRAPHY.fontSize.base,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  loginLinkBold: {
    color: COLORS.brand.primary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
});

export default OnboardingCadastroScreen;
