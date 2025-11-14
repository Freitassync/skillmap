// ===========================
// Interfaces de Domínio
// ===========================

export interface IUsuario {
  id: string;
  nome: string;
  email: string;
  senha_hash?: string; // Adicionado para SQLite
  nivel_xp: number;
  xp_atual?: number; // Adicionado para gamification
  data_criacao: string;
  ultimo_onboarding?: string; // Adicionado para controle de onboarding
}

export interface ISkill {
  id: string;
  nome: string;
  tipo: 'hard' | 'soft';
  descricao: string;
  categoria?: string; // Adicionado para categorização
}

export interface IRoadmap {
  id: string;
  usuario_id: string;
  nome_carreira: string;
  titulo?: string; // Alias para compatibilidade
  objetivo_carreira?: string; // Adicionado para SQLite
  nivel_experiencia?: string; // Adicionado para SQLite
  progresso_percentual: number;
  data_criacao: string;
  data_atualizacao: string;
}

export interface IRoadmapSkill {
  id: string;
  roadmap_id: string;
  skill_id?: string; // Adicionado para SQLite foreign key
  skill: ISkill;
  ordem?: number; // Adicionado para ordem das skills
  status: 'pendente' | 'concluido';
  concluida?: boolean; // Alias para compatibilidade (status === 'concluido')
  data_conclusao?: string;
}

// ===========================
// DTOs (Data Transfer Objects)
// ===========================

export interface LoginDTO {
  email: string;
  senha: string;
}

export interface CadastroDTO {
  nome: string;
  email: string;
  senha: string;
  confirmacao_senha: string;
}

export interface CriarRoadmapDTO {
  nome_carreira: string;
  hard_skills_atuais: string[];
  soft_skills_atuais: string[];
}

// ===========================
// Tipos de Retorno de Serviços
// ===========================

export interface AuthResult {
  success: boolean;
  usuario?: IUsuario;
  error?: string;
}

export interface RoadmapResult {
  success: boolean;
  roadmap?: IRoadmap;
  skills?: IRoadmapSkill[];
  error?: string;
}

// ===========================
// Estados de UI
// ===========================

export interface FormErrors {
  [key: string]: string;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}
