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
router.use('/ai-insights', aiRoutes);
router.use('/users', usersRoutes);

export default router;
