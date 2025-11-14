import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { STORAGE_KEYS, MESSAGES, GAMIFICATION } from '../constants';
import type {
  ISkill,
  IRoadmap,
  IRoadmapSkill,
  CriarRoadmapDTO,
  RoadmapResult,
} from '../types/models';

// ===========================
// Pool de Skills Simuladas (IA Mock)
// ===========================

const SKILL_POOL: ISkill[] = [
  {
    id: 'skill-001',
    nome: 'Fundamentos de IA',
    tipo: 'hard',
    descricao: 'Bases matemáticas, estatística aplicada e conceitos de machine learning.',
  },
  {
    id: 'skill-002',
    nome: 'Prompt Engineering',
    tipo: 'hard',
    descricao: 'Estratégias para dialogar com modelos de linguagem de forma eficiente.',
  },
  {
    id: 'skill-003',
    nome: 'Python Avançado',
    tipo: 'hard',
    descricao: 'Programação orientada a objetos, async/await, decorators e type hints.',
  },
  {
    id: 'skill-004',
    nome: 'TensorFlow & PyTorch',
    tipo: 'hard',
    descricao: 'Frameworks para deep learning e treinamento de modelos neurais.',
  },
  {
    id: 'skill-005',
    nome: 'MLOps',
    tipo: 'hard',
    descricao: 'Deploy, monitoramento e versionamento de modelos em produção.',
  },
  {
    id: 'skill-006',
    nome: 'Comunicação Não Violenta',
    tipo: 'soft',
    descricao: 'Técnicas de diálogo empático para liderar times multidisciplinares.',
  },
  {
    id: 'skill-007',
    nome: 'Gestão do Tempo',
    tipo: 'soft',
    descricao: 'Práticas para manter ritmo sustentável durante requalificação.',
  },
  {
    id: 'skill-008',
    nome: 'Pensamento Crítico',
    tipo: 'soft',
    descricao: 'Análise de problemas complexos e tomada de decisões baseada em dados.',
  },
  {
    id: 'skill-009',
    nome: 'Liderança Técnica',
    tipo: 'soft',
    descricao: 'Mentoria de júniores e condução de code reviews construtivos.',
  },
  {
    id: 'skill-010',
    nome: 'Ética em IA',
    tipo: 'hard',
    descricao: 'Viés algorítmico, privacidade de dados e responsabilidade social.',
  },
];

// ===========================
// RoadmapService - Gerenciamento de Roadmaps
// ===========================

class RoadmapService {
  /**
   * Carrega todos os roadmaps do usuário
   */
  async carregarRoadmaps(usuarioId: string): Promise<IRoadmap[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ROADMAPS);
      if (!data) return [];

