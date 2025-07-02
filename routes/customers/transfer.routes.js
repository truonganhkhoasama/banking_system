import { Router } from 'express';
const router = Router();

import authenticateToken from '../../middleware/authMiddleware.js';
import authorizeRoles from '../../middleware/authorizeRoles.js';
import { confirmTransfer, initiateTransfer } from '../../controllers/transferController.js';


router.post('/transfer/initiate', authenticateToken, authorizeRoles('customer'), initiateTransfer);
router.post('/transfer/confirm', authenticateToken, authorizeRoles('customer'), confirmTransfer);


// router.post('/transfer/external', authenticateCustomer, interbankTransfer);

export default router;