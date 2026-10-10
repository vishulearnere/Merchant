import { Router } from 'express';
import {
  createPaymentLink,
  getPaymentLinks,
} from '../controllers/paymentLinkController.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();

router.post('/', authMiddleware, createPaymentLink);
router.get('/', authMiddleware, getPaymentLinks);

export default router;
