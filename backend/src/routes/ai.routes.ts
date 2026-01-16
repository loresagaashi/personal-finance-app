import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { generateInsights } from '../controllers/ai.controller';

const router = Router();
router.use(requireAuth);

router.get('/', generateInsights);

export default router;
