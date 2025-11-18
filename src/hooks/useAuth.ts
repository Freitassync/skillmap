import { useState, useEffect, useCallback } from 'react';
import { logger } from '../utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants';
import AuthService from '../services/AuthService';
import { reloadApp } from '../utils/appReload';
import type { IUser, LoginDTO, RegisterDTO } from '../types/models';

interface UseAuthReturn {
  user: IUser | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginDTO) => Promise<boolean>;
  register: (data: RegisterDTO, skipAutoReload?: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<IUser | null>;
  authChangeKey: number;
  triggerAuthChange: () => Promise<void>;
}

/**
 * Hook customizado para gerenciar autenticação
 */
export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authChangeKey, setAuthChangeKey] = useState(0);

  useEffect(() => {
    verificarSessaoExistente();
  }, []);

  const verificarSessaoExistente = async () => {
    try {
      setIsLoading(true);
      const userLogado = await AuthService.verifySession();
      setUser(userLogado);
    } catch (err) {
      console.error('Erro ao verificar sessão:', err);
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
        setTimeout(async () => {
          const reloaded = await reloadApp();
          if (!reloaded) {
            setAuthChangeKey(prev => prev + 1);
          }
        }, 300);
        return true;
      } else {
        setError(result.error || 'Erro ao fazer login');
        return false;
      }
    } catch (err) {
      console.error('Erro ao fazer login:', err);
      setError('Erro inesperado ao fazer login');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterDTO, skipAutoReload = false): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await AuthService.register(data);

      if (result.success && result.user) {
        setUser(result.user);
        if (!skipAutoReload) {
          setTimeout(async () => {
            const reloaded = await reloadApp();
            if (!reloaded) {
              setAuthChangeKey(prev => prev + 1);
            }
          }, 300);
        }
        return true;
      } else {
        setError(result.error || 'Erro ao cadastrar');
        return false;
      }
    } catch (err) {
      console.error('Erro ao cadastrar:', err);
      setError('Erro inesperado ao cadastrar');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await AuthService.logout();
      logger.debug('useAuth.logout - Serviço de logout executado');

      try {
        const keys = await AsyncStorage.getAllKeys();
        const onboardingKeys = keys.filter(key => key.startsWith(STORAGE_KEYS.ONBOARDING));
        if (onboardingKeys.length > 0) {
          await AsyncStorage.multiRemove(onboardingKeys);
        }
      } catch (error) {
        console.warn('Erro ao limpar onboarding:', error);
      }

      setUser(null);

      setTimeout(async () => {
        const reloaded = await reloadApp();
        if (!reloaded) {
          setAuthChangeKey(prev => prev + 1);
        }
      }, 100);
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
    }
  }, []);

  const refreshUser = useCallback(async (): Promise<IUser | null> => {
    try {
      logger.debug('useAuth.refreshUser - Recarregando dados do usuário do backend');
      const userLogado = await AuthService.verifySession();
      if (userLogado) {
        setUser(userLogado);
        console.log('Usuário atualizado com sucesso:', {
          current_xp: userLogado.current_xp,
        });
      }
      return userLogado;
    } catch (err) {
      console.error('Erro ao recarregar usuário:', err);
      return null;
    }
  }, []);

  const triggerAuthChange = useCallback(async (): Promise<void> => {
    const reloaded = await reloadApp();
    if (!reloaded) {
      setAuthChangeKey(prev => prev + 1);
    }
  }, []);

  return {
    user,
    isLoading,
    error,
    login,
    register,
    logout,
    refreshUser,
    authChangeKey,
    triggerAuthChange,
  };
};
