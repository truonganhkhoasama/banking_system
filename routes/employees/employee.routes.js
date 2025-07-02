import { Router } from 'express';
import authorizeRoles from '../../middleware/authorizeRoles.js'
import authenticateToken from '../../middleware/authMiddleware.js';

const router = Router();

import { createUser } from '../../controllers/authController.js'
import { depositToAccount } from '../../controllers/accountController.js';
import { getAccountTransactionHistory } from '../../controllers/transactionController.js';

router.post('/customers', authenticateToken, authorizeRoles('employee'), createUser);
router.post('/deposit', authenticateToken, authorizeRoles('employee'), depositToAccount);
router.get('/accounts/:account_number/transactions', authenticateToken, authorizeRoles('employee'), getAccountTransactionHistory);

export default router;
