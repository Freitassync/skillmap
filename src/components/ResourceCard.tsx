import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import {
  GraduationCap,
  Video,
  FileText,
  Dumbbell,
  Mic,
  Book,
  Wrench,
  Rocket,
  Library,
  ExternalLink,
} from 'lucide-react-native';
import { COLORS, TYPOGRAPHY } from '../constants';
import { Alert } from '../utils/alert';

interface ResourceCardProps {
  type: string;
  title: string;
  url: string;
  platform?: string;
  is_free?: boolean;
}

const ResourceCard: React.FC<ResourceCardProps> = ({
  type,
  title,
  url,
  platform,
  is_free = true,
}) => {
  const getTypeIcon = () => {
    const iconProps = { size: 20, color: getTypeColor() };

    switch (type) {
      case 'curso':
        return <GraduationCap {...iconProps} />;
      case 'vídeo':
        return <Video {...iconProps} />;
      case 'artigo':
        return <FileText {...iconProps} />;
      case 'exercício':
        return <Dumbbell {...iconProps} />;
      case 'podcast':
        return <Mic {...iconProps} />;
      case 'documentação':
        return <Book {...iconProps} />;
      case 'tutorial':
        return <Wrench {...iconProps} />;
      case 'projeto':
        return <Rocket {...iconProps} />;
      default:
        return <Library {...iconProps} />;
    }
  };

  /**
   * Retorna cor baseada no type
   */
  const getTypeColor = (): string => {
    switch (type) {
      case 'curso':
      case 'vídeo':
        return COLORS.brand.primary;
      case 'artigo':
        return COLORS.info.main;
      case 'exercício':
        return COLORS.warning.main;
      case 'podcast':
        return COLORS.success.main;
      default:
        return COLORS.text.secondary;
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
      <View style={styles.header}>
        <View style={styles.typeContainer}>
          <View style={styles.typeIcon}>{getTypeIcon()}</View>
          <Text style={[styles.typeLabel, { color: getTypeColor() }]}>
            {type.toUpperCase()}
          </Text>
        </View>

        {platform && (
          <View style={styles.platformBadge}>
            <Text style={styles.platformText}>{platform}</Text>
          </View>
        )}
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>

      {is_free && (
        <View style={styles.footer}>
          <View style={styles.freeBadge}>
            <Text style={styles.freeBadgeText}>GRÁTIS</Text>
          </View>
        </View>
      )}

      <View style={styles.linkIndicator}>
        <ExternalLink size={14} color={COLORS.text.secondary} style={styles.linkIcon} />
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
