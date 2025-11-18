import ApiClient from './ApiClient';
import { logger } from '../utils/logger';
import type { ISkill } from '../types/models';

class SkillService {
  private static instance: SkillService;
  private cache: ISkill[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): SkillService {
    if (!SkillService.instance) {
      SkillService.instance = new SkillService();
    }
    return SkillService.instance;
  }

  public async getAllSkills(forceRefresh: boolean = false): Promise<ISkill[]> {
    try {
      // Check cache
      const now = Date.now();
      if (
        !forceRefresh &&
        this.cache &&
        now - this.cacheTimestamp < this.CACHE_DURATION
      ) {
        logger.info('Returning cached skills');
        return this.cache;
      }

      logger.debug('Fetching skills from API...');
      const response = await ApiClient.get<ISkill[]>('/skills');

      if (!response.success || !response.data) {
        console.error('Failed to fetch skills:', response.error);
        return this.cache || [];
      }

      this.cache = response.data;
      this.cacheTimestamp = now;

      console.log(`Loaded ${this.cache.length} skills`);
      return this.cache;
    } catch (error) {
      console.error('Error fetching skills:', error);
      return this.cache || [];
    }
  }

  public async getSkillById(skillId: string): Promise<ISkill | null> {
    try {
      console.log(`Fetching skill ${skillId}...`);
      const response = await ApiClient.get<ISkill>(`/skills/${skillId}`);

      if (!response.success || !response.data) {
        console.error('Failed to fetch skill:', response.error);
        return null;
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching skill:', error);
      return null;
    }
  }

  public getSkillsByType(type: 'hard' | 'soft'): ISkill[] {
    if (!this.cache) {
      return [];
    }
    return this.cache.filter((skill) => skill.type === type);
  }

  public getSkillsByCategory(category: string): ISkill[] {
    if (!this.cache) {
      return [];
    }
    return this.cache.filter((skill) => skill.category === category);
  }

  public getAllCategories(): string[] {
    if (!this.cache) {
      return [];
    }
    const categories = new Set(
      this.cache.map((skill) => skill.category).filter((cat): cat is string => !!cat)
    );
    return Array.from(categories).sort();
  }

  public clearCache(): void {
    this.cache = null;
    this.cacheTimestamp = 0;
  }
}

export default SkillService.getInstance();
