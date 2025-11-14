import * as SQLite from 'expo-sqlite';
import type { IUsuario, IRoadmap, ISkill, IRoadmapSkill } from '../types/models';

/**
 * DatabaseService - Gerenciamento de banco de dados SQLite local
 * Para uso em desenvolvimento e testes
 */
class DatabaseService {
  private static instance: DatabaseService;
  private db: SQLite.SQLiteDatabase | null = null;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Inicializa o banco de dados e cria as tabelas
   */
  public async init(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync('skillmap.db');
      await this.createTables();
      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing database:', error);
      throw error;
    }
  }

  /**
   * Cria as tabelas do banco de dados
   */
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Tabela de usuários
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        senha_hash TEXT NOT NULL,
        nivel_xp INTEGER DEFAULT 1,
        xp_atual INTEGER DEFAULT 0,
        data_criacao TEXT DEFAULT CURRENT_TIMESTAMP,
        ultimo_onboarding TEXT
      );
    `);

    // Tabela de roadmaps
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS roadmaps (
        id TEXT PRIMARY KEY,
        usuario_id TEXT NOT NULL,
        titulo TEXT NOT NULL,
        objetivo_carreira TEXT NOT NULL,
        nivel_experiencia TEXT NOT NULL,
        data_criacao TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      );
    `);

    // Tabela de skills
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS skills (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        descricao TEXT NOT NULL,
        tipo TEXT NOT NULL CHECK(tipo IN ('hard', 'soft')),
        categoria TEXT
      );
    `);

    // Tabela de relação roadmap-skill
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS roadmap_skills (
        id TEXT PRIMARY KEY,
        roadmap_id TEXT NOT NULL,
        skill_id TEXT NOT NULL,
        ordem INTEGER NOT NULL,
        concluida INTEGER DEFAULT 0,
        data_conclusao TEXT,
        FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id) ON DELETE CASCADE,
        FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
      );
    `);

    // Tabela de mensagens do chatbot
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        usuario_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      );
    `);

    console.log('✅ Database tables created');
  }

  // ==================== CRUD USUÁRIOS ====================

  public async createUsuario(usuario: Omit<IUsuario, 'data_criacao'>): Promise<IUsuario> {
    if (!this.db) throw new Error('Database not initialized');

    const dataCriacao = new Date().toISOString();
    await this.db.runAsync(
      'INSERT INTO usuarios (id, nome, email, senha_hash, nivel_xp, xp_atual, data_criacao) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [usuario.id, usuario.nome, usuario.email, usuario.senha_hash || '', usuario.nivel_xp, usuario.xp_atual || 0, dataCriacao]
    );

    return { ...usuario, data_criacao: dataCriacao };
  }

  public async getUsuarioByEmail(email: string): Promise<IUsuario | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync<IUsuario>(
      'SELECT * FROM usuarios WHERE email = ?',
      [email]
    );

    return result || null;
  }

  public async getUsuarioById(id: string): Promise<IUsuario | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync<IUsuario>(
      'SELECT * FROM usuarios WHERE id = ?',
      [id]
    );

    return result || null;
  }

  public async updateUsuarioXP(id: string, nivelXp: number, xpAtual: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      'UPDATE usuarios SET nivel_xp = ?, xp_atual = ? WHERE id = ?',
      [nivelXp, xpAtual, id]
    );
  }

  public async updateUsuarioOnboarding(id: string, onboardingType: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      'UPDATE usuarios SET ultimo_onboarding = ? WHERE id = ?',
      [onboardingType, id]
    );
  }

  // ==================== CRUD ROADMAPS ====================

  public async createRoadmap(roadmap: IRoadmap): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const dataCriacao = roadmap.data_criacao || new Date().toISOString();
    const titulo = roadmap.titulo || roadmap.nome_carreira;
    const objetivoCarreira = roadmap.objetivo_carreira || roadmap.nome_carreira;
    const nivelExperiencia = roadmap.nivel_experiencia || 'intermediario';
    
    await this.db.runAsync(
      'INSERT INTO roadmaps (id, usuario_id, titulo, objetivo_carreira, nivel_experiencia, data_criacao) VALUES (?, ?, ?, ?, ?, ?)',
      [roadmap.id, roadmap.usuario_id, titulo, objetivoCarreira, nivelExperiencia, dataCriacao]
    );
  }

  public async getRoadmapsByUsuarioId(usuarioId: string): Promise<IRoadmap[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.getAllAsync<IRoadmap>(
      'SELECT * FROM roadmaps WHERE usuario_id = ? ORDER BY data_criacao DESC',
      [usuarioId]
    );

    return results;
  }

  public async deleteRoadmap(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync('DELETE FROM roadmaps WHERE id = ?', [id]);
  }

  // ==================== CRUD SKILLS ====================

  public async createSkill(skill: ISkill): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      'INSERT OR IGNORE INTO skills (id, nome, descricao, tipo, categoria) VALUES (?, ?, ?, ?, ?)',
      [skill.id, skill.nome, skill.descricao, skill.tipo, skill.categoria || null]
    );
  }

  public async getSkillById(id: string): Promise<ISkill | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync<ISkill>(
      'SELECT * FROM skills WHERE id = ?',
      [id]
    );

    return result || null;
  }

  // ==================== CRUD ROADMAP-SKILLS ====================

  public async createRoadmapSkill(roadmapSkill: IRoadmapSkill): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const skillId = roadmapSkill.skill_id || roadmapSkill.skill.id;
    const ordem = roadmapSkill.ordem || 0;
    const concluida = roadmapSkill.concluida !== undefined ? roadmapSkill.concluida : (roadmapSkill.status === 'concluido');

    await this.db.runAsync(
      'INSERT INTO roadmap_skills (id, roadmap_id, skill_id, ordem, concluida, data_conclusao) VALUES (?, ?, ?, ?, ?, ?)',
      [
        roadmapSkill.id,
        roadmapSkill.roadmap_id,
        skillId,
        ordem,
        concluida ? 1 : 0,
        roadmapSkill.data_conclusao || null,
      ]
    );
  }

  public async getRoadmapSkills(roadmapId: string): Promise<Array<IRoadmapSkill & { skill: ISkill }>> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.getAllAsync<any>(
      `SELECT 
        rs.id, rs.roadmap_id, rs.skill_id, rs.ordem, rs.concluida, rs.data_conclusao,
        s.id as skill__id, s.nome as skill__nome, s.descricao as skill__descricao, 
        s.tipo as skill__tipo, s.categoria as skill__categoria
      FROM roadmap_skills rs
      JOIN skills s ON rs.skill_id = s.id
      WHERE rs.roadmap_id = ?
      ORDER BY rs.ordem ASC`,
      [roadmapId]
    );

    return results.map((row: any) => ({
      id: row.id,
      roadmap_id: row.roadmap_id,
      skill_id: row.skill_id,
      ordem: row.ordem,
      concluida: Boolean(row.concluida),
      status: row.concluida ? 'concluido' as const : 'pendente' as const,
      data_conclusao: row.data_conclusao,
      skill: {
        id: row.skill__id,
        nome: row.skill__nome,
        descricao: row.skill__descricao,
        tipo: row.skill__tipo,
        categoria: row.skill__categoria,
      },
    }));
  }

  public async updateRoadmapSkillConcluida(id: string, concluida: boolean): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const dataConclusao = concluida ? new Date().toISOString() : null;
    await this.db.runAsync(
      'UPDATE roadmap_skills SET concluida = ?, data_conclusao = ? WHERE id = ?',
      [concluida ? 1 : 0, dataConclusao, id]
    );
  }

  // ==================== CHAT MESSAGES ====================

  public async saveChatMessage(usuarioId: string, role: 'user' | 'assistant' | 'system', content: string): Promise<void> {
    console.log('💾 DatabaseService.saveChatMessage');
    console.log('  User ID:', usuarioId);
    console.log('  Role:', role);
    console.log('  Content length:', content.length);
    
    if (!this.db) {
      console.error('❌ Database not initialized');
      throw new Error('Database not initialized');
    }

    const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    try {
      await this.db.runAsync(
        'INSERT INTO chat_messages (id, usuario_id, role, content, timestamp) VALUES (?, ?, ?, ?, ?)',
        [id, usuarioId, role, content, timestamp]
      );
      console.log('✅ Message saved to database');
    } catch (error) {
      console.error('❌ Error saving message:', error);
      throw error;
    }
  }

  public async getChatHistory(usuarioId: string, limit: number = 50): Promise<Array<{ role: string; content: string; timestamp: string }>> {
    console.log('📚 DatabaseService.getChatHistory');
    console.log('  User ID:', usuarioId);
    console.log('  Limit:', limit);
    
    if (!this.db) {
      console.error('❌ Database not initialized');
      throw new Error('Database not initialized');
    }

    try {
      const results = await this.db.getAllAsync<any>(
        'SELECT role, content, timestamp FROM chat_messages WHERE usuario_id = ? ORDER BY timestamp DESC LIMIT ?',
        [usuarioId, limit]
      );

      console.log(`✅ Retrieved ${results.length} messages`);
      return results.reverse(); // Ordem cronológica
    } catch (error) {
      console.error('❌ Error getting chat history:', error);
      throw error;
    }
  }

  public async clearChatHistory(usuarioId: string): Promise<void> {
    console.log('🗑️  DatabaseService.clearChatHistory for user:', usuarioId);
    
    if (!this.db) {
      console.error('❌ Database not initialized');
      throw new Error('Database not initialized');
    }

    try {
      await this.db.runAsync('DELETE FROM chat_messages WHERE usuario_id = ?', [usuarioId]);
      console.log('✅ Chat history cleared');
    } catch (error) {
      console.error('❌ Error clearing chat history:', error);
      throw error;
    }
  }

  // ==================== UTILIDADES ====================

  public async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.execAsync(`
      DELETE FROM chat_messages;
      DELETE FROM roadmap_skills;
      DELETE FROM roadmaps;
      DELETE FROM skills;
      DELETE FROM usuarios;
    `);

    console.log('✅ All data cleared from database');
  }
}

export default DatabaseService.getInstance();
