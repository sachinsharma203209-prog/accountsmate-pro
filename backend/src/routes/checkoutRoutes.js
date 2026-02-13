import { Router } from 'express';
import express from 'express';
import { createCheckoutSession, stripeWebhook } from '../controllers/checkoutController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();
router.post('/session', authenticate, createCheckoutSession);
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

export default router;
