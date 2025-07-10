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


export default router;
