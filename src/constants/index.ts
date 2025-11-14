// ===========================
// Constantes de Tema
// ===========================

export const COLORS = {
  // Background
  bg: {
    primary: '#020617',
    secondary: '#0F172A',
    tertiary: '#1E293B',
  },
  // Text
  text: {
    primary: '#F8FAFC',
    secondary: '#E2E8F0',
    tertiary: '#CBD5F5',
    muted: '#94A3B8',
  },
  // Brand
  brand: {
    primary: '#22D3EE',
    secondary: '#38BDF8',
    accent: '#A5B4FC',
  },
  // Status
  status: {
    success: '#10B981',
    warning: '#FACC15',
    error: '#EF4444',
    info: '#3B82F6',
  },
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.7)',
} as const;

// ===========================
// Tipografia
// ===========================

export const TYPOGRAPHY = {
  fontSize: {
    xs: 12,
    sm: 13,
    base: 14,
    md: 15,
    lg: 16,
    xl: 18,
    '2xl': 20,
    '3xl': 24,
    '4xl': 32,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const;

// ===========================
// Espaçamento
// ===========================

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

// ===========================
// Border Radius
// ===========================

export const RADIUS = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  full: 999,
} as const;

// ===========================
// Regras de Validação
// ===========================

export const VALIDATION = {
  email: {
    regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Email inválido',
  },
  senha: {
    minLength: 6,
    regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/,
    message: 'Senha deve conter ao menos 6 caracteres, uma maiúscula, uma minúscula e um número',
  },
  nome: {
    minLength: 3,
    maxLength: 50,
    regex: /^[a-zA-ZÀ-ÿ\s]+$/,
    message: 'Nome deve ter entre 3 e 50 caracteres e conter apenas letras',
  },
  carreira: {
    minLength: 3,
    maxLength: 100,
    message: 'Nome da carreira deve ter entre 3 e 100 caracteres',
  },
} as const;

// ===========================
// Mensagens de Sistema
// ===========================

export const MESSAGES = {
  auth: {
    loginSuccess: 'Login realizado com sucesso!',
    loginError: 'Email ou senha incorretos',
    cadastroSuccess: 'Cadastro realizado com sucesso!',
    cadastroError: 'Erro ao criar conta. Tente novamente.',
    emailJaExiste: 'Este email já está cadastrado',
    senhasNaoCoincidem: 'As senhas não coincidem',
    logoutSuccess: 'Você saiu da conta',
  },
  roadmap: {
    criadoSuccess: 'Roadmap criado com sucesso!',
    criadoError: 'Erro ao criar roadmap. Tente novamente.',
    atualizadoSuccess: 'Progresso atualizado!',
    nenhumRoadmap: 'Você ainda não possui roadmaps criados',
  },
  validation: {
    campoObrigatorio: 'Este campo é obrigatório',
    emailInvalido: 'Email inválido',
    senhaFraca: VALIDATION.senha.message,
    nomeInvalido: VALIDATION.nome.message,
  },
} as const;

// ===========================
// Configurações de Gamificação
// ===========================

export const GAMIFICATION = {
  xp: {
    porSkillConcluida: 50,
    porRoadmapConcluido: 500,
    porDiaDeEstudo: 10,
  },
  niveis: [
    { nivel: 1, xpNecessario: 0, titulo: 'Iniciante' },
    { nivel: 2, xpNecessario: 500, titulo: 'Aprendiz' },
    { nivel: 3, xpNecessario: 1500, titulo: 'Praticante' },
    { nivel: 4, xpNecessario: 3000, titulo: 'Especialista' },
    { nivel: 5, xpNecessario: 5000, titulo: 'Mestre' },
  ],
} as const;

// ===========================
// Chaves de Storage
// ===========================

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'skillmap_auth_token',
  USER_DATA: 'skillmap_user_data',
  ROADMAPS: 'skillmap_roadmaps',
  USERS_DB: 'skillmap_users_db',
  ONBOARDING: 'skillmap_onboarding',
} as const;
