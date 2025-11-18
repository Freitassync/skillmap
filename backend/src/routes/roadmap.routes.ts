import { Router } from 'express';
import {
  createRoadmap,
  getUserRoadmaps,
  getRoadmapById,
  getRoadmapSkills,
  getRoadmapSkillById,
  updateSkillProgress,
  updateMilestoneProgress,
  deleteRoadmap,
  generateRoadmapSuggestions,
  generateCompleteRoadmap,
} from '../controllers/roadmap.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

/**
 * POST /api/roadmaps/generate-complete
 * Generate complete AI-powered roadmap with resources
 * Protected route - requires authentication
 */
router.post('/generate-complete', authMiddleware, generateCompleteRoadmap);

/**
 * POST /api/roadmaps/generate
 * Generate AI-powered skill suggestions for roadmap
 * Protected route - requires authentication
 */
router.post('/generate', authMiddleware, generateRoadmapSuggestions);

/**
 * POST /api/roadmaps
 * Create roadmap with skills
 * Protected route - requires authentication
 */
router.post('/', authMiddleware, createRoadmap);

/**
 * GET /api/roadmaps/user/:userId
 * Get all roadmaps for a user
 * Protected route - requires authentication
 */
router.get('/user/:userId', authMiddleware, getUserRoadmaps);

/**
 * GET /api/roadmaps/:id
 * Get single roadmap with all skills
 * Protected route - requires authentication
 */
router.get('/:id', authMiddleware, getRoadmapById);

/**
 * GET /api/roadmaps/:id/skills
 * Get all skills for a specific roadmap
 * Protected route - requires authentication
 */
router.get('/:id/skills', authMiddleware, getRoadmapSkills);

/**
 * GET /api/roadmaps/:id/skills/:skillId
 * Get a single skill from a roadmap by ID
 * Protected route - requires authentication
 */
router.get('/:id/skills/:skillId', authMiddleware, getRoadmapSkillById);

/**
 * PUT /api/roadmaps/:id/skills/:skillId/milestones/:level
 * Update milestone completion status
 * Protected route - requires authentication
 */
router.put('/:id/skills/:skillId/milestones/:level', authMiddleware, updateMilestoneProgress);

/**
 * PUT /api/roadmaps/:id/skills/:skillId
 * Update skill progress (toggle completion)
 * Protected route - requires authentication
 */
router.put('/:id/skills/:skillId', authMiddleware, updateSkillProgress);

/**
 * DELETE /api/roadmaps/:id
 * Delete roadmap by ID
 * Protected route - requires authentication
 */
router.delete('/:id', authMiddleware, deleteRoadmap);

export default router;
