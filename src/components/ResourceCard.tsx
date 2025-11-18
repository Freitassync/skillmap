import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { COLORS, TYPOGRAPHY } from '../constants';
import { Alert } from '../utils/alert';

interface ResourceCardProps {
  type: 'course' | 'article' | 'exercise' | 'podcast' | 'video' | 'documentation' | 'tutorial' | 'project';
  title: string;
  url: string;
  platform?: string;
  is_free?: boolean;
}

/**
 * Card para exibir recursos de aprendizado (cursos, artigos, exercícios)
 */
const ResourceCard: React.FC<ResourceCardProps> = ({
  type,
  title,
  url,
  platform,
  is_free = true,
}) => {
  /**
   * Retorna ícone baseado no type de recurso
   */
  const getTypeIcon = (): string => {
    switch (type) {
      case 'course':
        return '🎓';
      case 'video':
        return '📺';
      case 'article':
        return '📝';
      case 'exercise':
        return '💪';
      case 'podcast':
        return '🎙️';
      case 'documentation':
        return '📖';
      case 'tutorial':
        return '🛠️';
      case 'project':
        return '🚀';
      default:
        return '📚';
    }
  };

  /**
   * Retorna cor baseada no type
   */
  const getTypeColor = (): string => {
    switch (type) {
      case 'course':
      case 'video':
        return COLORS.brand.primary;
      case 'article':
        return COLORS.info.main;
      case 'exercise':
        return COLORS.warning.main;
      case 'podcast':
        return COLORS.success.main;
      default:
        return COLORS.text.secondary;
    }
  };

  /**
   * Retorna label do type
   */
  const getTypeLabel = (): string => {
    switch (type) {
      case 'course':
        return 'Curso';
      case 'video':
        return 'Vídeo';
      case 'article':
        return 'Artigo';
      case 'exercise':
        return 'Exercício';
      case 'podcast':
        return 'Podcast';
      case 'documentation':
        return 'Documentação';
      case 'tutorial':
        return 'Tutorial';
      case 'project':
        return 'Projeto';
      default:
        return 'Recurso';
    }
  };

  /**
   * Abre URL do recurso
   */
  const handleOpenResource = async () => {
    try {
      const canOpen = await Linking.canOpenURL(url);

      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Erro', 'Não foi possível abrir este link.');
      }
    } catch (error) {
      console.error('Erro ao abrir URL:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao tentar abrir o recurso.');
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handleOpenResource}
      activeOpacity={0.7}
    >
      {/* Cabeçalho com type e platform */}
      <View style={styles.header}>
        <View style={styles.typeContainer}>
          <Text style={styles.typeIcon}>{getTypeIcon()}</Text>
          <Text style={[styles.typeLabel, { color: getTypeColor() }]}>
            {getTypeLabel()}
          </Text>
        </View>

        {platform && (
          <View style={styles.platformBadge}>
            <Text style={styles.platformText}>{platform}</Text>
          </View>
        )}
      </View>

      {/* Título do recurso */}
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>

      {/* Rodapé com free badge */}
      {is_free && (
        <View style={styles.footer}>
          <View style={styles.freeBadge}>
            <Text style={styles.freeBadgeText}>GRÁTIS</Text>
          </View>
        </View>
      )}

      {/* Indicador de link externo */}
      <View style={styles.linkIndicator}>
        <Text style={styles.linkIcon}>🔗</Text>
        <Text style={styles.linkText}>Abrir recurso</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bg.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.bg.tertiary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    fontSize: 20,
    marginRight: 6,
  },
  typeLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  platformBadge: {
    backgroundColor: COLORS.bg.tertiary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  platformText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
    marginBottom: 12,
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.inverse,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg.tertiary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  durationIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  durationText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  linkIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.bg.tertiary,
  },
  linkIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  linkText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.brand.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  freeBadge: {
    backgroundColor: COLORS.status.success,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  freeBadgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.inverse,
  },
});

export default ResourceCard;
