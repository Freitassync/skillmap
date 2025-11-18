import { Response } from 'express';
import OpenAI from 'openai';
import prisma from '../lib/prisma';
import logger from '../lib/logger';
import { AuthRequest } from '../middleware/auth.middleware';
import { JsonParserService } from '../services/JsonParserService';
import type { CreateRoadmapDTO, ApiResponse} from '../types';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;
export const createRoadmap = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { title, career_goal, experience, skills }: CreateRoadmapDTO = req.body;

    if (!title || !career_goal || !experience) {
      res.status(400).json({
        success: false,
        error: 'Título, objetivo de carreira e nível de experiência são obrigatórios',
      } as ApiResponse);
      return;
    }

    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Pelo menos uma skill é obrigatória',
      } as ApiResponse);
      return;
    }

    const roadmap = await prisma.roadmap.create({
      data: {
        userId: userId!,
        title,
        careerGoal: career_goal,
        experience: experience,
        percentualProgress: 0,
        roadmapSkills: {
          create: skills.map((skillId, index) => ({
            skillId,
            order: index + 1,
            isConcluded: false,
          })),
        },
      },
      include: {
        roadmapSkills: {
          include: {
            skill: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: roadmap,
    } as ApiResponse);
  } catch (error) {
    logger.error({ error }, 'Create roadmap error');
    res.status(500).json({
      success: false,
      error: 'Erro ao criar roadmap',
    } as ApiResponse);
  }
};

export const getUserRoadmaps = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    if (req.userId !== userId) {
      res.status(403).json({
        success: false,
        error: 'Acesso negado',
      } as ApiResponse);
      return;
    }

    const roadmaps = await prisma.roadmap.findMany({
      where: { userId: userId },
      include: {
        roadmapSkills: {
          include: {
            skill: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        creationDate: 'desc',
      },
    });

    const formattedRoadmaps = roadmaps.map((roadmap: any) => ({
      ...roadmap,
      percentualProgress: Number(roadmap.percentualProgress),
      skills: roadmap.roadmapSkills.map((rs: any) => ({
        id: rs.id,
        skill_id: rs.skill.id,
        name: rs.skill.name,
        description: rs.skill.description,
        type: rs.skill.type,
        category: rs.skill.category,
        order: rs.order,
        is_concluded: rs.isConcluded,
        conclusion_date: rs.conclusionDate,
      })),
      roadmapSkills: undefined,
    })).map(({ roadmapSkills, ...rest }: any) => rest);

    res.json({
      success: true,
      data: { roadmaps: formattedRoadmaps },
    } as ApiResponse);
  } catch (error) {
    logger.error({ error }, 'Get user roadmaps error');
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar roadmaps',
    } as ApiResponse);
  }
};

export const getRoadmapById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const roadmap = await prisma.roadmap.findUnique({
      where: { id },
      include: {
        roadmapSkills: {
          include: {
            skill: true,
            resources: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!roadmap) {
      res.status(404).json({
        success: false,
        error: 'Roadmap não encontrado',
      } as ApiResponse);
      return;
    }

    if (roadmap.userId !== userId) {
      res.status(403).json({
        success: false,
        error: 'Acesso negado',
      } as ApiResponse);
      return;
    }

    const formattedRoadmap = {
      ...roadmap,
      skills: roadmap.roadmapSkills.map((rs: any) => ({
        id: rs.id,
        skill_id: rs.skill.id,
        name: rs.skill.name,
        description: rs.skill.description,
        type: rs.skill.type,
        category: rs.skill.category,
        order: rs.order,
        is_concluded: rs.isConcluded,
        conclusion_date: rs.conclusionDate,
        milestones: rs.milestones || [],
        learning_objectives: rs.learningObjectives || '',
        prerequisites: rs.prerequisites || [],
        estimated_hours: rs.estimatedHours || 0,
        resources: rs.resources?.map((r: any) => ({
          id: r.id,
          type: r.type,
          title: r.title,
          url: r.url,
          platform: r.platform,
          is_free: r.isFree,
        })) || [],
      })),
    };

    delete (formattedRoadmap as any).roadmapSkills;

    res.json({
      success: true,
      data: {
        roadmap: formattedRoadmap,
        skills: formattedRoadmap.skills,
      },
    } as ApiResponse);
  } catch (error) {
    logger.error({ error }, 'Get roadmap by ID error');
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar roadmap',
    } as ApiResponse);
  }
};

