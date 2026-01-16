import { Router } from 'express';
import {
  createTransaction,
  getTransactions,
  getMonthlyTotals,
  updateTransaction,
  deleteTransaction,
} from '../controllers/transactions.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.post('/', createTransaction);
router.get('/', getTransactions);
router.get('/totals', getMonthlyTotals);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;
