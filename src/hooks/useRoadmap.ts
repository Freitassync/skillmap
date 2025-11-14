import { useState, useEffect, useCallback } from 'react';
import RoadmapService from '../services/RoadmapService';
import type { IRoadmap, IRoadmapSkill, CriarRoadmapDTO } from '../types/models';

interface UseRoadmapReturn {
  roadmaps: IRoadmap[];
  isLoading: boolean;
  error: string | null;
  carregarRoadmaps: (usuarioId: string) => Promise<void>;
  criarRoadmap: (usuarioId: string, dto: CriarRoadmapDTO) => Promise<IRoadmap | null>;
  deletarRoadmap: (roadmapId: string) => Promise<boolean>;
}

interface UseRoadmapSkillsReturn {
  skills: IRoadmapSkill[];
  isLoading: boolean;
  carregarSkills: (roadmapId: string) => Promise<void>;
  marcarConcluida: (roadmapId: string, skillId: string) => Promise<number>;
}

/**
 * Hook para gerenciar roadmaps do usuário
 */
export const useRoadmap = (): UseRoadmapReturn => {
  const [roadmaps, setRoadmaps] = useState<IRoadmap[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const carregarRoadmaps = useCallback(async (usuarioId: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await RoadmapService.carregarRoadmaps(usuarioId);
      setRoadmaps(data);
    } catch (err) {
      setError('Erro ao carregar roadmaps');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const criarRoadmap = useCallback(
    async (usuarioId: string, dto: CriarRoadmapDTO): Promise<IRoadmap | null> => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await RoadmapService.criarRoadmap(usuarioId, dto);

        if (result.success && result.roadmap) {
          setRoadmaps((prev) => [...prev, result.roadmap!]);
          return result.roadmap;
        } else {
          setError(result.error || 'Erro ao criar roadmap');
          return null;
        }
      } catch (err) {
        setError('Erro inesperado ao criar roadmap');
        console.error(err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deletarRoadmap = useCallback(
    async (roadmapId: string): Promise<boolean> => {
      try {
        const sucesso = await RoadmapService.deletarRoadmap(roadmapId);

        if (sucesso) {
          setRoadmaps((prev) => prev.filter((r) => r.id !== roadmapId));
        }

        return sucesso;
      } catch (err) {
        console.error('Erro ao deletar roadmap:', err);
        return false;
      }
    },
    []
  );

  return {
    roadmaps,
    isLoading,
    error,
    carregarRoadmaps,
    criarRoadmap,
    deletarRoadmap,
  };
};

/**
 * Hook para gerenciar skills de um roadmap específico
 */
export const useRoadmapSkills = (): UseRoadmapSkillsReturn => {
  const [skills, setSkills] = useState<IRoadmapSkill[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const carregarSkills = useCallback(async (roadmapId: string): Promise<void> => {
    try {
      setIsLoading(true);
      const data = await RoadmapService.carregarRoadmapSkills(roadmapId);
      setSkills(data);
    } catch (err) {
      console.error('Erro ao carregar skills:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const marcarConcluida = useCallback(
    async (roadmapId: string, skillId: string): Promise<number> => {
      try {
        const result = await RoadmapService.marcarSkillConcluida(roadmapId, skillId);

        if (result.success) {
          setSkills((prev) =>
            prev.map((skill) =>
              skill.id === skillId
                ? { ...skill, status: 'concluido', data_conclusao: new Date().toISOString() }
                : skill
            )
          );

          return result.xpGanho || 0;
        }

        return 0;
      } catch (err) {
        console.error('Erro ao marcar skill concluída:', err);
        return 0;
      }
    },
    []
  );

  return {
    skills,
    isLoading,
    carregarSkills,
    marcarConcluida,
  };
};
