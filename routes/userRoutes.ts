import { Router } from 'express';
import { getAllUsers, getUserById, createUser, setUserInactive } from '../controllers/userController.js';

const router = Router();

// GET /api/users - Get all users
router.get('/getAll', getAllUsers);

// GET /api/users/:id - Get user by ID
router.get('/user/:id', getUserById);

// POST /api/users - Create new user
router.post('/create', createUser);

// PUT /api/users/:id/inactive - Set user status to inactive
router.put('/:id/inactive', setUserInactive);

export default router;
