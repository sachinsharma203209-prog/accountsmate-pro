import { Router } from 'express';
import { createProduct, deleteProduct, getProductById, getProducts, updateProduct } from '../controllers/productController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = Router();
router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', authenticate, authorize('ADMIN'), createProduct);
router.put('/:id', authenticate, authorize('ADMIN'), updateProduct);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteProduct);

export default router;