export const getRoadmapSkills = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const roadmap = await prisma.roadmap.findUnique({
      where: { id },
      include: {
        roadmapSkills: {
          include: {
            skill: true,
            resources: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!roadmap) {
      res.status(404).json({
        success: false,
        error: 'Roadmap não encontrado',
      } as ApiResponse);
      return;
    }

    if (roadmap.userId !== userId) {
      res.status(403).json({
        success: false,
        error: 'Acesso negado',
      } as ApiResponse);
      return;
    }

    const allPrerequisiteIds = new Set<string>();
    roadmap.roadmapSkills.forEach((rs: any) => {
      const prereqIds = (rs.prerequisites as string[]) || [];
      prereqIds.forEach(id => allPrerequisiteIds.add(id));
    });

    const prerequisiteSkillsMap = new Map<string, { id: string; name: string }>();
    if (allPrerequisiteIds.size > 0) {
      const skills = await prisma.skill.findMany({
        where: {
          id: {
            in: Array.from(allPrerequisiteIds),
          },
        },
        select: {
          id: true,
          name: true,
        },
      });
      skills.forEach(s => prerequisiteSkillsMap.set(s.id, { id: s.id, name: s.name }));
    }

    const formattedSkills = roadmap.roadmapSkills.map((rs: any) => {
      const prerequisiteIds = (rs.prerequisites as string[]) || [];
      const prerequisiteSkills = prerequisiteIds
        .map(id => prerequisiteSkillsMap.get(id))
        .filter(Boolean) as Array<{ id: string; name: string }>;

      return {
        id: rs.id,
        roadmap_id: roadmap.id,
        skill_id: rs.skill.id,
        skill: {
          id: rs.skill.id,
          name: rs.skill.name,
          description: rs.skill.description,
          type: rs.skill.type,
          category: rs.skill.category,
        },
        order: rs.order,
        status: rs.isConcluded ? 'concluido' : 'pendente',
        is_concluded: rs.isConcluded,
        conclusion_date: rs.conclusionDate,
        milestones: rs.milestones || [],
        learning_objectives: rs.learningObjectives || '',
        prerequisites: prerequisiteSkills,
        estimated_hours: rs.estimatedHours || 0,
        resources: rs.resources?.map((r: any) => ({
          id: r.id,
          type: r.type,
          title: r.title,
          url: r.url,
          platform: r.platform,
          is_free: r.isFree,
        })) || [],
      };
    });

    res.json({
      success: true,
      data: { skills: formattedSkills },
    } as ApiResponse);
  } catch (error) {
    logger.error({ error }, 'Get roadmap skills error');
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar skills do roadmap',
    } as ApiResponse);
  }
};

// Get a single skill from a roadmap by ID
// GET /api/roadmaps/:id/skills/:skillId
export const getRoadmapSkillById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, skillId } = req.params;
    const userId = req.userId;

    const roadmap = await prisma.roadmap.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!roadmap) {
      res.status(404).json({
        success: false,
        error: 'Roadmap não encontrado',
      } as ApiResponse);
      return;
    }

    if (roadmap.userId !== userId) {
      res.status(403).json({
        success: false,
        error: 'Acesso negado',
      } as ApiResponse);
      return;
    }

    const roadmapSkill = await prisma.roadmapSkill.findFirst({
      where: {
        id: skillId,
        roadmapId: id,
      },
      include: {
        skill: true,
        resources: true,
      },
    });

    if (!roadmapSkill) {
      res.status(404).json({
        success: false,
        error: 'Skill não encontrada neste roadmap',
      } as ApiResponse);
      return;
    }

    const prerequisiteIds = (roadmapSkill.prerequisites as string[]) || [];
    let prerequisiteSkills: Array<{ id: string; name: string }> = [];

    if (prerequisiteIds.length > 0) {
      const skills = await prisma.skill.findMany({
        where: {
          id: {
            in: prerequisiteIds,
          },
        },
        select: {
          id: true,
          name: true,
        },
      });
      prerequisiteSkills = skills.map(s => ({ id: s.id, name: s.name }));
    }

    const formattedSkill = {
      id: roadmapSkill.id,
      roadmap_id: roadmapSkill.roadmapId,
      skill_id: roadmapSkill.skill.id,
      skill: {
        id: roadmapSkill.skill.id,
        name: roadmapSkill.skill.name,
        description: roadmapSkill.skill.description,
        type: roadmapSkill.skill.type,
        category: roadmapSkill.skill.category,
      },
      order: roadmapSkill.order,
      status: roadmapSkill.isConcluded ? 'concluido' : 'pendente',
      is_concluded: roadmapSkill.isConcluded,
      conclusion_date: roadmapSkill.conclusionDate,
      milestones: roadmapSkill.milestones || [],
      learning_objectives: roadmapSkill.learningObjectives || '',
      prerequisites: prerequisiteSkills,
      estimated_hours: roadmapSkill.estimatedHours || 0,
      resources: roadmapSkill.resources?.map((r: any) => ({
        id: r.id,
        type: r.type,
        title: r.title,
        url: r.url,
        platform: r.platform,
        is_free: r.isFree,
      })) || [],
    };

    res.json({
      success: true,
      data: { skill: formattedSkill },
    } as ApiResponse);
  } catch (error) {
    logger.error({ error }, 'Get roadmap skill by ID error');
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar skill do roadmap',
    } as ApiResponse);
  }
};

