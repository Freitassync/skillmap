import React, { createContext, useContext } from 'react';
import { useAuth as useAuthHook } from '../hooks/useAuth';
import type { IUsuario, LoginDTO, CadastroDTO } from '../types/models';

interface AuthContextType {
  usuario: IUsuario | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginDTO) => Promise<boolean>;
  cadastrar: (data: CadastroDTO) => Promise<boolean>;
  logout: () => Promise<void>;
  atualizarXP: (novoNivelXP: number, novoXPAtual?: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuthHook();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext deve ser usado dentro de AuthProvider');
  }
  return context;
};
