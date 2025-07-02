import { Router } from 'express';
const router = Router();

import {
  getAllUsers,
  getUserById,
  createUser,
  login,
  updateUser,
  deleteUser,
} from '../../controllers/userController.js';

import authenticateToken from '../../middleware/authMiddleware.js';

// Public routes
router.post('/', createUser);        // Register
router.post('/login', login);        // Login

// Protected routes
router.get('/', authenticateToken, getAllUsers);
router.get('/:id', authenticateToken, getUserById);
router.put('/:id', authenticateToken, updateUser);
router.delete('/:id', authenticateToken, deleteUser);

export default router;
