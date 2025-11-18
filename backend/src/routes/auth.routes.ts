import { Router } from 'express';
import { register, login, verifySession } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

/**
 * POST /api/auth/register
 * Register new user
 */
router.post('/register', register);

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', login);

/**
 * GET /api/auth/verify
 * Verify JWT token and get current user
 * Protected route - requires authentication
 */
router.get('/verify', authMiddleware, verifySession);

export default router;
