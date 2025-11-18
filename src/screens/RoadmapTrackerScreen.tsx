import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../hooks/useAuth';
import { useRoadmap, useRoadmapSkills } from '../hooks/useRoadmap';
import { Card } from '../components';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, MESSAGES } from '../constants';
import { Alert } from '../utils/alert';
import type { IRoadmap, IRoadmapSkill } from '../types/models';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;

export type RoadmapTrackerScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'RoadmapTracker'
>;

const RoadmapTrackerScreen: React.FC = () => {
  const navigation = useNavigation<RoadmapTrackerScreenNavigationProp>();
  const { user } = useAuth();
  const { roadmaps, isLoading, carregarRoadmaps, deletarRoadmap } = useRoadmap();
  const { skills, carregarSkills } = useRoadmapSkills();

  const [roadmapSelecionado, setRoadmapSelecionado] = useState<IRoadmap | null>(null);

  useFocusEffect(
    useCallback(() => {
      console.log('🔄 RoadmapTrackerScreen ganhou foco, recarregando...');
      if (user) {
        carregarRoadmaps(user.id);
        if (roadmapSelecionado) {
          carregarSkills(roadmapSelecionado.id);
        }
      }
    }, [user, roadmapSelecionado, carregarRoadmaps, carregarSkills])
  );

  useEffect(() => {
    if (roadmapSelecionado) {
      carregarSkills(roadmapSelecionado.id);
    }
  }, [roadmapSelecionado, carregarSkills]);

  const handleDelete = (roadmapId: string) => {
    Alert.alert(
      'Confirmar exclusão',
      'Tem certeza que deseja deletar este roadmap? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            const sucesso = await deletarRoadmap(roadmapId);
            if (sucesso) {
              if (roadmapSelecionado?.id === roadmapId) {
                setRoadmapSelecionado(null);
              }
              Alert.alert('Sucesso', 'Roadmap deletado com sucesso!');
            }
          },
        },
      ]
    );
  };

  const renderRoadmapItem = ({ item }: { item: IRoadmap }) => {
    const isSelected = roadmapSelecionado?.id === item.id;

    return (
      <TouchableOpacity onPress={() => setRoadmapSelecionado(item)}>
        <Card style={isSelected ? styles.roadmapItemSelected : styles.roadmapItem}>
          <View style={styles.roadmapItemHeader}>
            <View style={styles.roadmapItemInfo}>
              <Text style={styles.roadmapItemTitle}>{item.title}</Text>
              <Text style={styles.roadmapItemProgress}>{item.percentualProgress}% completo</Text>
            </View>

            <TouchableOpacity
              onPress={() => handleDelete(item.id)}
              style={styles.deleteButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.deleteButtonText}>x</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${item.percentualProgress}%` }]} />
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderSkillItem = ({ item }: { item: IRoadmapSkill }) => {
    const is_concluded = item.status === 'concluido';
    const completedMilestones = item.milestones?.filter((m) => m.completed).length || 0;
    const totalMilestones = item.milestones?.length || 0;

    return (
      <TouchableOpacity
        onPress={() =>
          navigation.navigate('SkillDetail', {
            skillId: item.id,
            roadmapId: roadmapSelecionado!.id,
          })
        }
        activeOpacity={0.7}
      >
        <Card style={is_concluded ? styles.skillItemConcluida : styles.skillItem}>
          <View style={styles.skillHeader}>
            <View style={styles.skillInfo}>
              <Text style={[styles.skillTitle, is_concluded && styles.skillTitleConcluida]}>
                {item.skill.name}
              </Text>
              <View style={styles.skillBadges}>
                <Text
                  style={[
                    styles.skillTypeText,
                    item.skill.type === 'hard' ? styles.skillTypeHard : styles.skillTypeSoft,
                  ]}
                >
                  {item.skill.type.toUpperCase()} SKILL
                </Text>
              </View>
            </View>

            <View style={styles.expandIndicator}>
              <Text style={styles.expandIndicatorText}>→</Text>
            </View>
          </View>

          <Text style={[styles.skillDescription, is_concluded && styles.skillDescriptionConcluida]}>
            {item.skill.description}
          </Text>

          {totalMilestones > 0 && (
            <View style={styles.progressInfo}>
              <Text style={styles.progressInfoText}>
                📍 {completedMilestones}/{totalMilestones} marcos concluídos
              </Text>
            </View>
          )}

          {is_concluded && item.conclusion_date && (
            <Text style={styles.conclusionDate}>
              Concluído em {new Date(item.conclusion_date).toLocaleDateString('pt-BR')}
            </Text>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.brand.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Meus Roadmaps</Text>
        </View>

        {roadmaps.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{MESSAGES.roadmap.nenhumRoadmap}</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('GeradorRoadmap')}
              style={styles.emptyStateButton}
            >
              <Text style={styles.emptyStateButtonText}>Criar Primeiro Roadmap</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.content}>
            <View style={styles.roadmapList}>
              <Text style={styles.sectionTitle}>Selecione um roadmap</Text>
              <FlatList
                data={roadmaps}
                renderItem={renderRoadmapItem}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.roadmapListContent}
              />
            </View>

            {roadmapSelecionado && (
              <View style={styles.skillsSection}>
                <View style={styles.skillsHeader}>
                  <View style={styles.skillsTitleContainer}>
                    <Text style={styles.sectionTitle}>Skills para dominar</Text>
                    <Text style={styles.sectionSubtitle}>
                      Toque para ver detalhes e recursos de aprendizado
                    </Text>
                  </View>
                </View>

                <FlatList
                  data={skills}
                  renderItem={renderSkillItem}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.skillsList}
                  ListEmptyComponent={
                    <Text style={styles.emptySkillsText}>Carregando skills...</Text>
                  }
                />
              </View>
            )}
          </View>
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
    backgroundColor: COLORS.bg.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg.primary,
  },
  header: {
    padding: isSmallDevice ? SPACING.lg : SPACING.xl,
    paddingTop: isSmallDevice ? SPACING.md : SPACING['3xl'],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bg.secondary,
  },
  backButton: {
    marginBottom: SPACING.md,
  },
  backButtonText: {
    color: COLORS.brand.primary,
    fontSize: isSmallDevice ? TYPOGRAPHY.fontSize.sm : TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  title: {
    fontSize: isSmallDevice ? TYPOGRAPHY.fontSize['2xl'] : TYPOGRAPHY.fontSize['3xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  content: {
    flex: 1,
  },
  roadmapList: {
    paddingVertical: SPACING.base,
  },
  roadmapListContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: 25,
    gap: SPACING.md,
  },
  sectionTitle: {
    fontSize: isSmallDevice ? TYPOGRAPHY.fontSize.base : TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
    paddingHorizontal: isSmallDevice ? SPACING.lg : SPACING.xl,
  },
  sectionSubtitle: {
    fontSize: isSmallDevice ? TYPOGRAPHY.fontSize.xs : TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.tertiary,
    marginBottom: SPACING.base,
    paddingHorizontal: isSmallDevice ? SPACING.lg : SPACING.xl,
  },
  roadmapItem: {
    width: isSmallDevice ? 240 : 280,
  },
  roadmapItemSelected: {
    width: isSmallDevice ? 240 : 280,
    borderWidth: 2,
    borderColor: COLORS.brand.primary,
  },
  roadmapItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  roadmapItemInfo: {
    flex: 1,
  },
  roadmapItemTitle: {
    fontSize: isSmallDevice ? TYPOGRAPHY.fontSize.sm : TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  roadmapItemProgress: {
    fontSize: isSmallDevice ? TYPOGRAPHY.fontSize.xs : TYPOGRAPHY.fontSize.sm,
    color: COLORS.brand.primary,
  },
  deleteButton: {
    width: isSmallDevice ? 20 : 24,
    height: isSmallDevice ? 20 : 24,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.status.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: COLORS.text.primary,
    fontSize: 14,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    paddingBottom: SPACING.sm,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: COLORS.bg.secondary,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.brand.primary,
    borderRadius: RADIUS.full,
  },
  skillsSection: {
    flex: 1,
    paddingTop: SPACING.base,
  },
  skillsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.base,
    paddingHorizontal: isSmallDevice ? SPACING.lg : SPACING.xl,
  },
  skillsTitleContainer: {
    flex: 1,
    marginRight: SPACING.md,
  },
  skillsList: {
    paddingHorizontal: isSmallDevice ? SPACING.lg : SPACING.xl,
    paddingBottom: isSmallDevice ? SPACING.lg : SPACING.xl,
  },
  skillItem: {
    marginBottom: isSmallDevice ? SPACING.sm : SPACING.md,
  },
  skillItemConcluida: {
    marginBottom: isSmallDevice ? SPACING.sm : SPACING.md,
    opacity: 0.7,
    backgroundColor: COLORS.bg.secondary,
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  skillInfo: {
    flex: 1,
  },
  skillBadges: {
    flexDirection: 'row',
    gap: SPACING.xs,
    flexWrap: 'wrap',
  },
  skillTitle: {
    fontSize: isSmallDevice ? TYPOGRAPHY.fontSize.sm : TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  skillTitleConcluida: {
    textDecorationLine: 'line-through',
    color: COLORS.text.tertiary,
  },
  skillTypeText: {
    fontSize: isSmallDevice ? TYPOGRAPHY.fontSize.xs : TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    paddingHorizontal: isSmallDevice ? SPACING.xs : SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
  },
  skillTypeHard: {
    backgroundColor: `${COLORS.brand.secondary}33`,
    color: COLORS.brand.secondary,
  },
  skillTypeSoft: {
    backgroundColor: `${COLORS.brand.accent}33`,
    color: COLORS.brand.accent,
  },
  skillDescription: {
    fontSize: isSmallDevice ? TYPOGRAPHY.fontSize.xs : TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    lineHeight: isSmallDevice ? 16 : 18,
    marginBottom: SPACING.xs,
  },
  skillDescriptionConcluida: {
    color: COLORS.text.muted,
  },
  progressInfo: {
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  progressInfoText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.brand.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  conclusionDate: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.status.success,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: isSmallDevice ? SPACING.lg : SPACING.xl,
  },
  emptyStateText: {
    fontSize: isSmallDevice ? TYPOGRAPHY.fontSize.base : TYPOGRAPHY.fontSize.lg,
    color: COLORS.text.tertiary,
    textAlign: 'center',
    marginBottom: isSmallDevice ? SPACING.lg : SPACING.xl,
  },
  emptyStateButton: {
    backgroundColor: COLORS.brand.primary,
    paddingHorizontal: isSmallDevice ? SPACING.lg : SPACING.xl,
    paddingVertical: isSmallDevice ? SPACING.sm : SPACING.base,
    borderRadius: RADIUS.md,
  },
  emptyStateButtonText: {
    color: COLORS.bg.primary,
    fontSize: isSmallDevice ? TYPOGRAPHY.fontSize.sm : TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  emptySkillsText: {
    fontSize: isSmallDevice ? TYPOGRAPHY.fontSize.sm : TYPOGRAPHY.fontSize.base,
    color: COLORS.text.tertiary,
    textAlign: 'center',
    marginTop: isSmallDevice ? SPACING.lg : SPACING.xl,
  },
  expandIndicator: {
    width: isSmallDevice ? 20 : 24,
    height: isSmallDevice ? 20 : 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandIndicatorText: {
    fontSize: isSmallDevice ? TYPOGRAPHY.fontSize.sm : TYPOGRAPHY.fontSize.base,
    color: COLORS.brand.primary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
});

export default RoadmapTrackerScreen;
