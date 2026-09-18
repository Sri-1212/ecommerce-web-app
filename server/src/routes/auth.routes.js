import { Router } from 'express';
import { register, login, getMe } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Public Authentication Routes
router.post('/register', register);
router.post('/login', login);

// Protected Authentication Routes
router.get('/me', authenticateToken, getMe);

export default router;
