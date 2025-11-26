import express from 'express';
import { 
  checkUserExists,
  checkPhoneNumber,
  sendOtp, 
  verifyOtp, 
  register, 
  registerAdmin,
  login,
  getProfile,
  updateProfile
} from '../controllers/auth.controller.js';
import { validateRegistration } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// User existence check route
router.post('/check-user', checkUserExists);

// Phone number check route
router.post('/check-phone', checkPhoneNumber);

// OTP Routes
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);

// Traditional Auth Routes
router.post('/register', validateRegistration, register);
router.post('/register-admin', validateRegistration, registerAdmin);
router.post('/login', login);

// Profile Routes
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);

export default router;