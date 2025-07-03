import express from 'express';
const router = express.Router();

// import { verifySignature } from '../middlewares/verifySignature.js';
import { depositToAccount, externalDepositToLinkedBank, initiateExternalTransfer, queryAccountInfo, queryExternalAccountInfo } from '../../controllers/bankController.js';
import authenticateToken from '../../middleware/authMiddleware.js';
import authorizeRoles from '../../middleware/authorizeRoles.js';

router.post('/account-info', queryAccountInfo);
router.get('/query/:bank_code/:account_number', queryExternalAccountInfo);
router.post('/deposit', depositToAccount);
router.post('/transfer/initiate', authenticateToken, authorizeRoles('customer'), initiateExternalTransfer);
router.post('/transfer/confirm', authenticateToken, authorizeRoles('customer'), externalDepositToLinkedBank);


export default router;

