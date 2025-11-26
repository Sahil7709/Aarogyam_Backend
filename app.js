import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticateToken } from './middleware/auth.js';
import { 
  validateAppointment, 
  validateMedicalReport,
  validateContactMessage
} from './middleware/validation.js';
import { 
  createAppointment,
  createPublicAppointment,
  getUserAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  cancelAppointment
} from './controllers/appointment.controller.js';
import { 
  createMedicalReport,
  getUserMedicalReports,
  getMedicalReportStats,
  getReportAbnormalities,
  getMedicalReportById,
  updateMedicalReport,
  deleteMedicalReport
} from './controllers/report.controller.js';
import { 
  submitContactMessage,
  getContactMessages,
  updateContactMessageStatus,
  deleteContactMessage
} from './controllers/contact.controller.js';
import User from './models/User.js';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';

dotenv.config();

const app = express();

// CORS configuration - Allow all origins during development
// CORS configuration - Works for Web + React Native + Expo
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5173",
      null, // <-- ALLOWS Expo / React Native (origin = null)
    ];

    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS: " + origin));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
}));


// Middleware
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ message: 'Aarogyam backend is running!', timestamp: new Date() });
});

// Debug: list mounted routes (development only)
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/debug/routes', (req, res) => {
    try {
      const routes = [];
      app._router.stack.forEach((middleware) => {
        if (middleware.route) {
          // routes registered directly on the app
          const methods = Object.keys(middleware.route.methods).join(', ').toUpperCase();
          routes.push({ path: middleware.route.path, methods });
        } else if (middleware.name === 'router' && middleware.handle && middleware.handle.stack) {
          // router middleware
          middleware.handle.stack.forEach((handler) => {
            if (handler.route) {
              const methods = Object.keys(handler.route.methods).join(', ').toUpperCase();
              // Prefix with the router mount path if available
              routes.push({ path: handler.route.path, methods });
            }
          });
        }
      });
      res.json({ routes });
    } catch (err) {
      res.status(500).json({ message: 'Failed to list routes', error: err.message });
    }
  });
}

// Auth routes
app.use('/api/auth', authRoutes);

// Admin routes
console.log('Mounting admin routes at /api/admin');
app.use('/api/admin', adminRoutes);
console.log('Admin routes mounted successfully');

// Create Appointment
app.post('/api/appointments', authenticateToken, validateAppointment, createAppointment);

// Public Appointment Creation (no authentication required)
app.post('/api/appointments/public', createPublicAppointment);

// Get User Appointments
app.get('/api/appointments', authenticateToken, getUserAppointments);

// Get Appointment by ID
app.get('/api/appointments/:id', authenticateToken, getAppointmentById);

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