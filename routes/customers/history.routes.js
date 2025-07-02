import express from 'express';
import { getTransactionHistory } from '../../controllers/transactionController.js';
import authenticateToken from '../../middleware/authMiddleware.js';
import authorizeRoles from '../../middleware/authorizeRoles.js';

const router = express.Router();

router.get('/history',authenticateToken, authorizeRoles('customer'), getTransactionHistory);

export default router;
