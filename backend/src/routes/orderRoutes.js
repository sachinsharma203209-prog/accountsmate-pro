import { Router } from 'express';
import { getAllOrders, getMyOrders, getOrderById, updateOrderStatus } from '../controllers/orderController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = Router();
router.use(authenticate);
router.get('/my', getMyOrders);
router.get('/:id', getOrderById);
router.get('/', authorize('ADMIN'), getAllOrders);
router.put('/:id/status', authorize('ADMIN'), updateOrderStatus);

export default router;
