import { Router } from 'express';
const router = Router();

import authenticateToken from '../../middleware/authMiddleware.js';
import authorizeRoles from '../../middleware/authorizeRoles.js';
import { createRecipient, deleteRecipient, getAllRecipients, updateRecipient } from '../../controllers/recipientController.js';
import validateSchema from '../../middleware/validateSchema.js';
import { createRecipientSchema, updateRecipientSchema } from '../../schemas/recipientSchemas.js';

router.get('/', authenticateToken, authorizeRoles('customer'), getAllRecipients);
router.post('/', authenticateToken, authorizeRoles('customer'), validateSchema(createRecipientSchema), createRecipient);
router.put('/:id', authenticateToken, authorizeRoles('customer'), validateSchema(updateRecipientSchema), updateRecipient);
router.delete('/:id', authenticateToken, authorizeRoles('customer'), deleteRecipient);

export default router;