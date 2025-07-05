import express from 'express';
const router = express.Router();

// import { verifySignature } from '../middlewares/verifySignature.js';
import { depositToAccount, externalDepositToLinkedBank, initiateExternalTransfer, queryAccountInfo, queryExternalAccountInfo } from '../../controllers/bankController.js';
import authenticateToken from '../../middleware/authMiddleware.js';
import authorizeRoles from '../../middleware/authorizeRoles.js';
import validateSchema from '../../middleware/validateSchema.js';
import { confirmExternalTransferSchema, depositSchema, externalTransferSchema, queryAccountInfoSchema } from '../../schemas/bankSchemas.js';

router.post('/account-info', validateSchema(queryAccountInfoSchema), queryAccountInfo);
router.get('/query/:bank_code/:account_number', queryExternalAccountInfo);
router.post('/deposit', validateSchema(depositSchema), depositToAccount);
router.post('/transfer/initiate', authenticateToken, authorizeRoles('customer'), validateSchema(externalTransferSchema), initiateExternalTransfer);
router.post('/transfer/confirm', authenticateToken, authorizeRoles('customer'), validateSchema(confirmExternalTransferSchema), externalDepositToLinkedBank);


export default router;

