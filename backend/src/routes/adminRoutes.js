import { Router } from 'express';
import { getDashboardStats, getUsers, updateUserRole } from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = Router();
router.use(authenticate, authorize('ADMIN'));
router.get('/stats', getDashboardStats);
router.get('/users', getUsers);
router.patch('/users/:id/role', updateUserRole);

export default router;
