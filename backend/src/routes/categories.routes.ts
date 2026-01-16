import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { listCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categories.controller';

const router = Router();
router.use(requireAuth);

router.get('/', listCategories);
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;
