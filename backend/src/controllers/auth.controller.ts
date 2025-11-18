import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../lib/prisma';
import logger from '../lib/logger';
import { generateToken, AuthRequest } from '../middleware/auth.middleware';
import type { RegisterDTO, LoginDTO, AuthResponse } from '../types';

const SALT_ROUNDS = 10;

/**
 * Register new user
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, senha }: RegisterDTO = req.body;

    // Validation
    if (!name || !email || !senha) {
      res.status(400).json({
        success: false,
        error: 'Nome, email e senha são obrigatórios',
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        error: 'Email inválido',
      });
      return;
    }

    // Password validation (min 6 characters)
    if (senha.length < 6) {
      res.status(400).json({
        success: false,
        error: 'Senha deve ter no mínimo 6 caracteres',
      });
      return;
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'Email já cadastrado',
      });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(senha, SALT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        xpLevel: 1,
        currentXp: 0,
      },
      select: {
        id: true,
        name: true,
        email: true,
        xpLevel: true,
        currentXp: true,
        creationDate: true,
      },
    });

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        xp_level: user.xpLevel,
        current_xp: user.currentXp,
        creation_date: user.creationDate,
      },
    } as AuthResponse);
  } catch (error) {
    logger.error({ error }, 'Register error');
    res.status(500).json({
      success: false,
      error: 'Erro ao criar usuário',
    });
  }
};

/**
 * Login user
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, senha }: LoginDTO = req.body;

    // Validation
    if (!email || !senha) {
      res.status(400).json({
        success: false,
        error: 'Email e senha são obrigatórios',
      });
      return;
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Email ou senha inválidos',
      });
      return;
    }

    // Verify password
    const validPassword = await bcrypt.compare(senha, user.passwordHash);

    if (!validPassword) {
      res.status(401).json({
        success: false,
        error: 'Email ou senha inválidos',
      });
      return;
    }

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        xp_level: user.xpLevel,
        current_xp: user.currentXp,
        creation_date: user.creationDate,
      },
    } as AuthResponse);
  } catch (error) {
    logger.error({ error }, 'Login error');
    res.status(500).json({
      success: false,
      error: 'Erro ao fazer login',
    });
  }
};

/**
 * Verify token and get current user
 */
export const verifySession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // userId is set by authMiddleware
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Sessão inválida',
      });
      return;
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        xpLevel: true,
        currentXp: true,
        creationDate: true,
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'Usuário não encontrado',
      });
      return;
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        xp_level: user.xpLevel,
        current_xp: user.currentXp,
        creation_date: user.creationDate,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Verify session error');
    res.status(500).json({
      success: false,
      error: 'Erro ao verificar sessão',
    });
  }
};

