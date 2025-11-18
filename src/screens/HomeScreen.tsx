import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../hooks/useAuth';
import { useRoadmap } from '../hooks/useRoadmap';
import { Button, Card } from '../components';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, GAMIFICATION } from '../constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;

export type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user, logout, refreshUser } = useAuth();
  const { roadmaps, isLoading, carregarRoadmaps } = useRoadmap();

  // Recarrega roadmaps e dados do usuário quando a tela ganha foco
  useFocusEffect(
    useCallback(() => {
      const onFocus = async () => {
        console.log('🏠 HomeScreen ganhou foco, recarregando dados...');
        const refreshedUser = await refreshUser();
        if (refreshedUser) {
          await carregarRoadmaps(refreshedUser.id);
        }
      };

      onFocus();
    }, [refreshUser, carregarRoadmaps])
  );

  const getNivelAtual = () => {
    if (!user) return null;

    for (let i = GAMIFICATION.niveis.length - 1; i >= 0; i--) {
      if (user.xp_level >= GAMIFICATION.niveis[i].xpNecessario) {
        return GAMIFICATION.niveis[i];
      }
    }

    return GAMIFICATION.niveis[0];
  };

  const getProximoNivel = () => {
    const levelAtual = getNivelAtual();
    if (!levelAtual) return null;

    const index = GAMIFICATION.niveis.findIndex((n) => n.level === levelAtual.level);
    return GAMIFICATION.niveis[index + 1] || null;
  };

  const calcularProgressoNivel = () => {
    const levelAtual = getNivelAtual();
    const proximoNivel = getProximoNivel();

    if (!user || !levelAtual || !proximoNivel) return 0;

    const xpNoNivelAtual = (user.current_xp || 0) - levelAtual.xpNecessario;
    const xpNecessarioParaProximo = proximoNivel.xpNecessario - levelAtual.xpNecessario;

    return Math.round((xpNoNivelAtual / xpNecessarioParaProximo) * 100);
  };

  const levelAtual = getNivelAtual();
  const proximoNivel = getProximoNivel();
  const progressoNivel = calcularProgressoNivel();

  const roadmapsAtivos = roadmaps.filter((r) => r.percentualProgress < 100);
  const roadmapsConcluidos = roadmaps.filter((r) => r.percentualProgress === 100);

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={COLORS.brand.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
      {/* Header com dados do usuário */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {user.name}!</Text>
          <Text style={styles.levelText}>
            {levelAtual?.title} • {user.current_xp} XP
          </Text>
        </View>

        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      {/* Card de Progresso */}
      <Card style={styles.progressCard}>
        <Text style={styles.cardTitle}>Progresso de Nível</Text>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progressoNivel}%` }]} />
        </View>
        {proximoNivel && (
          <Text style={styles.progressText}>
            {progressoNivel}% até {proximoNivel.title}
          </Text>
        )}
      </Card>

      {/* Estatísticas */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{roadmaps.length}</Text>
          <Text style={styles.statLabel}>Roadmaps</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{roadmapsAtivos.length}</Text>
          <Text style={styles.statLabel}>Em Andamento</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{roadmapsConcluidos.length}</Text>
          <Text style={styles.statLabel}>Concluídos</Text>
        </Card>
      </View>

      {/* Ações Rápidas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ações Rápidas</Text>

        <Button
          title="+ Gerar Novo Roadmap"
          onPress={() => navigation.navigate('GeradorRoadmap')}
          containerStyle={styles.actionButton}
        />

        <Button
          title="Ver Meus Roadmaps"
          variant="outline"
          onPress={() => navigation.navigate('RoadmapTracker')}
          disabled={roadmaps.length === 0}
        />
      </View>

      {/* Roadmaps Recentes */}
      {roadmaps.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Roadmaps Recentes</Text>

          {isLoading ? (
            <ActivityIndicator color={COLORS.brand.primary} />
          ) : (
            roadmaps.slice(0, 3).map((roadmap) => (
              <TouchableOpacity
                key={roadmap.id}
                onPress={() => navigation.navigate('RoadmapTracker')}
              >
                <Card style={styles.roadmapCard}>
                  <View style={styles.roadmapHeader}>
                    <Text style={styles.roadmapTitle}>{roadmap.title}</Text>
                    <Text style={styles.roadmapProgress}>{roadmap.percentualProgress}%</Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        { width: `${roadmap.percentualProgress}%` },
                      ]}
                    />
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: isSmallDevice ? SPACING.base : SPACING.xl,
    paddingBottom: 100, // Espaço para o tab bar não sobrepor o conteúdo
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: isSmallDevice ? SPACING.base : SPACING.xl,
  },
  greeting: {
    fontSize: isSmallDevice ? TYPOGRAPHY.fontSize['2xl'] : TYPOGRAPHY.fontSize['3xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  levelText: {
    fontSize: isSmallDevice ? TYPOGRAPHY.fontSize.sm : TYPOGRAPHY.fontSize.base,
    color: COLORS.brand.accent,
    marginTop: SPACING.xs,
  },
  logoutButton: {
    padding: SPACING.sm,
  },
  logoutText: {
    color: COLORS.status.error,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  progressCard: {
    marginBottom: SPACING.base,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: COLORS.bg.secondary,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.brand.primary,
    borderRadius: RADIUS.full,
  },
  progressText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.tertiary,
  },
  statsRow: {
    flexDirection: isSmallDevice ? 'column' : 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  statCard: {
    flex: isSmallDevice ? undefined : 1,
    alignItems: 'center',
    minWidth: isSmallDevice ? '100%' : undefined,
  },
  statValue: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.brand.primary,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.tertiary,
    textAlign: 'center',
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.base,
  },
  actionButton: {
    marginBottom: SPACING.md,
  },
  roadmapCard: {
    marginBottom: SPACING.md,
  },
  roadmapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  roadmapTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
    flex: 1,
  },
  roadmapProgress: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.brand.primary,
  },
});

export default HomeScreen;
