import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import { listUsers, getStats, getUserTransactions } from '../controllers/admin.controller';

const router = Router();

// admin-only
router.use(requireAuth);
router.use(requireAdmin);

router.get('/users', listUsers);
router.get('/stats', getStats);
router.get('/users/:id/transactions', getUserTransactions);

export default router;
