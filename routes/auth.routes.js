import { Router } from 'express';
const router = Router();

import { login, createUser, changePassword, requestPasswordReset, confirmPasswordReset } from '../controllers/authController.js'
import authenticateToken from '../middleware/authMiddleware.js';


router.post('/login', login); // with Google reCAPTCHA
router.post('/register', createUser);

router.post('/change-password', authenticateToken, changePassword);

router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', confirmPasswordReset);


export default router;
