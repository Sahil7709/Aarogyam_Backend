// Controller for appointment-related operations

import Appointment from '../models/Appointment.js';
import User from '../models/User.js';

// Create a new appointment
export const createAppointment = async (req, res) => {
  try {
    const { name, gender, age, phone, email, date, time, reason, notes } = req.body;
    
    // Check if user is authenticated
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Simple validation for required fields (matching our new structure)
    if (!name || !phone || !email || !date || !time) {
      return res.status(400).json({ message: 'Name, phone, email, date, and time are required' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }
    
    // Validate phone number (simple validation)
    if (phone.length < 10) {
      return res.status(400).json({ message: 'Please enter a valid phone number' });
    }
    
    // Validate age (if provided)
    if (age && (isNaN(Number(age)) || Number(age) <= 0)) {
      return res.status(400).json({ message: 'Please enter a valid age' });
    }
    
    // Log the date and time values for debugging
    // console.log('Creating appointment with date:', date, 'time:', time);
    
    // Ensure date is stored as a Date object for proper querying
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
    
    // Log the saved appointment for debugging
    // console.log('Appointment saved:', appointment);
    
    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment,
    });
  } catch (error) {
    // console.error('Error creating appointment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Public appointment creation (no authentication required)
export const createPublicAppointment = async (req, res) => {
  try {
    const { name, gender, age, phone, email, date, time, reason, notes } = req.body;
    
    // Simple validation (matching our new structure)
    if (!name || !phone || !email || !date || !time) {
      return res.status(400).json({ message: 'Name, phone, email, date, and time are required' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }
    
    // Validate phone number (simple validation)
    if (phone.length < 10) {
      return res.status(400).json({ message: 'Please enter a valid phone number' });
    }
    
    // Validate age (if provided)
    if (age && (isNaN(Number(age)) || Number(age) <= 0)) {
      return res.status(400).json({ message: 'Please enter a valid age' });
    }
    
    // Log the date and time values for debugging
    // console.log('Creating public appointment with date:', date, 'time:', time);
    
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
    
    // Log the saved appointment for debugging
    // console.log('Public appointment saved:', appointment);
    
    res.status(201).json({
      message: 'Appointment request submitted successfully! Our team will contact you shortly.',
      appointment,
    });
  } catch (error) {
    // console.error('Error creating public appointment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user appointments
export const getUserAppointments = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // console.log('Fetching appointments for user:', req.user.userId);
    
    // Get ALL appointments for this user, regardless of status
    // Use lean() for better performance and select only needed fields
    const appointments = await Appointment.find({ userId: req.user.userId })
      .populate('doctorId', 'name email')
      .sort({ date: -1, time: -1 }) // Sort by date and time, newest first
      .lean();
    
    res.json(appointments);
  } catch (error) {
    // console.error('Error fetching user appointments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get appointment by ID for authenticated user
export const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findOne({ _id: req.params.id, userId: req.user.userId })
      .populate('doctorId', 'name email');
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found or not authorized' });
    }
    
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update appointment status
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('doctorId', 'name email');
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // Check if user is authorized to update this appointment
    if (appointment.userId && appointment.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to update this appointment' });
    }
    
    res.json({
      message: 'Appointment updated successfully',
      appointment,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Cancel appointment
export const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // Check if user is authorized to cancel this appointment
    if (appointment.userId && appointment.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to cancel this appointment' });
    }
    
    // Only allow cancellation of pending appointments
    if (appointment.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending appointments can be cancelled' });
    }
    
    appointment.status = 'cancelled';
    await appointment.save();
    
    res.json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};