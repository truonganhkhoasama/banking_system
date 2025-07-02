import { Router } from 'express';
import authorizeRoles from '../../middleware/authorizeRoles.js'
import authenticateToken from '../../middleware/authMiddleware.js';

const router = Router();

import { createUser } from '../../controllers/authController.js'

router.post('/customers', authenticateToken, authorizeRoles('employee'), createUser); 
// router.post('/deposit', authenticateEmployee, depositToAccount);
// router.get('/customers/:id/transactions', authenticateEmployee, getCustomerTransactionHistory);

export default router;
