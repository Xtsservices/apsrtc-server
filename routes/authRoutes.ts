import { Router } from 'express';
import { login, loginWithPhoneOtp, generateOtp, verifyOtp, forgotPassword, resetPassword } from '../controllers/authController.js';

const router = Router();

router.post('/login', login);
router.post('/login/phone-otp', loginWithPhoneOtp);
router.post('/otp/generate', generateOtp);
router.post('/otp/verify', verifyOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
