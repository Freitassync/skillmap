import { MESSAGES } from '../constants';
import ApiClient from './ApiClient';
import { logger } from '../utils/logger';
import type {
  IRoadmap,
  IRoadmapSkill,
  CreateRoadmapDTO,
  RoadmapResult,
} from '../types/models';

class RoadmapService {
  async carregarRoadmaps(userId: string): Promise<IRoadmap[]> {
    try {
      logger.debug('RoadmapService.carregarRoadmaps - User ID:', userId);

      const response = await ApiClient.get<{ roadmaps: IRoadmap[] }>(`/roadmaps/user/${userId}`);

      if (!response.success || !response.data) {
        console.error('Erro ao carregar roadmaps:', response.error);
        return [];
      }

      console.log(`${response.data.roadmaps.length} roadmaps carregados`);
      return response.data.roadmaps;
    } catch (error) {
      console.error('Erro ao carregar roadmaps:', error);
      return [];
    }
  }

  async carregarRoadmapSkills(roadmapId: string): Promise<IRoadmapSkill[]> {
    try {
      logger.debug('RoadmapService.carregarRoadmapSkills - Roadmap ID:', roadmapId);

      const response = await ApiClient.get<{ skills: IRoadmapSkill[] }>(`/roadmaps/${roadmapId}/skills`);

      if (!response.success || !response.data) {
        console.error('Erro ao carregar skills:', response.error);
        return [];
      }

      console.log(`${response.data.skills.length} skills carregadas`);
      return response.data.skills;
    } catch (error) {
      console.error('Erro ao carregar skills do roadmap:', error);
      return [];
    }
  }

  async carregarRoadmapSkillById(
    roadmapId: string,
    skillId: string
  ): Promise<IRoadmapSkill | null> {
    try {
      logger.debug('RoadmapService.carregarRoadmapSkillById');

      const response = await ApiClient.get<{ skill: IRoadmapSkill }>(
        `/roadmaps/${roadmapId}/skills/${skillId}`
      );

      if (!response.success || !response.data) {
        console.error('Erro ao carregar skill:', response.error);
        return null;
      }

      logger.info('Skill carregada com sucesso');
      return response.data.skill;
    } catch (error) {
      console.error('Erro ao carregar skill do roadmap:', error);
      return null;
    }
  }

  // Cria novo roadmap para o usuário
  async criarRoadmap(userId: string, dto: CreateRoadmapDTO): Promise<RoadmapResult> {
    try {
      logger.info('RoadmapService.criarRoadmap');
      console.log('  User ID:', userId);
      console.log('  Carreira:', dto.career_goal);

      // Create roadmap via backend API
      const response = await ApiClient.post<{ roadmap: IRoadmap; skills: IRoadmapSkill[] }>('/roadmaps', {
        user_id: userId,
        title: dto.title,
        career_goal: dto.career_goal,
        experience: dto.experience,
        skills: dto.skills,
      });

      if (!response.success || !response.data) {
        console.error('Erro ao criar roadmap:', response.error);
        return {
          success: false,
          error: response.error || MESSAGES.roadmap.criadoError,
        };
      }

      logger.info('Roadmap criado com sucesso');

      return {
        success: true,
        roadmap: response.data.roadmap,
        skills: response.data.skills,
      };
    } catch (error) {
      console.error('Erro ao criar roadmap:', error);
      return {
        success: false,
        error: MESSAGES.roadmap.criadoError,
      };
    }
  }

  // XP é atualizado automaticamente via trigger PL/PGSQL
  async marcarSkillConcluida(
    roadmapId: string,
    skillId: string
  ): Promise<{ success: boolean }> {
    try {
      logger.debug('RoadmapService.marcarSkillConcluida');

      // Mark skill as completed via backend API
      // Backend trigger automatically awards XP and updates progress
      const response = await ApiClient.put(`/roadmaps/${roadmapId}/skills/${skillId}`, {
        is_concluded: true,
      });

      if (!response.success) {
        console.error('Erro ao marcar skill concluída:', response.error);
        return { success: false };
      }

      logger.info('Skill marcada como concluída (XP atualizado via trigger)');

      return { success: true };
    } catch (error) {
      console.error('Erro ao marcar skill concluída:', error);
      return { success: false };
    }
  }

  async updateMilestoneCompletion(
    roadmapId: string,
    skillId: string,
    milestoneLevel: number,
    completed: boolean
  ): Promise<{ success: boolean; skill?: IRoadmapSkill }> {
    try {
      logger.debug('RoadmapService.updateMilestoneCompletion');

      const response = await ApiClient.put<{ skill: IRoadmapSkill }>(
        `/roadmaps/${roadmapId}/skills/${skillId}/milestones/${milestoneLevel}`,
        { completed }
      );

      if (!response.success || !response.data) {
        console.error('Erro ao atualizar milestone:', response.error);
        return { success: false };
      }

      logger.info('Milestone atualizado com sucesso');
      return {
        success: true,
        skill: response.data.skill,
      };
    } catch (error) {
      console.error('Erro ao atualizar milestone:', error);
      return { success: false };
    }
  }

  // Usa as skills selecionadas pelo usuário na tela
  async generateCompleteRoadmap(
    careerGoal: string,
    experience: string,
    selectedSkillIds: string[] = []
  ): Promise<{ success: boolean; roadmap?: any; error?: string }> {
    try {
      logger.debug('RoadmapService.generateCompleteRoadmap');

      const response = await ApiClient.post('/roadmaps/generate-complete', {
        career_goal: careerGoal,
        experience,
        selected_skill_ids: selectedSkillIds,
      });

      if (!response.success || !response.data) {
        console.error('Erro ao gerar roadmap completo:', response.error);
        return {
          success: false,
          error: response.error || 'Erro ao gerar roadmap com IA',
        };
      }

      logger.info('Roadmap completo gerado com sucesso');
      return {
        success: true,
        roadmap: response.data.roadmap,
      };
    } catch (error: any) {
      console.error('Erro ao gerar roadmap completo:', error);
      return {
        success: false,
        error: error.message || 'Erro ao gerar roadmap com IA',
      };
    }
  }

  async deletarRoadmap(roadmapId: string): Promise<boolean> {
    try {
      console.log(' RoadmapService.deletarRoadmap - Roadmap ID:', roadmapId);

      // Delete roadmap via backend API
      const response = await ApiClient.delete(`/roadmaps/${roadmapId}`);

      if (!response.success) {
        console.error('Erro ao deletar roadmap:', response.error);
        return false;
      }

      logger.info('Roadmap deletado com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao deletar roadmap:', error);
      return false;
    }
  }
}

export default new RoadmapService();
