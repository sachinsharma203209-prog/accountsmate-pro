import { Router } from 'express';
import { addToCart, getMyCart, removeCartItem, updateCartItem } from '../controllers/cartController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();
router.use(authenticate);
router.get('/', getMyCart);
router.post('/items', addToCart);
router.put('/items/:itemId', updateCartItem);
router.delete('/items/:itemId', removeCartItem);

export default router;
