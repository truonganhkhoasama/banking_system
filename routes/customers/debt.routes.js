import { Router } from 'express';
const router = Router();

import authenticateToken from '../../middleware/authMiddleware.js';
import authorizeRoles from '../../middleware/authorizeRoles.js';
import { confirmDebtPayment, createDebtReminder, deleteDebtReminder, getAllDebtReminders, initiateDebtPayment } from '../../controllers/debtController.js';
import validateSchema from '../../middleware/validateSchema.js';
import { cancelReminderSchema, confirmDebtPaymentSchema, debtReminderSchema } from '../../schemas/debtReminderSchemas.js';

router.post('/debt/create', authenticateToken, authorizeRoles('customer'), validateSchema(debtReminderSchema), createDebtReminder);
router.get('/debt', authenticateToken, authorizeRoles('customer'), getAllDebtReminders);
router.delete('/debt/:id', authenticateToken, authorizeRoles('customer'), validateSchema(cancelReminderSchema), deleteDebtReminder);
router.post('/debt/pay/:id', authenticateToken, authorizeRoles('customer'), initiateDebtPayment);
router.post('/debt/confirm/:id', authenticateToken, authorizeRoles('customer'), validateSchema(confirmDebtPaymentSchema), confirmDebtPayment);

export default router;