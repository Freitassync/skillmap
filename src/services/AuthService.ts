import StorageService from './StorageService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, MESSAGES } from '../constants';
import { sanitizeEmail, sanitizeNome } from '../utils/validation';
import type { IUser, LoginDTO, RegisterDTO, AuthResult } from '../types/models';
import ApiClient from './ApiClient';

class AuthService {
  async login(credentials: LoginDTO): Promise<AuthResult> {
    try {
      const email = sanitizeEmail(credentials.email);

      const response = await ApiClient.post<{ user: IUser; token: string }>('/auth/login', {
        email,
        senha: credentials.senha,
      });

      if (!response.success) {
        return {
          success: false,
          error: response.error || MESSAGES.auth.loginError,
        };
      }

      // Handle both response formats: {success, data: {token, user}} OR {success, token, user}
      const responseData: any = response.data || response;
      const { user, token } = responseData;

      if (!user || !token) {
        return {
          success: false,
          error: MESSAGES.auth.loginError,
        };
      }

      // Store JWT token in storage
      await StorageService.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));

      return {
        success: true,
        user: user,
      };
    } catch (error) {
      console.error('Erro no login:', error);
      return {
        success: false,
        error: 'Erro ao realizar login. Tente novamente.',
      };
    }
  }

  async register(dados: RegisterDTO): Promise<AuthResult> {
    try {

      const email = sanitizeEmail(dados.email);
      const name = sanitizeNome(dados.name);

      const response = await ApiClient.post<{ user: IUser; token: string }>('/auth/register', {
        name,
        email,
        senha: dados.senha,
        confirmacao_senha: dados.confirmacao_senha,
      });

      if (!response.success) {
        return {
          success: false,
          error: response.error || MESSAGES.auth.cadastroError,
        };
      }

      // Handle both response formats: {success, data: {token, user}} OR {success, token, user}
      const responseData: any = response.data || response;
      const { user, token } = responseData;

      if (!user || !token) {
        return {
          success: false,
          error: MESSAGES.auth.cadastroError,
        };
      }


      await StorageService.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));

      return {
        success: true,
        user: user,
      };
    } catch (error) {
      console.error('Erro no cadastro:', error);
      return {
        success: false,
        error: MESSAGES.auth.cadastroError,
      };
    }
  }

  // Verifica se existe sessão ativa e valida com o backend
  async verifySession(): Promise<IUser | null> {
    try {

      const token = await StorageService.getItem(STORAGE_KEYS.AUTH_TOKEN);

      if (!token) {
        return null;
      }


      // Verify token with backend (ApiClient automatically includes the token in headers)
      const response = await ApiClient.get<{ user: IUser }>('/auth/verify');

      if (!response.success || !response.data) {
        await this.logout();
        return null;
      }

      const user = response.data.user;


      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));

      return user;
    } catch (error) {
      console.error('Erro ao verificar sessão:', error);
      return null;
    }
  }

  // Realiza logout e limpa sessão
  async logout(): Promise<void> {
    try {
      await StorageService.deleteItem(STORAGE_KEYS.AUTH_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }

}

export default new AuthService();
