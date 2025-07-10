import { Router } from 'express';
const router = Router();

import { login, createUser, changePassword, requestPasswordReset, confirmPasswordReset, refreshToken } from '../controllers/authController.js'
import authenticateToken from '../middleware/authMiddleware.js';
import validateSchema from '../middleware/validateSchema.js';
import { changePasswordSchema, createUserSchema, loginSchema, requestResetPasswordSchema, resetPasswordWithOtpSchema } from '../schemas/authSchemas.js';


router.post('/login', validateSchema(loginSchema), login); // with Google reCAPTCHA
router.post('/register', validateSchema(createUserSchema), createUser);
router.post('/refresh-token', refreshToken);


router.post('/change-password', authenticateToken, validateSchema(changePasswordSchema), changePassword);

router.post('/forgot-password', validateSchema(requestResetPasswordSchema), requestPasswordReset);
router.post('/reset-password', validateSchema(resetPasswordWithOtpSchema), confirmPasswordReset);


export default router;
