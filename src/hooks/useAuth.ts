import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants';
import AuthService from '../services/AuthService';
import type { IUser, LoginDTO, RegisterDTO } from '../types/models';

interface UseAuthReturn {
  user: IUser | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginDTO) => Promise<boolean>;
  cadastrar: (data: RegisterDTO) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<IUser | null>;
}

/**
 * Hook customizado para gerenciar autenticação
 */
export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verifica sessão ao montar o hook
  useEffect(() => {
    verificarSessaoExistente();
  }, []);

  const verificarSessaoExistente = async () => {
    try {
      setIsLoading(true);
      const userLogado = await AuthService.verificarSessao();
      setUser(userLogado);
    } catch (err) {
      console.error('❌ Erro ao verificar sessão:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (credentials: LoginDTO): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await AuthService.login(credentials);

      if (result.success && result.user) {
        setUser(result.user);
        return true;
      } else {
        setError(result.error || 'Erro ao fazer login');
        return false;
      }
    } catch (err) {
      console.error('❌ Erro ao fazer login:', err);
      setError('Erro inesperado ao fazer login');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cadastrar = useCallback(async (data: RegisterDTO): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await AuthService.cadastrar(data);

      if (result.success && result.user) {
        setUser(result.user);
        return true;
      } else {
        setError(result.error || 'Erro ao cadastrar');
        return false;
      }
    } catch (err) {
      console.error('❌ Erro ao cadastrar:', err);
      setError('Erro inesperado ao cadastrar');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      // 1. Limpa dados de autenticação
      await AuthService.logout();
      console.log('✅ useAuth.logout - Serviço de logout executado');
      
      // 2. Limpa estado do onboarding para forçar exibição na próxima vez
      try {
        const keys = await AsyncStorage.getAllKeys();
        const onboardingKeys = keys.filter(key => key.startsWith(STORAGE_KEYS.ONBOARDING));
        if (onboardingKeys.length > 0) {
          await AsyncStorage.multiRemove(onboardingKeys);
        }
      } catch (error) {
        console.warn('⚠️ Erro ao limpar onboarding:', error);
      }
      
      setUser(null);
    } catch (err) {
      console.error('❌ Erro ao fazer logout:', err);
    }
  }, []);

  const refreshUser = useCallback(async (): Promise<IUser | null> => {
    try {
      console.log('🔄 useAuth.refreshUser - Recarregando dados do usuário do backend');
      const userLogado = await AuthService.verificarSessao();
      if (userLogado) {
        setUser(userLogado);
        console.log('✅ Usuário atualizado com sucesso:', {
          xp_level: userLogado.xp_level,
          current_xp: userLogado.current_xp,
        });
      }
      return userLogado;
    } catch (err) {
      console.error('❌ Erro ao recarregar usuário:', err);
      return null;
    }
  }, []);

  return {
    user,
    isLoading,
    error,
    login,
    cadastrar,
    logout,
    refreshUser,
  };
};
