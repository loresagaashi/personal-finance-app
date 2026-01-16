import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getProfile, updateProfile, changePassword } from '../controllers/users.controller';

const router = Router();
router.use(requireAuth);

router.get('/me', getProfile);
router.put('/me', updateProfile);
router.put('/me/password', changePassword);

export default router;
