/**
 * Database Models
 */

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  current_xp: number;
  creation_date: Date;
}

export interface Roadmap {
  id: string;
  user_id: string;
  title: string;
  career_goal: string;
  experience: string;
  percentual_progress: number;
  creation_date: Date;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  type: 'hard' | 'soft';
  category: string;
}

export interface SkillMilestone {
  level: number;
  title: string;
  objectives: string[];
  completed: boolean;
}

export interface RoadmapSkill {
  id: string;
  roadmap_id: string;
  skill_id: string;
  order: number;
  is_concluded: boolean;
  conclusion_date?: Date;
  milestones?: SkillMilestone[];
  prerequisites?: string[];
  estimated_hours?: number;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface SkillResource {
  id: string;
  skill_id: string;
  type: 'course' | 'article' | 'exercise' | 'podcast' | 'video' | 'documentation' | 'tutorial' | 'project';
  title: string;
  url: string;
  platform?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  duration?: string;
  is_free: boolean;
  date_added: Date;
}

/**
 * DTOs (Data Transfer Objects)
 */

export interface RegisterDTO {
  name: string;
  email: string;
  senha: string;
}

export interface LoginDTO {
  email: string;
  senha: string;
}

export interface CreateRoadmapDTO {
  user_id: string;
  title: string;
  career_goal: string;
  experience: string;
  skills: string[]; // Array of skill IDs
}

export interface UpdateSkillProgressDTO {
  roadmap_id: string;
  skill_id: string;
  is_concluded: boolean;
}

export interface ChatRequestDTO {
  user_id: string;
  message: string;
}

/**
 * API Responses
 */

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: Omit<User, 'password_hash'>;
  error?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