// Update skill progress (mark as completed)
// Database triggers handle XP calculation and award
export const updateSkillProgress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id: roadmapId, skillId } = req.params; // skillId is actually roadmapSkillId
    const userId = req.userId;

    const currentSkill = await prisma.roadmapSkill.findFirst({
      where: {
        id: skillId,
        roadmapId: roadmapId,
        roadmap: {
          userId: userId,
        },
      },
    });

    if (!currentSkill) {
      res.status(404).json({
        success: false,
        error: 'Skill não encontrada ou acesso negado.',
      } as ApiResponse);
      return;
    }

    const updatedSkill = await prisma.roadmapSkill.update({
      where: {
        id: skillId,
      },
      data: {
        isConcluded: !currentSkill.isConcluded,
        conclusionDate: !currentSkill.isConcluded ? new Date() : null,
      },
    });

    res.json({
      success: true,
      data: {
        roadmapSkill: updatedSkill
      },
    } as ApiResponse);
  } catch (error) {
    logger.error({ error }, 'Update skill progress error');
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar progresso da skill',
    } as ApiResponse);
  }
};

//Update milestone completion status
//PUT /api/roadmaps/:id/skills/:skillId/milestones/:level
export const updateMilestoneProgress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, skillId, level } = req.params;
    const { completed } = req.body;
    const userId = req.userId;

    if (typeof completed !== 'boolean') {
      res.status(400).json({
        success: false,
        error: 'O campo "completed" deve ser um booleano',
      } as ApiResponse);
      return;
    }

    const milestoneLevel = parseInt(level, 10);
    if (isNaN(milestoneLevel)) {
      res.status(400).json({
        success: false,
        error: 'Nível do milestone inválido',
      } as ApiResponse);
      return;
    }

    const currentSkill = await prisma.roadmapSkill.findUnique({
      where: { id: skillId },
      include: {
        roadmap: { select: { userId: true } },
        skill: true,
      },
    });

    if (!currentSkill) {
      res.status(404).json({
        success: false,
        error: 'Skill não encontrada neste roadmap',
      } as ApiResponse);
      return;
    }

    if (currentSkill.roadmap.userId !== userId) {
      res.status(403).json({
        success: false,
        error: 'Acesso negado',
      } as ApiResponse);
      return;
    }

    if (currentSkill.roadmapId !== id) {
      res.status(404).json({
        success: false,
        error: 'Skill não pertence a este roadmap',
      } as ApiResponse);
      return;
    }

    const milestones = (currentSkill.milestones as any[]) || [];
    const milestoneIndex = milestones.findIndex((m: any) => m.level === milestoneLevel);

    if (milestoneIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'Milestone não encontrado',
      } as ApiResponse);
      return;
    }

    milestones[milestoneIndex].completed = completed;

    const updatedSkill = await prisma.roadmapSkill.update({
      where: { id: skillId },
      data: { milestones },
      include: {
        skill: true,
        resources: true,
      },
    });

    const formattedSkill = {
      id: updatedSkill.id,
      roadmap_id: updatedSkill.roadmapId,
      skill_id: updatedSkill.skill.id,
      skill: {
        id: updatedSkill.skill.id,
        name: updatedSkill.skill.name,
        description: updatedSkill.skill.description,
        type: updatedSkill.skill.type,
        category: updatedSkill.skill.category,
      },
      order: updatedSkill.order,
      status: updatedSkill.isConcluded ? 'concluido' : 'pendente',
      is_concluded: updatedSkill.isConcluded,
      conclusion_date: updatedSkill.conclusionDate,
      milestones: updatedSkill.milestones || [],
      learning_objectives: updatedSkill.learningObjectives || '',
      prerequisites: updatedSkill.prerequisites || [],
      estimated_hours: updatedSkill.estimatedHours || 0,
      resources: updatedSkill.resources?.map((r: any) => ({
        id: r.id,
        type: r.type,
        title: r.title,
        url: r.url,
        platform: r.platform,
        is_free: r.isFree,
      })) || [],
    };

    res.json({
      success: true,
      data: { skill: formattedSkill },
    } as ApiResponse);
  } catch (error) {
    logger.error({ error }, 'Update milestone progress error');
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar progresso do milestone',
    } as ApiResponse);
  }
};

