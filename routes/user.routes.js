import { Router } from 'express';
import { isLoggedIn } from "../middlewares/auth.middleware.js";

import { register, login, logout, getProfile } from "../controllers/user.controller.js";
import upload from '../middlewares/multer.middleware.js';
const router = Router();

router.post('/register', upload.single("avatar"), register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/profile', isLoggedIn, getProfile);

export default router;
