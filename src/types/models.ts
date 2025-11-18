// ===========================
// Domain Interfaces
// ===========================

export interface IUser {
  id: string;
  name: string;
  email: string;
  password_hash?: string;
  current_xp: number;
  creation_date: string;
}

export interface ISkill {
  id: string;
  name: string;
  type: 'hard' | 'soft';
  description: string;
  category?: string;
}

export interface ISkillMilestone {
  level: number;
  title: string;
  objectives: string[];
  completed: boolean;
}

export interface ISkillResource {
  id: string;
  skill_id: string;
  type: 'course' | 'article' | 'video' | 'documentation' | 'tutorial' | 'project' | 'exercise' | 'podcast';
  title: string;
  url: string;
  platform?: string;
  is_free: boolean;
}

export interface IRoadmap {
  id: string;
  userId: string;
  title: string;
  careerGoal: string;
  experience: string;
  percentualProgress: number;
  creationDate: string;
  skills?: any[];
}

export interface IPrerequisiteSkill {
  id: string;
  name: string;
}

export interface IRoadmapSkill {
  id: string;
  roadmap_id: string;
  skill_id?: string;
  skill: ISkill;
  order?: number;
  status: 'pendente' | 'concluido';
  is_concluded?: boolean;
  conclusion_date?: string;
  milestones?: ISkillMilestone[];
  learning_objectives?: string;
  prerequisites?: IPrerequisiteSkill[];
  estimated_hours?: number;
  resources?: ISkillResource[];
}

// ===========================
// DTOs (Data Transfer Objects)
// ===========================

export interface LoginDTO {
  email: string;
  senha: string;
}

export interface RegisterDTO {
  name: string;
  email: string;
  senha: string;
  confirmacao_senha: string;
}

export interface CreateRoadmapDTO {
  title: string;
  career_goal: string;
  experience: string;
  skills: string[];
}

// ===========================
// Service Return Types
// ===========================

export interface AuthResult {
  success: boolean;
  user?: IUser;
  error?: string;
}

export interface RoadmapResult {
  success: boolean;
  roadmap?: IRoadmap;
  skills?: IRoadmapSkill[];
  error?: string;
}

// ===========================
// UI State
// ===========================

export interface FormErrors {
  [key: string]: string;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}