      const allRoadmaps: IRoadmap[] = JSON.parse(data);
      return allRoadmaps.filter((r) => r.usuario_id === usuarioId);
    } catch (error) {
      console.error('Erro ao carregar roadmaps:', error);
      return [];
    }
  }

  /**
   * Carrega skills de um roadmap específico
   */
  async carregarRoadmapSkills(roadmapId: string): Promise<IRoadmapSkill[]> {
    try {
      const key = `${STORAGE_KEYS.ROADMAPS}_skills_${roadmapId}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erro ao carregar skills do roadmap:', error);
      return [];
    }
  }

  /**
   * Gera skills usando OpenAI API
   */
  private async gerarSkillsComIA(dto: CriarRoadmapDTO): Promise<ISkill[]> {
    console.log('🤖 RoadmapService.gerarSkillsComIA');
    console.log('  Carreira:', dto.nome_carreira);
    console.log('  Hard skills atuais:', dto.hard_skills_atuais);
    console.log('  Soft skills atuais:', dto.soft_skills_atuais);

    const apiKey = Constants.expoConfig?.extra?.OPENAI_API_KEY || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.warn('⚠️ API key não configurada, usando modo mock');
      return this.gerarSkillsMock(dto);
    }

    try {
      const prompt = `Você é um especialista em desenvolvimento de carreira e criação de roadmaps personalizados.

Tarefa: Crie um roadmap personalizado para a carreira: "${dto.nome_carreira}"

Habilidades atuais do usuário:
- Hard skills: ${dto.hard_skills_atuais.length > 0 ? dto.hard_skills_atuais.join(', ') : 'Nenhuma informada'}
- Soft skills: ${dto.soft_skills_atuais.length > 0 ? dto.soft_skills_atuais.join(', ') : 'Nenhuma informada'}

Instruções:
1. Gere entre 5-8 skills (habilidades) que o usuário precisa desenvolver
2. Inclua TANTO hard skills QUANTO soft skills relevantes
3. As skills devem ser específicas para a carreira desejada
4. Evite duplicar as skills que o usuário já possui
5. Forneça uma descrição prática e acionável para cada skill

Formato de resposta (JSON):
{
  "skills": [
    {
      "nome": "Nome da skill",
      "tipo": "hard" ou "soft",
      "descricao": "Descrição detalhada e prática da skill (1-2 linhas)"
    }
  ]
}

Responda APENAS com o JSON, sem texto adicional.`;

      console.log('🔑 API key configurada, chamando OpenAI...');

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Você é um especialista em desenvolvimento de carreira e criação de roadmaps. Responda sempre em JSON válido.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      console.log('📥 OpenAI response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ OpenAI API error:', errorText);
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('Resposta vazia da OpenAI');
      }

      console.log('✅ OpenAI response received');

      // Parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Resposta não está em formato JSON');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const skills: ISkill[] = parsed.skills.map((skill: any, index: number) => ({
        id: `skill-ai-${Date.now()}-${index}`,
        nome: skill.nome,
        tipo: skill.tipo as 'hard' | 'soft',
        descricao: skill.descricao,
      }));

      console.log(`✅ Geradas ${skills.length} skills com IA`);
      return skills;
    } catch (error) {
      console.error('❌ Erro ao gerar skills com IA:', error);
      console.log('⚠️ Fallback para modo mock');
      return this.gerarSkillsMock(dto);
    }
  }

  /**
   * Simula geração de roadmap (fallback se IA falhar)
   */
  private async gerarSkillsMock(dto: CriarRoadmapDTO): Promise<ISkill[]> {
    console.log('📚 Usando modo mock para gerar skills');
    // Simula delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Filtra skills baseado no input do usuário
    const skillsRecomendadas: ISkill[] = [];

    // Adiciona skills hard que não estão na lista de habilidades atuais
    const hardSkillsExistentes = dto.hard_skills_atuais.map((s) => s.toLowerCase());
    const hardSkillsRecomendadas = SKILL_POOL.filter(
      (skill) =>
        skill.tipo === 'hard' &&
        !hardSkillsExistentes.some((existing) => skill.nome.toLowerCase().includes(existing))
    );

    // Adiciona skills soft que não estão na lista
    const softSkillsExistentes = dto.soft_skills_atuais.map((s) => s.toLowerCase());
    const softSkillsRecomendadas = SKILL_POOL.filter(
      (skill) =>
        skill.tipo === 'soft' &&
        !softSkillsExistentes.some((existing) => skill.nome.toLowerCase().includes(existing))
    );

    // Seleciona 3-4 hard skills e 2-3 soft skills
    skillsRecomendadas.push(...hardSkillsRecomendadas.slice(0, 4));
    skillsRecomendadas.push(...softSkillsRecomendadas.slice(0, 3));

    return skillsRecomendadas;
  }

  /**
   * Cria novo roadmap para o usuário
   */
  async criarRoadmap(usuarioId: string, dto: CriarRoadmapDTO): Promise<RoadmapResult> {
    try {
      console.log('📝 RoadmapService.criarRoadmap');
      console.log('  Usuario ID:', usuarioId);
      console.log('  Carreira:', dto.nome_carreira);

      // Gera skills usando IA
      const skillsRecomendadas = await this.gerarSkillsComIA(dto);

      if (skillsRecomendadas.length === 0) {
        return {
          success: false,
          error: 'Não foi possível gerar skills. Tente novamente.',
        };
      }

      const roadmapId = `roadmap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const novoRoadmap: IRoadmap = {
        id: roadmapId,
        usuario_id: usuarioId,
        nome_carreira: dto.nome_carreira,
        progresso_percentual: 0,
        data_criacao: new Date().toISOString(),
        data_atualizacao: new Date().toISOString(),
      };

      // Salva roadmap
      const roadmapsExistentes = await this.carregarRoadmaps(usuarioId);
      const allRoadmapsData = await AsyncStorage.getItem(STORAGE_KEYS.ROADMAPS);
      const allRoadmaps: IRoadmap[] = allRoadmapsData ? JSON.parse(allRoadmapsData) : [];

      allRoadmaps.push(novoRoadmap);
      await AsyncStorage.setItem(STORAGE_KEYS.ROADMAPS, JSON.stringify(allRoadmaps));

      // Cria roadmap skills
      const roadmapSkills: IRoadmapSkill[] = skillsRecomendadas.map((skill: ISkill, index: number) => ({
        id: `roadmap-skill-${roadmapId}-${index}`,
        roadmap_id: roadmapId,
        skill,
        status: 'pendente' as const,
      }));

      const skillsKey = `${STORAGE_KEYS.ROADMAPS}_skills_${roadmapId}`;
      await AsyncStorage.setItem(skillsKey, JSON.stringify(roadmapSkills));

      return {
        success: true,
        roadmap: novoRoadmap,
        skills: roadmapSkills,
      };
    } catch (error) {
      console.error('Erro ao criar roadmap:', error);
      return {
        success: false,
        error: MESSAGES.roadmap.criadoError,
      };
    }
  }

  /**
   * Marca uma skill como concluída
   */
  async marcarSkillConcluida(
    roadmapId: string,
    skillId: string
  ): Promise<{ success: boolean; xpGanho?: number }> {
    try {
      const skillsKey = `${STORAGE_KEYS.ROADMAPS}_skills_${roadmapId}`;
      const data = await AsyncStorage.getItem(skillsKey);

      if (!data) {
        return { success: false };
      }

      const skills: IRoadmapSkill[] = JSON.parse(data);
      const skillIndex = skills.findIndex((s) => s.id === skillId);

      if (skillIndex === -1) {
        return { success: false };
      }

      // Atualiza status
      skills[skillIndex].status = 'concluido';
      skills[skillIndex].data_conclusao = new Date().toISOString();

      await AsyncStorage.setItem(skillsKey, JSON.stringify(skills));

      // Atualiza progresso do roadmap
      const skillsConcluidas = skills.filter((s) => s.status === 'concluido').length;
      const progresso = Math.round((skillsConcluidas / skills.length) * 100);

      await this.atualizarProgresso(roadmapId, progresso);

      return {
        success: true,
        xpGanho: GAMIFICATION.xp.porSkillConcluida,
      };
    } catch (error) {
      console.error('Erro ao marcar skill concluída:', error);
      return { success: false };
    }
  }

  /**
   * Atualiza progresso do roadmap
   */
  private async atualizarProgresso(roadmapId: string, progresso: number): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ROADMAPS);
      if (!data) return;

      const roadmaps: IRoadmap[] = JSON.parse(data);
      const index = roadmaps.findIndex((r) => r.id === roadmapId);

      if (index !== -1) {
        roadmaps[index].progresso_percentual = progresso;
        roadmaps[index].data_atualizacao = new Date().toISOString();
        await AsyncStorage.setItem(STORAGE_KEYS.ROADMAPS, JSON.stringify(roadmaps));
      }
    } catch (error) {
      console.error('Erro ao atualizar progresso:', error);
    }
  }

  /**
   * Deleta um roadmap
   */
  async deletarRoadmap(roadmapId: string): Promise<boolean> {
    try {
      // Remove roadmap da lista
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ROADMAPS);
      if (!data) return false;

      const roadmaps: IRoadmap[] = JSON.parse(data);
      const novosRoadmaps = roadmaps.filter((r) => r.id !== roadmapId);

      await AsyncStorage.setItem(STORAGE_KEYS.ROADMAPS, JSON.stringify(novosRoadmaps));

      // Remove skills do roadmap
      const skillsKey = `${STORAGE_KEYS.ROADMAPS}_skills_${roadmapId}`;
      await AsyncStorage.removeItem(skillsKey);

      return true;
    } catch (error) {
      console.error('Erro ao deletar roadmap:', error);
      return false;
    }
  }
}

export default new RoadmapService();
