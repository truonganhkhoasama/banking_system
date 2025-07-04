import { Router } from 'express';
import authenticateToken from '../../middleware/authMiddleware.js';
import authorizeRoles from '../../middleware/authorizeRoles.js';
import { createEmployee, deleteEmployee, getAllEmployees, updateEmployee } from '../../controllers/userController.js';
import { getInterbankReconciliation } from '../../controllers/transactionController.js';
const router = Router();

router.get('/employees', authenticateToken, authorizeRoles('admin'), getAllEmployees);
router.post('/employees', authenticateToken, authorizeRoles('admin'), createEmployee);
router.put('/employees/:id', authenticateToken, authorizeRoles('admin'), updateEmployee);
router.delete('/employees/:id', authenticateToken, authorizeRoles('admin'), deleteEmployee);
router.get('/bank-transactions', authenticateToken, authorizeRoles('admin'), getInterbankReconciliation); // filters: by date range, by bank

export default router;