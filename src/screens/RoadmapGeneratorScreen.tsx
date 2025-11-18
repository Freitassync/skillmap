import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../hooks/useAuth';
import { Button, Input, Card } from '../components';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, MESSAGES } from '../constants';
import ApiClient from '../services/ApiClient';
import SkillService from '../services/SkillService';
import RoadmapService from '../services/RoadmapService';
import { Alert } from '../utils/alert';
import type { FormErrors, ISkill } from '../types/models';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;

export type GeradorRoadmapScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'GeradorRoadmap'
>;

const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Iniciante (0-2 anos)' },
  { value: 'intermediate', label: 'Intermediário (2-5 anos)' },
  { value: 'advanced', label: 'Avançado (5+ anos)' },
];

const GeradorRoadmapScreen: React.FC = () => {
  const navigation = useNavigation<GeradorRoadmapScreenNavigationProp>();
  const { user } = useAuth();

  const [carreiraDesejada, setCarreiraDesejada] = useState('');
  const [experience, setNivelExperiencia] = useState('beginner');
  const [allSkills, setAllSkills] = useState<ISkill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
  const [isLoadingSkills, setIsLoadingSkills] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isGeneratingComplete, setIsGeneratingComplete] = useState(false);
  const [generationProgress, setGenerationProgress] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    try {
      setIsLoadingSkills(true);
      const skills = await SkillService.getAllSkills();
      setAllSkills(skills);
    } catch (error) {
      console.error('Erro ao carregar skills:', error);
      Alert.alert('Erro', 'Não foi possível carregar as skills disponíveis');
    } finally {
      setIsLoadingSkills(false);
    }
  };

  const toggleSkill = (skillId: string) => {
    const newSelected = new Set(selectedSkills);
    if (newSelected.has(skillId)) {
      newSelected.delete(skillId);
    } else {
      newSelected.add(skillId);
    }
    setSelectedSkills(newSelected);
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleGenerateWithAI = async () => {
    const newErrors: FormErrors = {};

    if (carreiraDesejada.trim().length < 3) {
      newErrors.carreiraDesejada = 'Nome da carreira deve ter ao menos 3 caracteres';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!user) {
      Alert.alert('Erro', 'Você precisa estar logado');
      return;
    }

    setErrors({});
    setIsGenerating(true);

    try {
      const currentSkillNames = allSkills
        .filter((s) => selectedSkills.has(s.id))
        .map((s) => s.name);

      const response = await ApiClient.post('/roadmaps/generate', {
        career_goal: carreiraDesejada,
        experience: experience,
        current_skills: currentSkillNames,
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Erro ao gerar sugestões');
      }

      const { suggestions } = response.data;

      if (suggestions.length === 0) {
        Alert.alert('Atenção', 'Não foi possível gerar sugestões para essa carreira.');
        return;
      }

      const suggestedSkillIds = suggestions.map((s: any) => s.skill_id);
      setSelectedSkills(new Set(suggestedSkillIds));

    } catch (error: any) {
      console.error('Erro ao gerar sugestões:', error);
      Alert.alert('Erro', error.message || 'Erro ao gerar sugestões com IA');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateCompleteRoadmap = async () => {
    const newErrors: FormErrors = {};

    if (carreiraDesejada.trim().length < 3) {
      newErrors.carreiraDesejada = 'Nome da carreira deve ter ao menos 3 caracteres';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!user) {
      Alert.alert('Erro', 'Você precisa estar logado');
      return;
    }

    setErrors({});
    setIsGeneratingComplete(true);
    setGenerationProgress('Analisando objetivo de carreira...');

    try {
      const currentSkillIds = Array.from(selectedSkills);

      setGenerationProgress('Selecionando skills essenciais...');

      const result = await RoadmapService.generateCompleteRoadmap(
        carreiraDesejada,
        experience,
        currentSkillIds
      );

      if (!result.success) {
        throw new Error(result.error || 'Erro ao gerar roadmap');
      }

      setGenerationProgress('');

      const skillCount = result.roadmap?.skills?.length || 0;
      const resourceCount = result.roadmap?.skills?.reduce(
        (acc: number, skill: any) => acc + (skill.resources?.length || 0),
        0
      ) || 0;

      Alert.alert(
        'Roadmap Gerado com Sucesso!',
        `Criamos uma trilha personalizada com ${skillCount} skills e ${resourceCount} recursos de aprendizado. Acesse "Meu Roadmap" para começar!`,
        [
          {
            text: 'Ver Agora',
            onPress: () => navigation.navigate('RoadmapTracker'),
          },
          {
            text: 'OK',
          },
        ]
      );


      setCarreiraDesejada('');
      setNivelExperiencia('beginner');
      setSelectedSkills(new Set());
    } catch (error: any) {
      console.error('Erro ao gerar roadmap completo:', error);
      Alert.alert('Erro', error.message || 'Erro ao gerar roadmap completo com IA');
    } finally {
      setIsGeneratingComplete(false);
      setGenerationProgress('');
    }
  };

  const handleCreate = async () => {
    const newErrors: FormErrors = {};

    if (carreiraDesejada.trim().length < 3) {
      newErrors.carreiraDesejada = 'Nome da carreira deve ter ao menos 3 caracteres';
    }

    if (selectedSkills.size === 0) {
      newErrors.skills = 'Selecione pelo menos uma skill';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!user) {
      Alert.alert('Erro', 'Você precisa estar logado');
      return;
    }

    setErrors({});
    setIsCreating(true);

    try {
      const title = `Trilha: ${carreiraDesejada}`;

      const response = await ApiClient.post('/roadmaps', {
        title,
        career_goal: carreiraDesejada,
        experience: experience,
        skills: Array.from(selectedSkills),
      });

      if (!response.success) {
        throw new Error(response.error || 'Erro ao criar roadmap');
      }

      Alert.alert('Sucesso!', MESSAGES.roadmap.criadoSuccess, [
        {
          text: 'Ver Roadmap',
          onPress: () => navigation.navigate('RoadmapTracker'),
        },
        {
          text: 'Criar Outro',
          onPress: () => {
            setCarreiraDesejada('');
            setNivelExperiencia('beginner');
            setSelectedSkills(new Set());
          },
        },
      ]);
    } catch (error: any) {
      console.error('Erro ao criar roadmap:', error);
      Alert.alert('Erro', error.message || 'Erro ao criar roadmap');
    } finally {
      setIsCreating(false);
    }
  };

  const groupedSkills = allSkills.reduce((acc, skill) => {
    const key = `${skill.type}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(skill);
    return acc;
  }, {} as Record<string, ISkill[]>);

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
            <Text style={styles.title}>Gerador de Roadmap</Text>
            <Text style={styles.subtitle}>
              Informe a carreira alvo e suas habilidades atuais. Nossa IA irá gerar uma trilha personalizada de skills para você dominar
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
              editable={!isCreating && !isGenerating}
            />

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Nível de Experiência *</Text>
              <View style={styles.experienceLevelContainer}>
                {EXPERIENCE_LEVELS.map((level) => (
                  <TouchableOpacity
                    key={level.value}
                    style={[
                      styles.levelButton,
                      experience === level.value && styles.levelButtonSelected,
                    ]}
                    onPress={() => setNivelExperiencia(level.value)}
                    disabled={isCreating || isGenerating}
                  >
                    <Text
                      style={[
                        styles.levelButtonText,
                        experience === level.value && styles.levelButtonTextSelected,
                      ]}
                    >
                      {level.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Button
              title="Gerar Sugestões com IA"
              onPress={handleGenerateWithAI}
              isLoading={isGenerating}
              disabled={isCreating || isGenerating || isGeneratingComplete || !carreiraDesejada.trim()}
              containerStyle={styles.aiButton}
            />

            {generationProgress && (
              <View style={styles.progressContainer}>
                <ActivityIndicator size="small" color={COLORS.brand.primary} />
                <Text style={styles.progressText}>{generationProgress}</Text>
              </View>
            )}

            <View style={styles.divider} />

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Skills Selecionadas para Treinamento ({selectedSkills.size})
                {errors.skills && <Text style={styles.errorText}> - {errors.skills}</Text>}
              </Text>

              {isLoadingSkills ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={COLORS.brand.primary} />
                  <Text style={styles.loadingText}>Carregando skills...</Text>
                </View>
              ) : (
                <View style={styles.skillsContainer}>
                  {Object.entries(groupedSkills).map(([type, skills]) => {
                    const isExpanded = expandedCategories.has(type);
                    const selectedCount = skills.filter((s) => selectedSkills.has(s.id)).length;

                    return (
                      <View key={type} style={styles.categoryContainer}>
                        <TouchableOpacity
                          style={styles.categoryHeader}
                          onPress={() => toggleCategory(type)}
                        >
                          <Text style={styles.categoryTitle}>
                            {type === 'soft' ? 'Soft Skills' : 'Hard Skills'}{' '}
                            {selectedCount > 0 && `(${selectedCount})`}
                          </Text>
                          <Text style={styles.categoryIcon}>{isExpanded ? '▼' : '▶'}</Text>
                        </TouchableOpacity>

                        {isExpanded && (
                          <View style={styles.skillsList}>
                            {skills.map((skill) => {
                              const isSelected = selectedSkills.has(skill.id);
                              return (
                                <TouchableOpacity
                                  key={skill.id}
                                  style={[
                                    styles.skillItem,
                                    isSelected && styles.skillItemSelected,
                                  ]}
                                  onPress={() => toggleSkill(skill.id)}
                                  disabled={isCreating || isGenerating}
                                >
                                  <View style={styles.skillCheckbox}>
                                    {isSelected && <View style={styles.skillCheckboxChecked} />}
                                  </View>
                                  <View style={styles.skillContent}>
                                    <Text style={styles.skillName}>{skill.name}</Text>
                                    {skill.category && (
                                      <Text style={styles.skillCategory}>{skill.category}</Text>
                                    )}
                                  </View>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            <Button
              title="Gerar Roadmap Completo com IA"
              onPress={handleGenerateCompleteRoadmap}
              isLoading={isGeneratingComplete}
              disabled={isCreating || isGenerating || isGeneratingComplete || !carreiraDesejada.trim() || selectedSkills.size === 0}
              containerStyle={styles.completeButton}
            />


            <Button
              title="Voltar"
              variant="outline"
              onPress={() => navigation.goBack()}
              disabled={isCreating || isGenerating}
            />
          </Card>

          <Card style={styles.tipCard}>
            <Text style={styles.tipTitle}>💡 Dica</Text>
            <Text style={styles.tipText}>
              Use o botão "Gerar Sugestões com IA" para receber recomendações personalizadas de
              skills baseadas no seu objetivo de carreira e nível de experiência.
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
    paddingBottom: 100,
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
  fieldContainer: {
    marginBottom: SPACING.base,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  errorText: {
    color: COLORS.status.error,
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
  experienceLevelContainer: {
    gap: SPACING.sm,
  },
  levelButton: {
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.base,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.bg.secondary,
    backgroundColor: COLORS.bg.secondary,
  },
  levelButtonSelected: {
    borderColor: COLORS.brand.primary,
    backgroundColor: `${COLORS.brand.primary}15`,
  },
  levelButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  levelButtonTextSelected: {
    color: COLORS.brand.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  aiButton: {
    marginTop: SPACING.base,
    marginBottom: SPACING.sm,
  },
  completeButton: {
    marginBottom: SPACING.base,
    backgroundColor: COLORS.brand.primary,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.base,
    gap: SPACING.sm,
    backgroundColor: `${COLORS.brand.primary}10`,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.base,
  },
  progressText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.bg.secondary,
    marginVertical: SPACING.base,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.base,
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
  },
  skillsContainer: {
    gap: SPACING.sm,
  },
  categoryContainer: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.bg.secondary,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.base,
    backgroundColor: COLORS.bg.secondary,
  },
  categoryTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
  },
  categoryIcon: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.tertiary,
  },
  skillsList: {
    padding: SPACING.sm,
    gap: SPACING.xs,
  },
  skillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.bg.secondary,
    gap: SPACING.sm,
  },
  skillItemSelected: {
    borderColor: COLORS.brand.primary,
    backgroundColor: `${COLORS.brand.primary}10`,
  },
  skillCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.text.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skillCheckboxChecked: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: COLORS.brand.primary,
  },
  skillContent: {
    flex: 1,
  },
  skillName: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  skillCategory: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.tertiary,
    marginTop: 2,
  },
  createButton: {
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
