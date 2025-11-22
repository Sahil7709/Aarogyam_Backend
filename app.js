import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Load environment variables
dotenv.config();

// Import middleware
import { authenticateToken } from './middleware/auth.js';

// Import validation middleware
import { 
  validateRegistration, 
  validateAppointment, 
  validateMedicalReport, 
  validateContactMessage 
} from './middleware/validation.js';

// Import controllers
import { createAppointment, createPublicAppointment, getUserAppointments, updateAppointmentStatus, cancelAppointment } from './controllers/appointmentController.js';
import { createMedicalReport, getUserMedicalReports, getMedicalReportStats, getReportAbnormalities, getMedicalReportById, updateMedicalReport, deleteMedicalReport } from './controllers/reportController.js';
import { submitContactMessage, getContactMessages, updateContactMessageStatus, deleteContactMessage } from './controllers/contactController.js';

const app = express();

// Configure CORS to allow requests from frontend and mobile apps
app.use(cors({
  origin: ['http://localhost:3000', 'http://aarogyam.io:3000', 'http://localhost:5173', 'http://localhost:19000', 'http://localhost:19001', 'http://localhost:19002', 'http://192.168.0.101:19000', 'http://192.168.0.101:19001','http://192.168.0.101:5000', 'http://192.168.0.101:19002', 'http://192.168.1.100:19000', 'http://192.168.1.100:19001', 'http://192.168.1.100:19002'],
  credentials: true
}));

// Middleware
app.use(express.json());





// Routes
app.get('/api/health', (req, res) => {
  res.json({ message: 'Aarogyam backend is running!', timestamp: new Date() });
});

// Import models
import User from './models/User.js';
import Appointment from './models/Appointment.js';
import MedicalReport from './models/MedicalReport.js';
import ContactMessage from './models/ContactMessage.js';

// User Registration
app.post('/api/register', validateRegistration, async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
    });
    
    await user.save();
    
    // Generate JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'aarogyam_secret_key';
    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET);
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// User Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'aarogyam_secret_key';
    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET);
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get User Profile
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create Appointment
app.post('/api/appointments', authenticateToken, validateAppointment, createAppointment);

// Public Appointment Creation (no authentication required)
app.post('/api/appointments/public', createPublicAppointment);

// Get User Appointments
app.get('/api/appointments', authenticateToken, getUserAppointments);

// Update Appointment Status
app.put('/api/appointments/:id', authenticateToken, updateAppointmentStatus);

// Delete Appointment
app.delete('/api/appointments/:id', authenticateToken, cancelAppointment);

// Create Medical Report
app.post('/api/reports', authenticateToken, validateMedicalReport, createMedicalReport);

// Get User Medical Reports
app.get('/api/reports', authenticateToken, getUserMedicalReports);

// Get User Medical Report Statistics
app.get('/api/reports/stats', authenticateToken, getMedicalReportStats);

// Get Abnormal Values in a Report
app.get('/api/reports/:id/abnormalities', authenticateToken, getReportAbnormalities);

// Get Specific Medical Report
app.get('/api/reports/:id', authenticateToken, getMedicalReportById);

// Update Medical Report
app.put('/api/reports/:id', authenticateToken, updateMedicalReport);

// Delete Medical Report
app.delete('/api/reports/:id', authenticateToken, deleteMedicalReport);

// Submit Contact Message
app.post('/api/contact', validateContactMessage, submitContactMessage);

// Get Contact Messages (Admin only)
app.get('/api/contact', authenticateToken, getContactMessages);

// Update Contact Message Status (Admin only)
app.put('/api/contact/:id', authenticateToken, updateContactMessageStatus);

// Delete Contact Message (Admin only)
app.delete('/api/contact/:id', authenticateToken, deleteContactMessage);

export default app;