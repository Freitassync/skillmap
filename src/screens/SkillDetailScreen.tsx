import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../hooks/useAuth';
import { useRoadmapSkills } from '../hooks/useRoadmap';
import RoadmapService from '../services/RoadmapService';
import { Card, ResourceCard, Button } from '../components';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants';
import { Alert } from '../utils/alert';
import type { IRoadmapSkill } from '../types/models';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;

type SkillDetailScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'SkillDetail'
>;

type SkillDetailScreenRouteProp = RouteProp<RootStackParamList, 'SkillDetail'>;

const SkillDetailScreen: React.FC = () => {
  const navigation = useNavigation<SkillDetailScreenNavigationProp>();
  const route = useRoute<SkillDetailScreenRouteProp>();
  const { skillId, roadmapId } = route.params;

  const { user, refreshUser } = useAuth();
  const { marcarConcluida, atualizarMilestone } = useRoadmapSkills();

  const [skill, setSkill] = useState<IRoadmapSkill | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadSkillData();
  }, [skillId, roadmapId]);

  const loadSkillData = async () => {
    try {
      setIsLoading(true);
      const skillData = await RoadmapService.carregarRoadmapSkillById(roadmapId, skillId);
      if (skillData) {
        setSkill(skillData);
      } else {
        Alert.alert('Erro', 'Skill não encontrada.');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Erro ao carregar dados da skill:', error);
      Alert.alert('Erro', 'Não foi possível carregar os detalhes da skill.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMilestoneToggle = async (milestoneLevel: number, currentStatus: boolean) => {
    if (!skill) return;

    setIsUpdating(true);
    try {
      const success = await atualizarMilestone(
        roadmapId,
        skillId,
        milestoneLevel,
        !currentStatus
      );

      if (success) {
        await loadSkillData();
      } else {
        Alert.alert('Erro', 'Não foi possível atualizar o milestone.');
      }
    } catch (error) {
      console.error('Erro ao atualizar milestone:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao atualizar o milestone.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCompleteSkill = async () => {
    if (!skill || !user) return;

    Alert.alert(
      'Confirmar conclusão',
      'Tem certeza que deseja marcar esta skill como concluída? Você ganhará 50 XP!',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Concluir',
          onPress: async () => {
            setIsUpdating(true);
            try {
              const success = await marcarConcluida(roadmapId, skillId);

              if (success) {
                Alert.alert('Parabéns!', 'Skill concluída! Você ganhou 50 XP!');
                await refreshUser();
                navigation.goBack();
              } else {
                Alert.alert('Erro', 'Não foi possível concluir a skill.');
              }
            } catch (error) {
              console.error('Erro ao marcar skill como concluída:', error);
              Alert.alert('Erro', 'Não foi possível concluir a skill.');
            } finally {
              setIsUpdating(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.brand.primary} />
          <Text style={styles.loadingText}>Carregando detalhes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!skill) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Skill não encontrada</Text>
          <Button title="Voltar" variant="primary" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  const isCompleted = skill.status === 'concluido';
  const completedMilestones = skill.milestones?.filter((m) => m.completed).length || 0;
  const totalMilestones = skill.milestones?.length || 0;
  const resources = skill.resources || [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Voltar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <Card style={styles.headerCard}>
            <View style={styles.titleRow}>
              <Text style={styles.skillName}>{skill.skill.name}</Text>
              <View
                style={[
                  styles.typeBadge,
                  skill.skill.type === 'hard' ? styles.typeBadgeHard : styles.typeBadgeSoft,
                ]}
              >
                <Text style={styles.typeBadgeText}>{skill.skill.type.toUpperCase()}</Text>
              </View>
            </View>

            {isCompleted && skill.conclusion_date && (
              <View style={styles.completedBanner}>
                <Text style={styles.completedBannerText}>
                  ✓ Concluída em {new Date(skill.conclusion_date).toLocaleDateString('pt-BR')}
                </Text>
              </View>
            )}

            <Text style={styles.description}>{skill.skill.description}</Text>
            
          </Card>

          {skill.learning_objectives && (
            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>🎯 Objetivos de Aprendizado</Text>
              <Text style={styles.sectionText}>{skill.learning_objectives}</Text>
            </Card>
          )}

          {skill.prerequisites && skill.prerequisites.length > 0 && (
            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>📋 Pré-requisitos</Text>
              <View style={styles.prerequisitesList}>
                {skill.prerequisites.map((prereq, idx) => (
                  <View key={prereq.id || idx} style={styles.prerequisiteItem}>
                    <Text style={styles.prerequisiteText}>• {prereq.name}</Text>
                  </View>
                ))}
              </View>
            </Card>
          )}

          {skill.milestones && skill.milestones.length > 0 && (
            <Card style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>📍 Marcos de Progresso</Text>
                <Text style={styles.progressText}>
                  {completedMilestones}/{totalMilestones}
                </Text>
              </View>

              {skill.milestones.map((milestone, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.milestoneCard}
                  onPress={() => handleMilestoneToggle(milestone.level, milestone.completed)}
                  disabled={isUpdating || isCompleted}
                  activeOpacity={0.7}
                >
                  <View style={styles.milestoneHeader}>
                    <View style={styles.milestoneCheckbox}>
                      <View
                        style={[
                          styles.checkbox,
                          milestone.completed && styles.checkboxChecked,
                        ]}
                      >
                        {milestone.completed && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                    </View>

                    <View style={styles.milestoneContent}>
                      <Text
                        style={[
                          styles.milestoneTitle,
                          milestone.completed && styles.milestoneTitleCompleted,
                        ]}
                      >
                        Nível {milestone.level}: {milestone.title}
                      </Text>

                      <View style={styles.objectives}>
                        {milestone.objectives.map((obj, objIdx) => (
                          <Text
                            key={objIdx}
                            style={[
                              styles.objectiveText,
                              milestone.completed && styles.objectiveTextCompleted,
                            ]}
                          >
                            • {obj}
                          </Text>
                        ))}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </Card>
          )}

          {resources.length > 0 && (
            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>📚 Recursos de Aprendizado</Text>
              <Text style={styles.sectionSubtitle}>
                Toque nos recursos para abrir no navegador
              </Text>

              <View style={styles.resourcesGrid}>
                {resources.map((resource) => (
                  <ResourceCard
                    key={resource.id}
                    type={resource.type}
                    title={resource.title}
                    url={resource.url}
                    platform={resource.platform}
                    is_free={resource.is_free}
                  />
                ))}
              </View>
            </Card>
          )}

          {!isCompleted && (
            <View style={styles.completeSection}>
              <Button
                title="✓ Marcar Skill como Concluída"
                variant="primary"
                onPress={handleCompleteSkill}
                isLoading={isUpdating}
                fullWidth
              />
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
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
    backgroundColor: COLORS.bg.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg.primary,
  },
  loadingText: {
    marginTop: SPACING.base,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xl,
  },
  header: {
    padding: isSmallDevice ? SPACING.lg : SPACING.xl,
    paddingTop: isSmallDevice ? SPACING.md : SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bg.secondary,
  },
  backButton: {
    paddingVertical: SPACING.xs,
  },
  backButtonText: {
    color: COLORS.brand.primary,
    fontSize: isSmallDevice ? TYPOGRAPHY.fontSize.sm : TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: isSmallDevice ? SPACING.lg : SPACING.xl,
  },
  headerCard: {
    marginBottom: SPACING.base,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  skillName: {
    flex: 1,
    fontSize: isSmallDevice ? TYPOGRAPHY.fontSize.xl : TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginRight: SPACING.sm,
  },
  typeBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  typeBadgeHard: {
    backgroundColor: `${COLORS.brand.secondary}33`,
  },
  typeBadgeSoft: {
    backgroundColor: `${COLORS.brand.accent}33`,
  },
  typeBadgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  completedBanner: {
    backgroundColor: `${COLORS.status.success}15`,
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  completedBannerText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.status.success,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  description: {
    fontSize: isSmallDevice ? TYPOGRAPHY.fontSize.sm : TYPOGRAPHY.fontSize.base,
    color: COLORS.text.secondary,
    lineHeight: isSmallDevice ? 18 : 20,
    marginBottom: SPACING.sm,
  },
  estimatedTime: {
    marginTop: SPACING.xs,
  },
  estimatedTimeText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.tertiary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  section: {
    marginBottom: SPACING.base,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: isSmallDevice ? TYPOGRAPHY.fontSize.base : TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.tertiary,
    marginBottom: SPACING.sm,
  },
  sectionText: {
    fontSize: isSmallDevice ? TYPOGRAPHY.fontSize.sm : TYPOGRAPHY.fontSize.base,
    color: COLORS.text.secondary,
    lineHeight: isSmallDevice ? 18 : 20,
  },
  prerequisitesList: {
    marginTop: SPACING.xs,
  },
  prerequisiteItem: {
    marginBottom: SPACING.xs,
  },
  prerequisiteText: {
    fontSize: isSmallDevice ? TYPOGRAPHY.fontSize.sm : TYPOGRAPHY.fontSize.base,
    color: COLORS.text.secondary,
    lineHeight: isSmallDevice ? 18 : 20,
  },
  progressText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.brand.primary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  milestoneCard: {
    marginBottom: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bg.secondary,
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  milestoneCheckbox: {
    marginRight: SPACING.sm,
    paddingTop: 2,
  },
  checkbox: {
    width: isSmallDevice ? 20 : 24,
    height: isSmallDevice ? 20 : 24,
    borderRadius: RADIUS.sm,
    borderWidth: 2,
    borderColor: COLORS.text.muted,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg.primary,
  },
  checkboxChecked: {
    backgroundColor: COLORS.status.success,
    borderColor: COLORS.status.success,
  },
  checkmark: {
    color: COLORS.bg.primary,
    fontSize: isSmallDevice ? TYPOGRAPHY.fontSize.sm : TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: isSmallDevice ? TYPOGRAPHY.fontSize.sm : TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  milestoneTitleCompleted: {
    color: COLORS.status.success,
    textDecorationLine: 'line-through',
  },
  objectives: {
    paddingLeft: SPACING.sm,
  },
  objectiveText: {
    fontSize: isSmallDevice ? TYPOGRAPHY.fontSize.xs : TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    lineHeight: isSmallDevice ? 16 : 18,
    marginBottom: 2,
  },
  objectiveTextCompleted: {
    color: COLORS.text.tertiary,
  },
  resourcesGrid: {
    gap: SPACING.sm,
  },
  completeSection: {
    marginTop: SPACING.base,
    marginBottom: SPACING.base,
  },
  bottomSpacer: {
    height: SPACING['3xl'],
  },
});

export default SkillDetailScreen;
