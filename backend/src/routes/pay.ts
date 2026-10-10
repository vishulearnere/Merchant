import { Router } from 'express';
import {
  getPayPageDetails,
  startPayment,
} from '../controllers/checkoutController.js';

const router = Router();

router.get('/:linkId', getPayPageDetails);
router.post('/:linkId', startPayment);

export default router;
