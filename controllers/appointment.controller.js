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
    
    const appointment = new Appointment({
      userId: req.user.userId,
      name,
      gender: gender || '',
      age: age ? Number(age) : undefined,
      phone,
      email,
      date,
      time,
      reason: reason || 'General Consultation',
      notes: notes || '',
    });
    
    await appointment.save();
    
    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment,
    });
  } catch (error) {
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
    
    // Create appointment object (without user association)
    const appointment = new Appointment({
      name,
      gender: gender || '',
      age: age ? Number(age) : undefined,
      phone,
      email,
      date,
      time,
      reason: reason || 'General Consultation',
      notes: notes || '',
      status: 'pending'
    });
    
    await appointment.save();
    
    res.status(201).json({
      message: 'Appointment request submitted successfully! Our team will contact you shortly.',
      appointment,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user appointments
export const getUserAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.user.userId })
      .populate('doctorId', 'name email')
      .sort({ date: 1, time: 1 });
    
    res.json(appointments);
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