import { Router } from 'express';
import { handleProviderWebhook } from '../controllers/webhookController.js';
import { verifyWebhookSecret } from '../middlewares/webhookSecret.js';

const router = Router();

router.post('/provider', verifyWebhookSecret, handleProviderWebhook);

export default router;
