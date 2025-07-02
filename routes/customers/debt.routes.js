import { Router } from 'express';
const router = Router();


import authenticateToken from '../../middleware/authMiddleware.js';
import authorizeRoles from '../../middleware/authorizeRoles.js';
import { confirmDebtPayment, createDebtReminder, deleteDebtReminder, getAllDebtReminders, initiateDebtPayment } from '../../controllers/debtController.js';

router.post('/debt/create', authenticateToken, authorizeRoles('customer'), createDebtReminder);
router.get('/debt', authenticateToken, authorizeRoles('customer'), getAllDebtReminders);
router.delete('/debt/:id', authenticateToken, authorizeRoles('customer'), deleteDebtReminder);
router.post('/debt/pay/:id', authenticateToken, authorizeRoles('customer'), initiateDebtPayment);
router.post('/debt/confirm/:id', authenticateToken, authorizeRoles('customer'), confirmDebtPayment);

export default router;