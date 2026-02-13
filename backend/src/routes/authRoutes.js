import { Router } from 'express';
import { body } from 'express-validator';
import { login, me, register } from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.post('/register', [body('name').notEmpty(), body('email').isEmail(), body('password').isLength({ min: 6 }), validate], register);
router.post('/login', [body('email').isEmail(), body('password').notEmpty(), validate], login);
router.get('/me', authenticate, me);

export default router;
