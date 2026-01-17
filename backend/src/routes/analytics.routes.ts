import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { monthlyOverview, spendingTrends, currentBalance } from '../controllers/analytics.controller';

const router = Router();
router.use(requireAuth);

router.get('/monthly', monthlyOverview);
router.get('/trends', spendingTrends);
router.get('/balance', currentBalance);

export default router;
