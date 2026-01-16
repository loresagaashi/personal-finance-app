import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { monthlyOverview, spendingTrends } from '../controllers/analytics.controller';

const router = Router();
router.use(requireAuth);

router.get('/monthly', monthlyOverview);
router.get('/trends', spendingTrends);

export default router;
