import { Router } from 'express';
import { register, login, logout, getProfile } from '../controllers/user.controller.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/profile', getProfile);

export default router;
