import StorageService from './StorageService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, MESSAGES } from '../constants';
import { sanitizeEmail, sanitizeNome } from '../utils/validation';
import type { IUser, LoginDTO, RegisterDTO, AuthResult } from '../types/models';
import ApiClient from './ApiClient';

// ===========================
// AuthService - Gerenciamento de Autenticação com Backend API
// ===========================

class AuthService {
  /**
   * Realiza login e retorna dados do usuário
   *
   * @param {LoginDTO} credentials - Objeto contendo email e senha do usuário
   * @returns {Promise<AuthResult>} Objeto com sucesso (true/false), dados do usuário ou mensagem de erro
   * @throws {Error} Se ocorrer erro de comunicação com o banco de dados
   *
   * @example
   * const result = await AuthService.login({
   *   email: 'user@example.com',
   *   senha: 'Password123'
   * });
   *
   * if (result.success) {
   *   console.log('Usuário logado:', result.user.name);
   * } else {
   *   console.error('Erro:', result.error);
   * }
   *
   * @description
   * Fluxo de autenticação:
   * 1. Sanitiza o email fornecido
   * 2. Busca usuário no banco de dados SQLite por email
   * 3. Compara senha fornecida com hash armazenado (SHA-256)
   * 4. Se credenciais válidas, cria sessão:
   *    - Armazena token no StorageService (SecureStore no mobile, localStorage na web)
   *    - Armazena dados do usuário no AsyncStorage (cache)
   * 5. Retorna resultado com dados do usuário ou erro
   */
  async login(credentials: LoginDTO): Promise<AuthResult> {
    try {
      console.log('🔐 AuthService.login - Email:', credentials.email);

      const email = sanitizeEmail(credentials.email);

      // Call backend API to login
      const response = await ApiClient.post<{ user: IUser; token: string }>('/auth/login', {
        email,
        senha: credentials.senha,
      });

      if (!response.success) {
        console.log('❌ Login falhou:', response.error);
        return {
          success: false,
          error: response.error || MESSAGES.auth.loginError,
        };
      }

      // Handle both response formats: {success, data: {token, user}} OR {success, token, user}
      const responseData: any = response.data || response;
      const { user, token } = responseData;

      if (!user || !token) {
        console.log('❌ Login falhou: dados incompletos');
        return {
          success: false,
          error: MESSAGES.auth.loginError,
        };
      }

      console.log('✅ Usuário autenticado:', user.name);

      // Store JWT token in storage
      await StorageService.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));

      console.log('✅ Login realizado com sucesso');

      return {
        success: true,
        user: user,
      };
    } catch (error) {
      console.error('❌ Erro no login:', error);
      return {
        success: false,
        error: 'Erro ao realizar login. Tente novamente.',
      };
    }
  }

  /**
   * Realiza cadastro de novo usuário no SQLite
   *
   * @param {RegisterDTO} dados - Objeto contendo name, email, senha e confirmação de senha
   * @returns {Promise<AuthResult>} Objeto com sucesso (true/false), dados do usuário ou mensagem de erro
   * @throws {Error} Se ocorrer erro de comunicação com o banco de dados
   *
   * @example
   * const result = await AuthService.cadastrar({
   *   name: 'João Silva',
   *   email: 'joao@example.com',
   *   senha: 'Senha123',
   *   confirmacao_senha: 'Senha123'
   * });
   *
   * @description
   * Fluxo de cadastro:
   * 1. Sanitiza email e name (trim, lowercase em email)
   * 2. Verifica se email já existe no banco
   * 3. Cria hash SHA-256 da senha (via expo-crypto)
   * 4. Gera ID único: `user-{timestamp}-{random}`
   * 5. Insere usuário no SQLite com:
   *    - xp_level: 1 (inicial)
   *    - current_xp: 0
   * 6. Faz login automático após cadastro bem-sucedido
   * 7. Retorna resultado com dados do usuário
   */
  async cadastrar(dados: RegisterDTO): Promise<AuthResult> {
    try {
      console.log('📝 AuthService.cadastrar - Email:', dados.email);

      const email = sanitizeEmail(dados.email);
      const name = sanitizeNome(dados.name);

      // Call backend API to register
      const response = await ApiClient.post<{ user: IUser; token: string }>('/auth/register', {
        name,
        email,
        senha: dados.senha,
        confirmacao_senha: dados.confirmacao_senha,
      });

      if (!response.success) {
        console.log('❌ Cadastro falhou:', response.error);
        return {
          success: false,
          error: response.error || MESSAGES.auth.cadastroError,
        };
      }

      // Handle both response formats: {success, data: {token, user}} OR {success, token, user}
      const responseData: any = response.data || response;
      const { user, token } = responseData;

      if (!user || !token) {
        console.log('❌ Cadastro falhou: dados incompletos');
        return {
          success: false,
          error: MESSAGES.auth.cadastroError,
        };
      }

      console.log('✅ Usuário criado:', user.name);

      // Auto-login after registration - store JWT token
      await StorageService.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));

      console.log('✅ Cadastro realizado com sucesso');

      return {
        success: true,
        user: user,
      };
    } catch (error) {
      console.error('❌ Erro no cadastro:', error);
      return {
        success: false,
        error: MESSAGES.auth.cadastroError,
      };
    }
  }

  /**
   * Verifica se existe sessão ativa e valida no SQLite
   *
   * @returns {Promise<IUser | null>} Dados do usuário autenticado ou null se sessão inválida
   * @throws {Error} Se ocorrer erro de comunicação com o banco de dados
   *
   * @example
   * const user = await AuthService.verificarSessao();
   *
   * if (user) {
   *   console.log('Sessão válida para:', user.name);
   * } else {
   *   console.log('Usuário não autenticado');
   * }
   *
   * @description
   * Fluxo de verificação de sessão:
   * 1. Busca token de autenticação no StorageService
   * 2. Se token não existe, retorna null
   * 3. Valida token no SQLite (busca usuário por ID)
   * 4. Se usuário não existe (token inválido):
   *    - Limpa sessão (logout)
   *    - Retorna null
   * 5. Se usuário existe:
   *    - Atualiza cache no AsyncStorage
   *    - Retorna dados do usuário
   *
   * Este método é chamado automaticamente ao iniciar o app
   * para restaurar sessões de usuários já autenticados.
   */
  async verificarSessao(): Promise<IUser | null> {
    try {
      console.log('🔍 AuthService.verificarSessao');

      const token = await StorageService.getItem(STORAGE_KEYS.AUTH_TOKEN);

      if (!token) {
        console.log('❌ Nenhum token encontrado');
        return null;
      }

      console.log('✅ Token encontrado, verificando no backend...');

      // Verify token with backend (ApiClient automatically includes the token in headers)
      const response = await ApiClient.get<{ user: IUser }>('/auth/verify');

      if (!response.success || !response.data) {
        console.log('❌ Token inválido ou expirado:', response.error);
        // Token invalid, clear session
        await this.logout();
        return null;
      }

      const user = response.data.user;

      console.log('✅ Sessão válida:', user.name);

      // Update local cache
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));

      return user;
    } catch (error) {
      console.error('❌ Erro ao verificar sessão:', error);
      return null;
    }
  }

  /**
   * Realiza logout e limpa sessão
   */
  async logout(): Promise<void> {
    try {
      console.log('🚪 AuthService.logout');
      await StorageService.deleteItem(STORAGE_KEYS.AUTH_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
      console.log('✅ Logout realizado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao fazer logout:', error);
    }
  }

}

export default new AuthService();
