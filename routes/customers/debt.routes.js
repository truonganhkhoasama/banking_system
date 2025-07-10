import { Router } from 'express';
const router = Router();

import authenticateToken from '../../middleware/authMiddleware.js';
import authorizeRoles from '../../middleware/authorizeRoles.js';
import { confirmDebtPayment, createDebtReminder, deleteDebtReminder, getAllDebtReminders, initiateDebtPayment } from '../../controllers/debtController.js';
import validateSchema from '../../middleware/validateSchema.js';
import { cancelReminderSchema, confirmDebtPaymentSchema, debtReminderSchema } from '../../schemas/debtReminderSchemas.js';

router.post('/create', authenticateToken, authorizeRoles('customer'), validateSchema(debtReminderSchema), createDebtReminder);
router.get('/', authenticateToken, authorizeRoles('customer'), getAllDebtReminders);
router.delete('/:id', authenticateToken, authorizeRoles('customer'), validateSchema(cancelReminderSchema), deleteDebtReminder);
router.post('/pay/:id', authenticateToken, authorizeRoles('customer'), initiateDebtPayment);
router.post('/confirm/:id', authenticateToken, authorizeRoles('customer'), validateSchema(confirmDebtPaymentSchema), confirmDebtPayment);

export default router;