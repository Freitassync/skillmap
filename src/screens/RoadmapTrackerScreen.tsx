import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../hooks/useAuth';
import { useRoadmap, useRoadmapSkills } from '../hooks/useRoadmap';
import { Card } from '../components';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, MESSAGES, GAMIFICATION } from '../constants';
import type { IRoadmap, IRoadmapSkill } from '../types/models';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;

export type RoadmapTrackerScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'RoadmapTracker'
>;

const RoadmapTrackerScreen: React.FC = () => {
  const navigation = useNavigation<RoadmapTrackerScreenNavigationProp>();
  const { usuario, atualizarXP } = useAuth();
  const { roadmaps, isLoading, carregarRoadmaps, deletarRoadmap } = useRoadmap();
  const { skills, carregarSkills, marcarConcluida } = useRoadmapSkills();

  const [roadmapSelecionado, setRoadmapSelecionado] = useState<IRoadmap | null>(null);

  // Recarrega roadmaps quando a tela ganha foco (ex: após criar novo roadmap)
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 RoadmapTrackerScreen ganhou foco, recarregando...');
      if (usuario) {
        carregarRoadmaps(usuario.id);
      }
    }, [usuario, carregarRoadmaps])
  );

  useEffect(() => {
    if (roadmapSelecionado) {
      carregarSkills(roadmapSelecionado.id);
    }
  }, [roadmapSelecionado, carregarSkills]);

  const handleMarcarConcluida = async (skillId: string) => {
    if (!roadmapSelecionado || !usuario) return;

    const xpGanho = await marcarConcluida(roadmapSelecionado.id, skillId);

    if (xpGanho > 0) {
      const novoXP = usuario.nivel_xp + xpGanho;
      await atualizarXP(novoXP);
      Alert.alert('Parabéns!', `Você ganhou ${xpGanho} XP!`);

      // Recarrega roadmaps para atualizar progresso
      carregarRoadmaps(usuario.id);
    }
  };

  const handleDeletar = (roadmapId: string) => {
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
              <Text style={styles.roadmapItemTitle}>{item.nome_carreira}</Text>
              <Text style={styles.roadmapItemProgress}>{item.progresso_percentual}% completo</Text>
            </View>

            <TouchableOpacity
              onPress={() => handleDeletar(item.id)}
              style={styles.deleteButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.deleteButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${item.progresso_percentual}%` }]} />
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderSkillItem = ({ item }: { item: IRoadmapSkill }) => {
    const concluida = item.status === 'concluido';

    return (
      <TouchableOpacity
        onPress={() => !concluida && handleMarcarConcluida(item.id)}
        disabled={concluida}
      >
        <Card style={concluida ? styles.skillItemConcluida : styles.skillItem}>
          <View style={styles.skillHeader}>
            <View style={styles.skillInfo}>
              <Text style={[styles.skillTitle, concluida && styles.skillTitleConcluida]}>
                {item.skill.nome}
              </Text>
              <Text
                style={[
                  styles.skillTypeText,
                  item.skill.tipo === 'hard' ? styles.skillTypeHard : styles.skillTypeSoft,
                ]}
              >
                {item.skill.tipo.toUpperCase()}
              </Text>
            </View>

            <View
              style={[
                styles.checkbox,
                concluida && styles.checkboxChecked,
              ]}
            >
              {concluida && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </View>

          <Text style={[styles.skillDescription, concluida && styles.skillDescriptionConcluida]}>
            {item.skill.descricao}
          </Text>

          {concluida && item.data_conclusao && (
            <Text style={styles.dataConclusao}>
              Concluído em {new Date(item.data_conclusao).toLocaleDateString('pt-BR')}
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
        {/* Header */}
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
            {/* Lista de Roadmaps */}
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

            {/* Skills do Roadmap Selecionado */}
            {roadmapSelecionado && (
              <View style={styles.skillsSection}>
                <Text style={styles.sectionTitle}>Skills para dominar</Text>
                <Text style={styles.sectionSubtitle}>
                  Toque em uma skill para marcá-la como concluída e ganhar XP
                </Text>

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
    paddingBottom: 100, // Espaço para o tab bar não sobrepor o conteúdo
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
    fontSize: isSmallDevice ? 16 : 18,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
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
  dataConclusao: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.status.success,
  },
  checkbox: {
    width: isSmallDevice ? 20 : 24,
    height: isSmallDevice ? 20 : 24,
    borderRadius: RADIUS.sm,
    borderWidth: 2,
    borderColor: COLORS.text.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.status.success,
    borderColor: COLORS.status.success,
  },
  checkmark: {
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
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
});

export default RoadmapTrackerScreen;
