// Controller for appointment-related operations

import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';

// Create a new appointment
export const createAppointment = asyncHandler(async (req, res, next) => {
  const { name, gender, age, phone, email, date, time, reason, notes } = req.body;
  
  // Simple validation for required fields (matching our new structure)
  if (!name || !phone || !email || !date || !time) {
    return next(new ErrorResponse('Name, phone, email, date, and time are required', 400));
  }
  
  // Validate age (if provided)
  if (age && (isNaN(Number(age)) || Number(age) <= 0)) {
    return next(new ErrorResponse('Please enter a valid age', 400));
  }
  
  const appointmentDate = new Date(date);
  
  const appointment = new Appointment({
    userId: req.user.userId,
    name,
    gender: gender || '',
    age: age ? Number(age) : undefined,
    phone,
    email,
    date: appointmentDate, // Store as Date object
    time, // This should be a string in HH:MM format
    reason: reason || 'General Consultation',
    notes: notes || '',
  });
  
  await appointment.save();
  
  res.status(201).json({
    success: true,
    message: 'Appointment booked successfully',
    appointment,
  });
});

// Public appointment creation (no authentication required)
export const createPublicAppointment = asyncHandler(async (req, res, next) => {
  const { name, gender, age, phone, email, date, time, reason, notes } = req.body;
  
  // Simple validation (matching our new structure)
  if (!name || !phone || !email || !date || !time) {
    return next(new ErrorResponse('Name, phone, email, date, and time are required', 400));
  }
  
  // Validate age (if provided)
  if (age && (isNaN(Number(age)) || Number(age) <= 0)) {
    return next(new ErrorResponse('Please enter a valid age', 400));
  }
  
  // Ensure date is stored as a Date object for proper querying
  const appointmentDate = new Date(date);
  
  // Create appointment object (without user association)
  const appointment = new Appointment({
    name,
    gender: gender || '',
    age: age ? Number(age) : undefined,
    phone,
    email,
    date: appointmentDate, // Store as Date object
    time, // This should be a string in HH:MM format
    reason: reason || 'General Consultation',
    notes: notes || '',
    status: 'pending'
  });
  
  await appointment.save();
  
  res.status(201).json({
    success: true,
    message: 'Appointment request submitted successfully! Our team will contact you shortly.',
    appointment,
  });
});

// Get user appointments
export const getUserAppointments = asyncHandler(async (req, res, next) => {
  // Get ALL appointments for this user, regardless of status
  // Use lean() for better performance and select only needed fields
  const appointments = await Appointment.find({ userId: req.user.userId })
    .populate('doctorId', 'name email')
    .sort({ date: -1, time: -1 }) // Sort by date and time, newest first
    .lean();
  
  res.json({
    success: true,
    count: appointments.length,
    appointments
  });
});

// Get appointment by ID for authenticated user
export const getAppointmentById = asyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findOne({ _id: req.params.id, userId: req.user.userId })
    .populate('doctorId', 'name email')
    .lean();
  
  if (!appointment) {
    return next(new ErrorResponse('Appointment not found or not authorized', 404));
  }
  
  res.json({
    success: true,
    appointment
  });
});

// Update appointment status
export const updateAppointmentStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
  
  if (!validStatuses.includes(status)) {
    return next(new ErrorResponse('Invalid status', 400));
  }
  
  const appointment = await Appointment.findById(req.params.id);
  
  if (!appointment) {
    return next(new ErrorResponse('Appointment not found', 404));
  }
  
  // Check if user is authorized to update this appointment
  if (appointment.userId && appointment.userId.toString() !== req.user.userId) {
    return next(new ErrorResponse('Not authorized to update this appointment', 403));
  }
  
  appointment.status = status;
  await appointment.save();
  
  res.json({
    success: true,
    message: 'Appointment updated successfully',
    appointment,
  });
});

// Cancel appointment
export const cancelAppointment = asyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id);
  
  if (!appointment) {
    return next(new ErrorResponse('Appointment not found', 404));
  }
  
  // Check if user is authorized to cancel this appointment
  if (appointment.userId && appointment.userId.toString() !== req.user.userId) {
    return next(new ErrorResponse('Not authorized to cancel this appointment', 403));
  }
  
  // Only allow cancellation of pending appointments
  if (appointment.status !== 'pending') {
    return next(new ErrorResponse('Only pending appointments can be cancelled', 400));
  }
  
  appointment.status = 'cancelled';
  await appointment.save();
  
  res.json({ 
    success: true,
    message: 'Appointment cancelled successfully' 
  });
});