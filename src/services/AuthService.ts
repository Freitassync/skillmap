import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, MESSAGES } from '../constants';
import { hashPassword, comparePassword, sanitizeEmail, sanitizeNome } from '../utils/validation';
import type { IUsuario, LoginDTO, CadastroDTO, AuthResult } from '../types/models';
import DatabaseService from './DatabaseService';

// ===========================
// AuthService - Gerenciamento de Autenticação com SQLite
// ===========================

class AuthService {
  /**
   * Realiza login e retorna dados do usuário
   * Usa SQLite como banco de dados
   */
  async login(credentials: LoginDTO): Promise<AuthResult> {
    try {
      console.log('🔐 AuthService.login - Email:', credentials.email);
      
      const email = sanitizeEmail(credentials.email);
      const storedUser = await DatabaseService.getUsuarioByEmail(email);

      if (!storedUser) {
        console.log('❌ Usuário não encontrado');
        return {
          success: false,
          error: MESSAGES.auth.loginError,
        };
      }

      console.log('✅ Usuário encontrado:', storedUser.nome);
      
      const senhaCorreta = await comparePassword(credentials.senha, storedUser.senha_hash || '');

      if (!senhaCorreta) {
        console.log('❌ Senha incorreta');
        return {
          success: false,
          error: MESSAGES.auth.loginError,
        };
      }

      console.log('✅ Senha correta');

      const usuario: IUsuario = {
        id: storedUser.id,
        nome: storedUser.nome,
        email: storedUser.email,
        nivel_xp: storedUser.nivel_xp,
        xp_atual: storedUser.xp_atual,
        data_criacao: storedUser.data_criacao,
      };

      // Armazena sessão no SecureStore
      await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, usuario.id);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(usuario));

      console.log('✅ Login realizado com sucesso');

      return {
        success: true,
        usuario,
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
   */
  async cadastrar(dados: CadastroDTO): Promise<AuthResult> {
    try {
      console.log('📝 AuthService.cadastrar - Email:', dados.email);
      
      const email = sanitizeEmail(dados.email);
      const nome = sanitizeNome(dados.nome);

      // Verifica se email já existe
      const usuarioExistente = await DatabaseService.getUsuarioByEmail(email);
      if (usuarioExistente) {
        console.log('❌ Email já cadastrado');
        return {
          success: false,
          error: MESSAGES.auth.emailJaExiste,
        };
      }

      // Cria hash da senha
      const senhaHash = await hashPassword(dados.senha);

      // Cria novo usuário
      const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const novoUsuario = await DatabaseService.createUsuario({
        id,
        nome,
        email,
        senha_hash: senhaHash,
        nivel_xp: 1,
        xp_atual: 0,
      });

      console.log('✅ Usuário criado:', novoUsuario.nome);

      const usuario: IUsuario = {
        id: novoUsuario.id,
        nome: novoUsuario.nome,
        email: novoUsuario.email,
        nivel_xp: novoUsuario.nivel_xp,
        xp_atual: novoUsuario.xp_atual,
        data_criacao: novoUsuario.data_criacao,
      };

      // Faz login automático após cadastro
      await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, usuario.id);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(usuario));

      console.log('✅ Cadastro realizado com sucesso');

      return {
        success: true,
        usuario,
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
   */
  async verificarSessao(): Promise<IUsuario | null> {
    try {
      console.log('🔍 AuthService.verificarSessao');
      
      const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);

      if (!token) {
        console.log('❌ Nenhum token encontrado');
        return null;
      }

      console.log('✅ Token encontrado:', token);

      // Busca usuário no SQLite
      const usuario = await DatabaseService.getUsuarioById(token);

      if (!usuario) {
        console.log('❌ Usuário não encontrado no banco');
        // Token inválido, limpa sessão
        await this.logout();
        return null;
      }

      console.log('✅ Sessão válida:', usuario.nome);

      // Atualiza cache local
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        nivel_xp: usuario.nivel_xp,
        xp_atual: usuario.xp_atual,
        data_criacao: usuario.data_criacao,
      }));

      return {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        nivel_xp: usuario.nivel_xp,
        xp_atual: usuario.xp_atual,
        data_criacao: usuario.data_criacao,
      };
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
      await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
      console.log('✅ Logout realizado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao fazer logout:', error);
    }
  }

  /**
   * Atualiza XP do usuário no SQLite
   */
  async atualizarXP(usuarioId: string, novoNivelXP: number, novoXPAtual: number): Promise<void> {
    try {
      console.log('⬆️  AuthService.atualizarXP');
      console.log('  Usuario ID:', usuarioId);
      console.log('  Novo Nível XP:', novoNivelXP);
      console.log('  Novo XP Atual:', novoXPAtual);
      
      // Atualiza no SQLite
      await DatabaseService.updateUsuarioXP(usuarioId, novoNivelXP, novoXPAtual);

      // Atualiza cache local
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      if (userData) {
        const usuario: IUsuario = JSON.parse(userData);
        usuario.nivel_xp = novoNivelXP;
        usuario.xp_atual = novoXPAtual;
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(usuario));
      }

      console.log('✅ XP atualizado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao atualizar XP:', error);
    }
  }
}

export default new AuthService();
