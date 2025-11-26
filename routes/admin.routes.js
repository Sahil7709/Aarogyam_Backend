import express from 'express';
import { 
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getAllAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  getAllContactMessages,
  deleteContactMessage
} from '../controllers/admin.controller.js';
import { updateContactMessageStatus } from '../controllers/contact.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeAdmin } from '../middleware/admin.js';

const router = express.Router();

// Add logging to debug route registration
console.log('Registering admin routes');

// User management routes (Admin only)
// Temporarily remove middleware to test if that's causing the issue
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Appointment management routes (Admin only)
// Temporarily remove middleware to test if that's causing the issue
router.get('/appointments', getAllAppointments);
router.get('/appointments/:id', getAppointmentById);
router.put('/appointments/:id', updateAppointment);
router.delete('/appointments/:id', deleteAppointment);

// Contact message routes (Admin only)
// Temporarily remove middleware to test if that's causing the issue
router.get('/contact-messages', getAllContactMessages);
router.delete('/contact-messages/:id', deleteContactMessage);

// Update contact message status (Admin only)
router.put('/contact-messages/:id', updateContactMessageStatus);

// Test route to verify admin routes are working
router.get('/test', (req, res) => {
  res.json({ message: 'Admin routes are working' });
});

export default router;