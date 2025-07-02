import { Router } from 'express';
const router = Router();

import authenticateToken from '../../middleware/authMiddleware.js';
import authorizeRoles from '../../middleware/authorizeRoles.js';
import { createRecipient, deleteRecipient, getAllRecipients, updateRecipient } from '../../controllers/recipientController.js';

router.get('/recipients', authenticateToken, authorizeRoles('customer'), getAllRecipients);
router.post('/recipients', authenticateToken, authorizeRoles('customer'), createRecipient);
router.put('/recipients/:id', authenticateToken, authorizeRoles('customer'), updateRecipient);
router.delete('/recipients/:id', authenticateToken, authorizeRoles('customer'), deleteRecipient);

export default router;