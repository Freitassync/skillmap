import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { generateToken, AuthRequest } from '../middleware/auth.middleware';
import { UserFormatter } from '../utils/formatters';
import { passwordHasher } from '../services/PasswordHashingService';
import { asyncHandler } from '../middleware/asyncHandler';
import type { RegisterDTO, LoginDTO, ApiResponse } from '../types';

export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { name, email, senha }: RegisterDTO = req.body;

  if (!name || !email || !senha) {
    res.status(400).json({
      success: false,
      error: 'Nome, email e senha são obrigatórios',
    } as ApiResponse);
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({
      success: false,
      error: 'Email inválido',
    } as ApiResponse);
    return;
  }

  if (senha.length < 6) {
    res.status(400).json({
      success: false,
      error: 'Senha deve ter no mínimo 6 caracteres',
    } as ApiResponse);
    return;
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    res.status(409).json({
      success: false,
      error: 'Email já cadastrado',
    } as ApiResponse);
    return;
  }

  const passwordHash = await passwordHasher.hash(senha);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      currentXp: 0,
    },
  });

  const token = generateToken(user.id, user.email);

  res.status(201).json(UserFormatter.toAuthResponse(user, token));
});

export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, senha }: LoginDTO = req.body;

  if (!email || !senha) {
    res.status(400).json({
      success: false,
      error: 'Email e senha são obrigatórios',
    } as ApiResponse);
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    res.status(401).json({
      success: false,
      error: 'Email ou senha inválidos',
    } as ApiResponse);
    return;
  }

  const validPassword = await passwordHasher.verify(senha, user.passwordHash);

  if (!validPassword) {
    res.status(401).json({
      success: false,
      error: 'Email ou senha inválidos',
    } as ApiResponse);
    return;
  }

  const token = generateToken(user.id, user.email);

  res.json(UserFormatter.toAuthResponse(user, token));
});

export const verifySession = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId;

  if (!userId) {
    res.status(401).json({
      success: false,
      error: 'Sessão inválida',
    } as ApiResponse);
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    res.status(404).json({
      success: false,
      error: 'Usuário não encontrado',
    } as ApiResponse);
    return;
  }

  res.json({
    success: true,
    data: {
      user: UserFormatter.toApi(user),
    },
  } as ApiResponse);
});

