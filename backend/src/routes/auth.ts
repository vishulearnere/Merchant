import { Router } from 'express';
import { merchantLogin, merchantRegister } from '../controllers/authController.js';

const router = Router();

router.post('/login', merchantLogin);
router.post('/register', merchantRegister);

export default router;
