import { Router } from 'express';
import authRoutes from './auth.routes';
import transactionsRoutes from './transactions.routes';
import budgetsRoutes from './budgets.routes';
import categoriesRoutes from './categories.routes';
import analyticsRoutes from './analytics.routes';
import aiRoutes from './ai.routes';
import usersRoutes from './users.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/transactions', transactionsRoutes);
router.use('/budgets', budgetsRoutes);
router.use('/categories', categoriesRoutes);
router.use('/analytics', analyticsRoutes);
// expose balance endpoint alias if needed
router.use('/ai-insights', aiRoutes);
// legacy /api/ai route (frontend used /api/ai) — keep both paths working
router.use('/ai', aiRoutes);
router.use('/users', usersRoutes);

export default router;
