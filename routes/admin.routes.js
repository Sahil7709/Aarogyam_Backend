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
  deleteContactMessage,
  createMedicalReportByAdmin,
  getAllMedicalReports,
  getMedicalReportById,
  updateMedicalReport,
  deleteMedicalReport
} from '../controllers/admin.controller.js';
import { updateContactMessageStatus } from '../controllers/contact.controller.js';
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

// Update contact message status (Admin only)
router.put('/contact-messages/:id', authenticateToken, authorizeAdmin, updateContactMessageStatus);

// Medical report routes (Admin only)
router.get('/medical-reports', authenticateToken, authorizeAdmin, getAllMedicalReports);
router.get('/medical-reports/:id', authenticateToken, authorizeAdmin, getMedicalReportById);
router.post('/medical-reports', authenticateToken, authorizeAdmin, createMedicalReportByAdmin);
router.put('/medical-reports/:id', authenticateToken, authorizeAdmin, updateMedicalReport);
router.delete('/medical-reports/:id', authenticateToken, authorizeAdmin, deleteMedicalReport);

// Test route to verify admin routes are working
router.get('/test', (req, res) => {
  res.json({ message: 'Admin routes are working' });
});

export default router;