import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../hooks/useAuth';
import { Button, Input } from '../components';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, MESSAGES } from '../constants';
import { validateCadastroForm, sanitizeEmail, sanitizeNome } from '../utils/validation';
import type { FormErrors } from '../types/models';
import { Alert } from '../utils/alert';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;

export type CadastroScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Cadastro'>;

const CadastroScreen: React.FC = () => {
  const navigation = useNavigation<CadastroScreenNavigationProp>();
  const { register, isLoading } = useAuth();

  const [name, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacaoSenha, setConfirmacaoSenha] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const handleCadastro = async () => {
    const formErrors = validateCadastroForm({
      name,
      email,
      senha,
      confirmacao_senha: confirmacaoSenha,
    });

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setErrors({});

    const nameLimpo = sanitizeNome(name);
    const emailLimpo = sanitizeEmail(email);

    const sucesso = await register({
      name: nameLimpo,
      email: emailLimpo,
      senha,
      confirmacao_senha: confirmacaoSenha,
    });

    if (sucesso) {
      Alert.alert('Sucesso!', MESSAGES.auth.cadastroSuccess);
    } else {
      Alert.alert('Erro', MESSAGES.auth.cadastroError);
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
          <View style={styles.badge}>
            <Text style={styles.badgeText}>SkillMap 4.0</Text>
          </View>
          <Text style={styles.title}>Crie sua conta</Text>
          <Text style={styles.subtitle}>
            Comece sua jornada de requalificação profissional com IA.
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Nome completo"
            placeholder="João Silva"
            value={name}
            onChangeText={(text) => {
              setNome(text);
              if (errors.name) setErrors({ ...errors, name: '' });
            }}
            error={errors.name}
            autoCapitalize="words"
            editable={!isLoading}
          />

          <Input
            label="Email"
            placeholder="seu@email.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors({ ...errors, email: '' });
            }}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />

          <Input
            label="Senha"
            placeholder="Mínimo 6 caracteres"
            value={senha}
            onChangeText={(text) => {
              setSenha(text);
              if (errors.senha) setErrors({ ...errors, senha: '' });
            }}
            error={errors.senha}
            secureTextEntry
            editable={!isLoading}
          />

          <Input
            label="Confirme a senha"
            placeholder="Digite a senha novamente"
            value={confirmacaoSenha}
            onChangeText={(text) => {
              setConfirmacaoSenha(text);
              if (errors.confirmacao_senha) setErrors({ ...errors, confirmacao_senha: '' });
            }}
            error={errors.confirmacao_senha}
            secureTextEntry
            editable={!isLoading}
          />

          <Button
            title="Criar conta"
            onPress={handleCadastro}
            isLoading={isLoading}
            disabled={isLoading}
            containerStyle={styles.cadastroButton}
          />

          <Button
            title="Já tenho conta"
            variant="outline"
            onPress={() => navigation.goBack()}
            disabled={isLoading}
          />
        </View>
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
    paddingHorizontal: isSmallDevice ? SPACING.base : SPACING.xl,
    paddingVertical: isSmallDevice ? SPACING.xl : SPACING['3xl'],
    justifyContent: 'center',
    minHeight: SCREEN_HEIGHT * 0.9,
  },
  header: {
    marginBottom: isSmallDevice ? SPACING.base : SPACING['2xl'],
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: `${COLORS.brand.primary}33`,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.base,
  },
  badgeText: {
    color: COLORS.brand.primary,
    fontSize: isSmallDevice ? TYPOGRAPHY.fontSize.xs - 1 : TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  title: {
    color: COLORS.text.primary,
    fontSize: isSmallDevice ? TYPOGRAPHY.fontSize['3xl'] : TYPOGRAPHY.fontSize['4xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    color: COLORS.text.tertiary,
    fontSize: isSmallDevice ? TYPOGRAPHY.fontSize.sm : TYPOGRAPHY.fontSize.base,
    lineHeight: 20,
  },
  form: {
    gap: SPACING.base,
  },
  cadastroButton: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
});

export default CadastroScreen;
