import { Router } from 'express';
import {
  getAllSkills,
  getSkillById,
} from '../controllers/skill.controller';

const router = Router();

/**
 * GET /api/skills
 * Get all skills from database
 */
router.get('/', getAllSkills);

/**
 * GET /api/skills/:id
 * Get single skill by ID
 */
router.get('/:id', getSkillById);

export default router;
