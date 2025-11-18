import type { Roadmap, RoadmapSkill, Skill, SkillResource } from '@prisma/client';

export interface ApiSkillResource {
  id: string;
  type: string;
  title: string;
  url: string;
  platform?: string | null;
  is_free: boolean;
}

export interface ApiRoadmapSkillSimple {
  id: string;
  skill_id: string;
  name: string;
  description: string;
  type: string;
  category?: string | null;
  order: number;
  is_concluded: boolean;
  conclusion_date?: Date | null;
}

export interface ApiRoadmapSkillFull extends ApiRoadmapSkillSimple {
  roadmap_id: string;
  skill: {
    id: string;
    name: string;
    description: string;
    type: string;
    category?: string | null;
  };
  status: 'pendente' | 'concluido';
  milestones: any[];
  learning_objectives: string;
  prerequisites: Array<{ id: string; name: string }>;
  estimated_hours: number;
  resources: ApiSkillResource[];
}

export interface ApiRoadmap {
  id: string;
  userId: string;
  title: string;
  careerGoal: string;
  experience: string;
  percentualProgress: number;
  creationDate: Date;
  skills?: ApiRoadmapSkillSimple[] | ApiRoadmapSkillFull[];
}

type RoadmapSkillWithRelations = RoadmapSkill & {
  skill: Skill;
  resources?: SkillResource[];
};

type RoadmapWithSkills = Roadmap & {
  roadmapSkills: RoadmapSkillWithRelations[];
};

export class ResourceFormatter {
  static toApi(resource: SkillResource): ApiSkillResource {
    return {
      id: resource.id,
      type: resource.type,
      title: resource.title,
      url: resource.url,
      platform: resource.platform,
      is_free: resource.isFree,
    };
  }
}

export class RoadmapSkillFormatter {
  static toApiSimple(rs: RoadmapSkillWithRelations): ApiRoadmapSkillSimple {
    return {
      id: rs.id,
      skill_id: rs.skill.id,
      name: rs.skill.name,
      description: rs.skill.description,
      type: rs.skill.type,
      category: rs.skill.category,
      order: rs.order,
      is_concluded: rs.isConcluded,
      conclusion_date: rs.conclusionDate,
    };
  }

  static toApiFull(
    rs: RoadmapSkillWithRelations,
    roadmapId: string,
    prerequisiteSkills: Array<{ id: string; name: string }> = []
  ): ApiRoadmapSkillFull {
    return {
      id: rs.id,
      roadmap_id: roadmapId,
      skill_id: rs.skill.id,
      name: rs.skill.name,
      description: rs.skill.description,
      type: rs.skill.type,
      category: rs.skill.category,
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
      milestones: Array.isArray(rs.milestones) ? rs.milestones : [],
      learning_objectives: rs.learningObjectives || '',
      prerequisites: prerequisiteSkills,
      estimated_hours: rs.estimatedHours || 0,
      resources: rs.resources?.map(ResourceFormatter.toApi) || [],
    };
  }
}

export class RoadmapFormatter {
  static toApi(roadmap: Roadmap): ApiRoadmap {
    return {
      id: roadmap.id,
      userId: roadmap.userId,
      title: roadmap.title,
      careerGoal: roadmap.careerGoal,
      experience: roadmap.experience,
      percentualProgress: Number(roadmap.percentualProgress),
      creationDate: roadmap.creationDate,
    };
  }

  static toApiWithSimpleSkills(roadmap: RoadmapWithSkills): ApiRoadmap {
    return {
      ...this.toApi(roadmap),
      skills: roadmap.roadmapSkills.map(RoadmapSkillFormatter.toApiSimple),
    };
  }

  static toApiWithFullSkills(
    roadmap: RoadmapWithSkills,
    prerequisitesMap: Map<string, Array<{ id: string; name: string }>>
  ): ApiRoadmap {
    return {
      ...this.toApi(roadmap),
      skills: roadmap.roadmapSkills.map((rs) => {
        const prerequisites = prerequisitesMap.get(rs.id) || [];
        return RoadmapSkillFormatter.toApiFull(rs, roadmap.id, prerequisites);
      }),
    };
  }
}
