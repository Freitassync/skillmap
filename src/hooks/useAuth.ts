import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants';
import AuthService from '../services/AuthService';
import type { IUsuario, LoginDTO, CadastroDTO } from '../types/models';

interface UseAuthReturn {
  usuario: IUsuario | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginDTO) => Promise<boolean>;
  cadastrar: (data: CadastroDTO) => Promise<boolean>;
  logout: () => Promise<void>;
  atualizarXP: (novoNivelXP: number, novoXPAtual?: number) => Promise<void>;
}

/**
 * Hook customizado para gerenciar autenticação
 */
export const useAuth = (): UseAuthReturn => {
  const [usuario, setUsuario] = useState<IUsuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verifica sessão ao montar o hook
  useEffect(() => {
    verificarSessaoExistente();
  }, []);

  const verificarSessaoExistente = async () => {
    try {
      setIsLoading(true);
      const usuarioLogado = await AuthService.verificarSessao();
      setUsuario(usuarioLogado);
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

      if (result.success && result.usuario) {
        setUsuario(result.usuario);
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

  const cadastrar = useCallback(async (data: CadastroDTO): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await AuthService.cadastrar(data);

      if (result.success && result.usuario) {
        setUsuario(result.usuario);
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
      
      setUsuario(null);
    } catch (err) {
      console.error('❌ Erro ao fazer logout:', err);
    }
  }, []);

  const atualizarXP = useCallback(
    async (novoNivelXP: number, novoXPAtual?: number): Promise<void> => {
      if (!usuario) return;

      try {
        const xpAtual = novoXPAtual !== undefined ? novoXPAtual : 0;
        await AuthService.atualizarXP(usuario.id, novoNivelXP, xpAtual);
        setUsuario({ ...usuario, nivel_xp: novoNivelXP, xp_atual: xpAtual });
      } catch (err) {
        console.error('Erro ao atualizar XP:', err);
      }
    },
    [usuario]
  );

  return {
    usuario,
    isLoading,
    error,
    login,
    cadastrar,
    logout,
    atualizarXP,
  };
};
