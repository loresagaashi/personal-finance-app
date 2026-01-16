import { Router } from 'express';
import { register, login, logout } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
// Logout will revoke the token provided in Authorization header
router.post('/logout', logout);

export default router;