// Delete roadmap by ID
export const deleteRoadmap = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const roadmap = await prisma.roadmap.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!roadmap) {
      res.status(404).json({
        success: false,
        error: 'Roadmap não encontrado',
      } as ApiResponse);
      return;
    }

    if (roadmap.userId !== userId) {
      res.status(403).json({
        success: false,
        error: 'Acesso negado',
      } as ApiResponse);
      return;
    }

    await prisma.roadmap.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Roadmap deletado com sucesso',
    } as ApiResponse);
  } catch (error) {
    logger.error({ error }, 'Delete roadmap error');
    res.status(500).json({
      success: false,
      error: 'Erro ao deletar roadmap',
    } as ApiResponse);
  }
};

export const generateRoadmapSuggestions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { career_goal, experience } = req.body;

    if (!career_goal || !experience) {
      res.status(400).json({
        success: false,
        error: 'Objetivo de carreira e nível de experiência são obrigatórios',
      } as ApiResponse);
      return;
    }

    const allSkills = await prisma.skill.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        category: true,
      },
      orderBy: [
        { type: 'asc' },
        { category: 'asc' },
        { name: 'asc' },
      ],
    });

    if (!openai) {
      logger.warn('OpenAI not configured, returning basic skill suggestions');

      const suggestions = allSkills.slice(0, 10).map((skill) => ({
        skill_id: skill.id,
        name: skill.name,
        type: skill.type,
        category: skill.category,
        reason: 'Skill recomendada para beginners',
      }));

      const title = `Trilha de Carreira: ${career_goal}`;

      res.json({
        success: true,
        data: {
          title,
          suggestions
        },
      } as ApiResponse);
      return;
    }

    const skillsList = allSkills
      .map((s) => `- ${s.name} (${s.type} skill, category: ${s.category || 'geral'})`)
      .join('\n');

    const prompt = `Você é um consultor de carreira especializado em tecnologia e desenvolvimento profissional.

Objetivo de carreira do usuário: ${career_goal}
Nível de experiência: ${experience}

Skills disponíveis em nosso banco de dados:
${skillsList}

Analise o objetivo de carreira e o nível de experiência do usuário e sugira 5-10 skills da lista acima que sejam mais relevantes para alcançar esse objetivo. Priorize skills fundamentais primeiro, depois intermediárias e avançadas.

Retorne APENAS um JSON válido no seguinte formato (sem markdown, sem code blocks):
{
  "skills": [
    {
      "name": "name exato da skill da lista acima",
    }
  ]
}`;

    const response = await openai!.responses.create({
      model: 'gpt-4.1-mini',
      tools: [{ type: 'web_search' }],
      input: [
        {
          role: 'system',
          content: 'You are a career roadmap expert. Return ONLY pure JSON without markdown formatting, code blocks, or any other text. No ```json tags.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ]
    });

    const aiResponse = response.output_text;
    if (!aiResponse) {
      throw new Error('Empty response from OpenAI');
    }

    const cleanedJson = JsonParserService.stripMarkdownJson(aiResponse);
    const parsedResponse = await JsonParserService.parseWithFallback(cleanedJson, 'roadmap suggestions');
    const { skills: aiSkills } = parsedResponse;

    const suggestions = aiSkills
      .map((aiSkill: any) => {
        const matchedSkill = allSkills.find(
          (dbSkill) => dbSkill.name?.toLowerCase() === aiSkill.name?.toLowerCase()
        );

        if (!matchedSkill) {
          logger.warn(`AI suggested skill not found in DB: ${aiSkill.name}`);
          return null;
        }

        return {
          skill_id: matchedSkill.id,
          name: matchedSkill.name,
          type: matchedSkill.type,
          category: matchedSkill.category,
          reason: aiSkill.reason,
        };
      })
      .filter(Boolean);

    logger.info(`Generated ${suggestions.length} skill suggestions for career: ${career_goal}`);

    res.json({
      success: true,
      data: {
        suggestions
      },
    } as ApiResponse);
  } catch (error: any) {
    logger.error({ error: error.message }, 'Generate roadmap suggestions error');
    res.status(500).json({
      success: false,
      error: 'Erro ao gerar sugestões de roadmap',
    } as ApiResponse);
  }
};

