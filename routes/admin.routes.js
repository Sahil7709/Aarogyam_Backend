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
import { authenticateToken } from '../middleware/auth.js';
import { authorizeAdmin } from '../middleware/admin.js';

const router = express.Router();

// User management routes (Admin only)
router.get('/users', authenticateToken, authorizeAdmin, getAllUsers);
router.get('/users/:id', authenticateToken, authorizeAdmin, getUserById);
router.put('/users/:id', authenticateToken, authorizeAdmin, updateUser);
router.delete('/users/:id', authenticateToken, authorizeAdmin, deleteUser);

// Appointment management routes (Admin only)
router.get('/appointments', authenticateToken, authorizeAdmin, getAllAppointments);
router.get('/appointments/:id', authenticateToken, authorizeAdmin, getAppointmentById);
router.put('/appointments/:id', authenticateToken, authorizeAdmin, updateAppointment);
router.delete('/appointments/:id', authenticateToken, authorizeAdmin, deleteAppointment);

// Contact message routes (Admin only)
router.get('/contact-messages', authenticateToken, authorizeAdmin, getAllContactMessages);
router.delete('/contact-messages/:id', authenticateToken, authorizeAdmin, deleteContactMessage);

export default router;