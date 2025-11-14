import { VALIDATION } from '../constants';
import type { FormErrors, LoginDTO, CadastroDTO } from '../types/models';

// ===========================
// Validadores de Campo
// ===========================

export const validateEmail = (email: string): string | null => {
  if (!email.trim()) {
    return 'Email é obrigatório';
  }
  if (!VALIDATION.email.regex.test(email)) {
    return VALIDATION.email.message;
  }
  return null;
};

export const validateSenha = (senha: string): string | null => {
  if (!senha) {
    return 'Senha é obrigatória';
  }
  if (senha.length < VALIDATION.senha.minLength) {
    return `Senha deve ter no mínimo ${VALIDATION.senha.minLength} caracteres`;
  }
  if (!VALIDATION.senha.regex.test(senha)) {
    return VALIDATION.senha.message;
  }
  return null;
};

export const validateNome = (nome: string): string | null => {
  if (!nome.trim()) {
    return 'Nome é obrigatório';
  }
  if (nome.length < VALIDATION.nome.minLength || nome.length > VALIDATION.nome.maxLength) {
    return VALIDATION.nome.message;
  }
  if (!VALIDATION.nome.regex.test(nome)) {
    return 'Nome contém caracteres inválidos';
  }
  return null;
};

export const validateConfirmacaoSenha = (senha: string, confirmacao: string): string | null => {
  if (!confirmacao) {
    return 'Confirmação de senha é obrigatória';
  }
  if (senha !== confirmacao) {
    return 'As senhas não coincidem';
  }
  return null;
};

// ===========================
// Validadores de Formulário
// ===========================

export const validateLoginForm = (data: LoginDTO): FormErrors => {
  const errors: FormErrors = {};

  const emailError = validateEmail(data.email);
  if (emailError) errors.email = emailError;

  const senhaError = validateSenha(data.senha);
  if (senhaError) errors.senha = senhaError;

  return errors;
};

export const validateCadastroForm = (data: CadastroDTO): FormErrors => {
  const errors: FormErrors = {};

  const nomeError = validateNome(data.nome);
  if (nomeError) errors.nome = nomeError;

  const emailError = validateEmail(data.email);
  if (emailError) errors.email = emailError;

  const senhaError = validateSenha(data.senha);
  if (senhaError) errors.senha = senhaError;

  const confirmacaoError = validateConfirmacaoSenha(data.senha, data.confirmacao_senha);
  if (confirmacaoError) errors.confirmacao_senha = confirmacaoError;

  return errors;
};

// ===========================
// Sanitização de Dados
// ===========================

export const sanitizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

export const sanitizeNome = (nome: string): string => {
  return nome.trim().replace(/\s+/g, ' ');
};

// ===========================
// Utilitários de Hash (simulado para MVP)
// ===========================

import * as Crypto from 'expo-crypto';

export const hashPassword = async (password: string): Promise<string> => {
  // Em produção, use bcrypt ou similar no backend
  // Aqui é uma implementação para MVP local usando expo-crypto
  const saltedPassword = password + 'skillmap_salt_2025';
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    saltedPassword
  );
  return hash;
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  const newHash = await hashPassword(password);
  return newHash === hash;
};
