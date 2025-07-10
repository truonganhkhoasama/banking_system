import { Router } from 'express';
import authenticateToken from '../../middleware/authMiddleware.js';
import authorizeRoles from '../../middleware/authorizeRoles.js';
import { createEmployee, deleteEmployee, getAllEmployees, updateEmployee } from '../../controllers/userController.js';
import { createUser} from '../../controllers/authController.js'
import { getInterbankRawTransactions, getInterbankReconciliation } from '../../controllers/transactionController.js';
import validateSchema from '../../middleware/validateSchema.js';
import { createUserSchema, updateEmployeeSchema } from '../../schemas/authSchemas.js';
const router = Router();

router.get('/employees', authenticateToken, authorizeRoles('admin'), getAllEmployees);
router.post('/employees', authenticateToken, authorizeRoles('admin'), validateSchema(createUserSchema), createEmployee);
router.put('/employees/:id', authenticateToken, authorizeRoles('admin'), validateSchema(updateEmployeeSchema), updateEmployee);
router.delete('/employees/:id', authenticateToken, authorizeRoles('admin'), deleteEmployee);
router.get('/bank-transactions', authenticateToken, authorizeRoles('admin'), getInterbankReconciliation); // filters: by date range, by bank
router.get('/bank-transactions/raw', authenticateToken, authorizeRoles('admin'), getInterbankRawTransactions);
router.post('/create', createUser);


export default router;