// Generate complete AI-powered roadmap with web search for resources
// POST /api/roadmaps/generate-complete
export const generateCompleteRoadmap = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { career_goal, experience, selected_skill_ids } = req.body;

    if (!career_goal || !experience) {
      res.status(400).json({
        success: false,
        error: 'Meta de carreira e nível de experiência são obrigatórios',
      } as ApiResponse);
      return;
    }

    if (!selected_skill_ids || !Array.isArray(selected_skill_ids) || selected_skill_ids.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Pelo menos uma skill deve ser selecionada',
      } as ApiResponse);
      return;
    }

    const allSkills = await prisma.skill.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        category: true,
      },
      orderBy: [
        { type: 'asc' },
        { category: 'asc' },
        { name: 'asc' },
      ],
    });

    const selectedSkills = allSkills.filter((s: any) => selected_skill_ids.includes(s.id));

    if (selectedSkills.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Nenhuma skill válida foi selecionada',
      } as ApiResponse);
      return;
    }

    const selectedSkillNames = selectedSkills.map((s: any) => s.name).join(', ');

    if (!openai) {
      logger.warn('OpenAI not configured, creating basic roadmap');

      const roadmap = await prisma.roadmap.create({
        data: {
          userId: userId!,
          title: `Trilha: ${career_goal}`,
          careerGoal: career_goal,
          experience: experience,
          percentualProgress: 0,
          roadmapSkills: {
            create: selectedSkills.map((skill: any, index: number) => ({
              skillId: skill.id,
              order: index + 1,
              isConcluded: false,
            })),
          },
        },
        include: {
          roadmapSkills: {
            include: {
              skill: true,
            },
            orderBy: {
              order: 'asc',
            },
          },
        },
      });

      const formattedRoadmap = {
        ...roadmap,
        skills: roadmap.roadmapSkills.map((rs: any) => ({
          id: rs.id,
          skill_id: rs.skill.id,
          name: rs.skill.name,
          description: rs.skill.description,
          type: rs.skill.type,
          category: rs.skill.category,
          order: rs.order,
          is_concluded: rs.isConcluded,
        })),
      };

      delete (formattedRoadmap as any).roadmapSkills;

      res.json({
        success: true,
        data: { roadmap: formattedRoadmap },
      } as ApiResponse);
      return;
    }

    const skillsList = selectedSkills
      .map((s: any) => `- ${s.name} (${s.type} skill, ${s.category || 'geral'})`)
      .join('\n');

    const prompt = `Você é um consultor de carreira especializado em tecnologia.

Meta de carreira: ${career_goal}
Nível de experiência: ${experience}
Skills selecionadas pelo usuário: ${selectedSkillNames}

O usuário selecionou as seguintes skills para criar seu roadmap de aprendizado:
${skillsList}

IMPORTANTE: Use APENAS as skills listadas acima. NÃO sugira skills adicionais.

Organize essas skills na ordem ideal de aprendizado (skills fundamentais primeiro, depois intermediárias e avançadas). Identifique quais skills são pré-requisitos para outras.

Retorne um JSON válido com:
{
  "titulo": "Título inspirador para o roadmap (máx 60 chars)",
  "skills": [
    {
      "name": "nome EXATO da skill da lista acima",
      "description": "por que essa skill é importante (máx 100 chars)",
      "estimated_hours": 20,
      "prerequisites": ["nome da skill 1", "nome da skill 2"]
    }
  ]
}`;

    const response = await openai!.responses.create({
      model: 'gpt-4.1-mini',
      tools: [{ type: 'web_search' }],
      input: [
        {
          role: 'system',
          content: 'You are a career roadmap expert. Return ONLY pure JSON without markdown formatting, code blocks, or any other text. No ```json tags.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ]
    });

    const aiResponse = response.output_text;
    if (!aiResponse) {
      throw new Error('Empty AI response');
    }

    const cleanedJson = JsonParserService.stripMarkdownJson(aiResponse);
    const parsedResponse = await JsonParserService.parseWithFallback(cleanedJson, 'complete roadmap structure');
    const { titulo, skills: aiSkills } = parsedResponse;

    const skillsMap = new Map();
    aiSkills.forEach((aiSkill: any) => {
      const matched = selectedSkills.find(
        (dbSkill: any) => dbSkill.name?.toLowerCase() === aiSkill.name?.toLowerCase()
      );
      if (matched && !skillsMap.has(matched.id)) {
        skillsMap.set(matched.id, {
          ...matched,
          estimated_hours: aiSkill.estimated_hours || 20,
          prerequisites: aiSkill.prerequisites || [],
          learning_objectives: aiSkill.description || ''
        });
      }
    });

    const organizedSkills = Array.from(skillsMap.values());

    if (organizedSkills.length === 0) {
      throw new Error('No matching skills found');
    }

    logger.info(`AI organized ${organizedSkills.length} selected skills for: ${career_goal}`);

    const batchPrompt = `Para as seguintes skills de um roadmap de ${career_goal}, encontre 2-3 recursos de aprendizado GRATUITOS para CADA skill e crie 5-7 marcos progressivos de aprendizado para CADA skill.

Skills: ${organizedSkills.map((s: any) => s.name).join(', ')}

PRIORIZE recursos GRATUITOS:
- cursos/tutoriais (freeCodeCamp, sites de cursos gratuitos, Udemy gratuitos)
- documentação oficial (MDN, docs oficiais)
- tutoriais em vídeo (YouTube canais respeitáveis)
- projetos práticos com repos no GitHub
- evite links de playlists do YouTube que geralmente estão quebrados ou desatualizados

IMPORTANTE:
- Todos os marcos (milestones) devem estar em PORTUGUÊS
- Títulos e objetivos dos marcos devem ser claros e acionáveis
- Recursos podem estar em inglês ou português

Retorne JSON com esta estrutura EXATA:
{
  "skills_data": [
    {
      "skill_name": "nome exato da skill da lista",
      "resources": [
        {
          "title": "título do recurso",
          "url": "https://...",
          "type": "curso|artigo|vídeo|tutorial|documentação|projeto|etc",
          "platform": "nome da plataforma",
          "is_free": true
        }
      ],
      "milestones": [
        {
          "level": 1,
          "title": "Título do marco em português (máx 50 chars)",
          "objectives": ["objetivo 1", "objetivo 2", "objetivo 3"]
        }
      ]
    }
  ]
}`;

    let skillsWithResources;

    try {
      const batchResponse = await openai!.responses.create({
        model: 'gpt-4.1-mini',
        tools: [{ type: 'web_search' }],
        input: [
          { role: 'system', content: 'Return ONLY pure JSON without markdown formatting, code blocks, or any other text. No ```json tags.' },
          { role: 'user', content: batchPrompt },
        ]
      });

      const batchContent = batchResponse.output_text;
      logger.debug(`Raw batch API response (first 1000 chars): ${batchContent.substring(0, 1000)}`);

      const cleanedBatchJson = JsonParserService.stripMarkdownJson(batchContent);
      logger.debug(`Cleaned batch JSON (first 1000 chars): ${cleanedBatchJson.substring(0, 1000)}`);

      const batchData = await JsonParserService.parseWithFallback(cleanedBatchJson, 'batch resource and milestones data');

      skillsWithResources = organizedSkills.map((skill: any) => {
        const skillData = batchData.skills_data?.find(
          (sd: any) => sd.skill_name?.toLowerCase() === skill.name?.toLowerCase()
        );

        if (!skillData) {
          logger.warn(`No batch data found for skill: "${skill.name}". Available skill names in batch: ${batchData.skills_data?.map((sd: any) => sd.skill_name).join(', ')}`);
        }

        return {
          ...skill,
          resources: skillData?.resources || [],
          milestones: skillData?.milestones || [],
        };
      });

      const skillsWithResources_count = skillsWithResources.filter((s: any) => s.resources?.length > 0).length;
      const skillsWithMilestones_count = skillsWithResources.filter((s: any) => s.milestones?.length > 0).length;

      logger.info(`Batch processing complete: ${skillsWithResources_count}/${organizedSkills.length} skills have resources, ${skillsWithMilestones_count}/${organizedSkills.length} skills have milestones`);

      if (skillsWithResources_count < organizedSkills.length || skillsWithMilestones_count < organizedSkills.length) {
        logger.warn(`Some skills are missing data. Skills without resources: ${organizedSkills.length - skillsWithResources_count}, Skills without milestones: ${organizedSkills.length - skillsWithMilestones_count}`);
      }
    } catch (error: any) {
      logger.error(`Batch resource fetch failed: ${error.message}`);
      skillsWithResources = organizedSkills.map((skill: any) => ({
        ...skill,
        resources: [],
        milestones: [],
      }));
    }

    const skillNameToId = new Map(skillsWithResources.map((s: any) => [s.name?.toLowerCase(), s.id]));

    const skillsWithMappedPrereqs = skillsWithResources.map((skill: any) => {
      const prerequisiteIds = (skill.prerequisites || [])
        .map((prereqName: string) => skillNameToId.get(prereqName?.toLowerCase()))
        .filter(Boolean);

      return {
        ...skill,
        prerequisiteIds,
      };
    });

    const roadmap = await prisma.roadmap.create({
      data: {
        userId: userId!,
        title: titulo || `Trilha: ${career_goal}`,
        careerGoal: career_goal,
        experience: experience,
        percentualProgress: 0,
        roadmapSkills: {
          create: skillsWithMappedPrereqs.map((skill: any, index: number) => ({
            skillId: skill.id,
            order: index + 1,
            isConcluded: false,
            milestones: skill.milestones.map((m: any) => ({ ...m, completed: false })),
            learningObjectives: skill.learning_objectives || '',
            prerequisites: skill.prerequisiteIds || [],
            estimatedHours: skill.estimated_hours || 20,
          })),
        },
      },
      include: {
        roadmapSkills: {
          include: {
            skill: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    const skillIdToRoadmapSkillId = new Map(
      (roadmap.roadmapSkills as any[]).map((rs: any) => [rs.skillId, rs.id])
    );

    for (const skillData of skillsWithMappedPrereqs) {
      if (skillData.resources && skillData.resources.length > 0) {
        const roadmapSkillId = skillIdToRoadmapSkillId.get(skillData.id);

        if (!roadmapSkillId) {
          logger.warn(`No roadmapSkill found for skill ${skillData.id}, skipping resources`);
          continue;
        }

        await prisma.skillResource.createMany({
          data: skillData.resources.map((resource: any) => ({
            roadmapSkillId: roadmapSkillId,
            type: resource.type || 'article',
            title: resource.title,
            url: resource.url,
            platform: resource.platform,
            isFree: resource.is_free !== undefined ? resource.is_free : true,
          })),
          skipDuplicates: true,
        });
      }
    }

    const completeRoadmap = await prisma.roadmap.findUnique({
      where: { id: roadmap.id },
      include: {
        roadmapSkills: {
          include: {
            skill: true,
            resources: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    const formattedRoadmap = {
      ...completeRoadmap,
      skills: completeRoadmap!.roadmapSkills.map((rs: any) => ({
        id: rs.id,
        skill_id: rs.skill.id,
        name: rs.skill.name,
        description: rs.skill.description,
        type: rs.skill.type,
        category: rs.skill.category,
        order: rs.order,
        is_concluded: rs.isConcluded,
        milestones: rs.milestones || [],
        learning_objectives: rs.learningObjectives || '',
        prerequisites: rs.prerequisites || [],
        estimated_hours: rs.estimatedHours || 0,
        resources: rs.resources?.map((r: any) => ({
          id: r.id,
          type: r.type,
          title: r.title,
          url: r.url,
          platform: r.platform,
          is_free: r.isFree,
        })) || [],
      })),
    };

    delete (formattedRoadmap as any).roadmapSkills;

    logger.info(`Created roadmap "${titulo}" with ${organizedSkills.length} selected skills and resources`);

    res.status(201).json({
      success: true,
      data: { roadmap: formattedRoadmap },
    } as ApiResponse);
  } catch (error: any) {
    logger.error({ error: error.message }, 'Generate complete roadmap error');
    res.status(500).json({
      success: false,
      error: 'Erro ao gerar roadmap completo',
    } as ApiResponse);
  }
};
