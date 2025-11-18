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
import { useAuthContext } from '../contexts/AuthContext';
import { Button, Input, SuccessAlert } from '../components';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, MESSAGES } from '../constants';
import { validateLoginForm, sanitizeEmail } from '../utils/validation';
import { Alert } from '../utils/alert';
import type { FormErrors } from '../types/models';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;

export type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login, isLoading } = useAuthContext();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [showAlert, setShowAlert] = useState(false);

  const handleLogin = async () => {
    // Valida formulário
    const formErrors = validateLoginForm({ email, senha });

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setErrors({});

    // Sanitiza dados
    const emailLimpo = sanitizeEmail(email);

    // Tenta fazer login
    const sucesso = await login({ email: emailLimpo, senha });

    if (sucesso) {
      // Mostra alerta de sucesso
      setShowAlert(true);
      // O AppNavigator detectará automaticamente a mudança de estado
      // e exibirá a tela apropriada (OnboardingLogin ou MainTabs)
    } else {
      Alert.alert('Erro', MESSAGES.auth.loginError);
    }
  };

  return (
    <>
      <SuccessAlert 
        visible={showAlert}
        message="Login realizado com sucesso!"
        onHide={() => setShowAlert(false)}
      />
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
            <Text style={styles.title}>Bem-vindo de volta</Text>
            <Text style={styles.subtitle}>
              Faça login para continuar sua jornada de requalificação profissional.
            </Text>
          </View>

          <View style={styles.form}>
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
              placeholder="••••••••"
              value={senha}
              onChangeText={(text) => {
                setSenha(text);
                if (errors.senha) setErrors({ ...errors, senha: '' });
              }}
              error={errors.senha}
              secureTextEntry
              editable={!isLoading}
            />

            <Button
              title="Entrar"
              onPress={handleLogin}
              isLoading={isLoading}
              disabled={isLoading}
              containerStyle={styles.loginButton}
            />

            <Button
              title="Criar nova conta"
              variant="outline"
              onPress={() => navigation.navigate('Cadastro')}
              disabled={isLoading}
            />
          </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
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
  loginButton: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
});

export default LoginScreen;
