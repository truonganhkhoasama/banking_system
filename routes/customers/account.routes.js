import { Router } from 'express';
const router = Router();


import authenticateToken from '../../middleware/authMiddleware.js';
import authorizeRoles from '../../middleware/authorizeRoles.js';
import getUserAccounts from '../../controllers/accountController.js';

router.get('/accounts', authenticateToken, authorizeRoles('customer'), getUserAccounts); // show list of accounts with balance

export default router;