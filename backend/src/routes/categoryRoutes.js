import { Router } from 'express';
import { createCategory, deleteCategory, getCategories, updateCategory } from '../controllers/categoryController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = Router();
router.get('/', getCategories);
router.post('/', authenticate, authorize('ADMIN'), createCategory);
router.put('/:id', authenticate, authorize('ADMIN'), updateCategory);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteCategory);

export default router;
