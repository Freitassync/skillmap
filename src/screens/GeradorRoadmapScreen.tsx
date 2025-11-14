import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../hooks/useAuth';
import { useRoadmap } from '../hooks/useRoadmap';
import { Button, Input, Card } from '../components';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, MESSAGES } from '../constants';
import type { FormErrors } from '../types/models';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;

export type GeradorRoadmapScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'GeradorRoadmap'
>;

const GeradorRoadmapScreen: React.FC = () => {
  const navigation = useNavigation<GeradorRoadmapScreenNavigationProp>();
  const { usuario } = useAuth();
  const { criarRoadmap, isLoading } = useRoadmap();

  const [carreiraDesejada, setCarreiraDesejada] = useState('');
  const [hardSkills, setHardSkills] = useState('');
  const [softSkills, setSoftSkills] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const handleGerar = async () => {
    // Validação básica
    const newErrors: FormErrors = {};

    if (carreiraDesejada.trim().length < 3) {
      newErrors.carreiraDesejada = 'Nome da carreira deve ter ao menos 3 caracteres';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!usuario) {
      Alert.alert('Erro', 'Você precisa estar logado');
      return;
    }

    setErrors({});

    // Processa skills (separa por vírgula)
    const hardSkillsArray = hardSkills
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const softSkillsArray = softSkills
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    // Chama serviço para criar roadmap
    const roadmap = await criarRoadmap(usuario.id, {
      nome_carreira: carreiraDesejada,
      hard_skills_atuais: hardSkillsArray,
      soft_skills_atuais: softSkillsArray,
    });

    if (roadmap) {
      Alert.alert(
        'Sucesso!',
        MESSAGES.roadmap.criadoSuccess,
        [
          {
            text: 'Ver Roadmap',
            onPress: () => navigation.navigate('RoadmapTracker'),
          },
          {
            text: 'Criar Outro',
            onPress: () => {
              setCarreiraDesejada('');
              setHardSkills('');
              setSoftSkills('');
            },
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.header}>
          <Text style={styles.title}>Gerador de Roadmap 4.0</Text>
          <Text style={styles.subtitle}>
            Informe a carreira alvo e suas habilidades atuais. Nossa IA irá gerar uma trilha
            personalizada de skills para você dominar.
          </Text>
        </View>

        <Card>
          <Input
            label="Carreira desejada *"
            placeholder="Ex: Especialista em IA Generativa"
            value={carreiraDesejada}
            onChangeText={(text) => {
              setCarreiraDesejada(text);
              if (errors.carreiraDesejada) setErrors({ ...errors, carreiraDesejada: '' });
            }}
            error={errors.carreiraDesejada}
            editable={!isLoading}
          />

          <Input
            label="Hard Skills que você já domina"
            placeholder="Ex: Python, Machine Learning, SQL (separadas por vírgula)"
            value={hardSkills}
            onChangeText={setHardSkills}
            editable={!isLoading}
            multiline
          />

          <Input
            label="Soft Skills em destaque"
            placeholder="Ex: Liderança, Comunicação (separadas por vírgula)"
            value={softSkills}
            onChangeText={setSoftSkills}
            editable={!isLoading}
            multiline
          />

          <Button
            title="Gerar Roadmap Personalizado"
            onPress={handleGerar}
            isLoading={isLoading}
            disabled={isLoading}
            containerStyle={styles.gerarButton}
          />

          <Button
            title="Voltar"
            variant="outline"
            onPress={() => navigation.goBack()}
            disabled={isLoading}
          />
        </Card>

        {/* Dica de uso */}
        <Card style={styles.tipCard}>
          <Text style={styles.tipTitle}>💡 Dica</Text>
          <Text style={styles.tipText}>
            Quanto mais específico você for sobre suas habilidades atuais, melhor será a trilha
            personalizada gerada pela IA.
          </Text>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
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
  },
  scrollContent: {
    flexGrow: 1,
    padding: isSmallDevice ? SPACING.base : SPACING.xl,
    paddingTop: isSmallDevice ? SPACING.xl : SPACING['3xl'],
    paddingBottom: 100, // Espaço para o tab bar não sobrepor o conteúdo
  },
  header: {
    marginBottom: isSmallDevice ? SPACING.base : SPACING.xl,
  },
  title: {
    fontSize: isSmallDevice ? TYPOGRAPHY.fontSize['2xl'] : TYPOGRAPHY.fontSize['3xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: isSmallDevice ? TYPOGRAPHY.fontSize.sm : TYPOGRAPHY.fontSize.base,
    color: COLORS.text.tertiary,
    lineHeight: 20,
  },
  gerarButton: {
    marginTop: SPACING.base,
    marginBottom: SPACING.md,
  },
  tipCard: {
    marginTop: SPACING.xl,
    backgroundColor: `${COLORS.brand.primary}15`,
  },
  tipTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  tipText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    lineHeight: 18,
  },
});

export default GeradorRoadmapScreen;
