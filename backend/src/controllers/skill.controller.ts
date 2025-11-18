import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import logger from '../lib/logger';
import type { ApiResponse, Skill } from '../types';

export const getAllSkills = async (_req: Request, res: Response): Promise<void> => {
  try {
    const skills = await prisma.skill.findMany({
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    });

    res.json({
      success: true,
      data: skills,
    } as ApiResponse<Skill[]>);
  } catch (error) {
    logger.error({ error }, 'Get all skills error');
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar skills',
    } as ApiResponse);
  }
};

export const getSkillById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const skill = await prisma.skill.findUnique({
      where: { id },
    });

    if (!skill) {
      res.status(404).json({
        success: false,
        error: 'Skill não encontrada',
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      data: skill,
    } as ApiResponse<Skill>);
  } catch (error) {
    logger.error({ error }, 'Get skill by ID error');
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar skill',
    } as ApiResponse);
  }
};