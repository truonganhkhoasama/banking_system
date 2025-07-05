import { Router } from 'express';
const router = Router();

import authenticateToken from '../../middleware/authMiddleware.js';
import authorizeRoles from '../../middleware/authorizeRoles.js';
import { confirmTransfer, initiateTransfer } from '../../controllers/transferController.js';
import validateSchema from '../../middleware/validateSchema.js';
import { confirmTransferSchema, initiateTransferSchema } from '../../schemas/transferSchemas.js';


router.post('/transfer/initiate', authenticateToken, authorizeRoles('customer'), validateSchema(initiateTransferSchema), initiateTransfer);
router.post('/transfer/confirm', authenticateToken, authorizeRoles('customer'), validateSchema(confirmTransferSchema), confirmTransfer);


// router.post('/transfer/external', authenticateCustomer, interbankTransfer);

export default router;