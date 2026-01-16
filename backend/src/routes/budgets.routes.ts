import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { createBudget, listBudgets, getBudgetStatus, updateBudget, deleteBudget } from '../controllers/budgets.controller';

const router = Router();
router.use(requireAuth);

router.post('/', createBudget);
router.get('/', listBudgets);
router.get('/status', getBudgetStatus); // ?year=&month=
router.put('/:id', updateBudget);
router.delete('/:id', deleteBudget);

export default router;
