import { Router } from 'express';
import paymentLinksRoutes from './paymentLinks.js';
import payRoutes from './pay.js';
import webhooksRoutes from './webhooks.js';
import authRoutes from './auth.js';

const router = Router();

router.use('/payment-links', paymentLinksRoutes);
router.use('/pay', payRoutes);
router.use('/webhooks', webhooksRoutes);
router.use('/auth', authRoutes);

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'payment-link-api',
    timestamp: new Date().toISOString(),
  });
});

export default router;
