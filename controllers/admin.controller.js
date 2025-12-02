import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import ContactMessage from "../models/ContactMessage.js";
import MedicalReport from "../models/MedicalReport.js";
import { normalizeTestResults } from "../utils/reportUtils.js";

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    // Use lean() for better performance when we don't need Mongoose documents
    const users = await User.find({ role: { $ne: "admin" } })
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update user
export async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { name, email, phone, role, bloodGroup, height, weight, allergies, location, additionalHealthInfo } = req.body;

    // Find user by ID
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields if provided
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (role !== undefined) user.role = role;
    if (bloodGroup !== undefined) user.bloodGroup = bloodGroup;
    if (height !== undefined) user.height = height;
    if (weight !== undefined) user.weight = weight;
    if (allergies !== undefined) user.allergies = allergies;
    if (location !== undefined) user.location = location;
    if (additionalHealthInfo !== undefined) user.additionalHealthInfo = additionalHealthInfo;

    // Save updated user
    await user.save();

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        bloodGroup: user.bloodGroup,
        height: user.height,
        weight: user.weight,
        allergies: user.allergies,
        location: user.location,
        additionalHealthInfo: user.additionalHealthInfo,
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Use deleteOne() instead of remove() for newer Mongoose versions
    await User.deleteOne({ _id: req.params.id });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    // console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all appointments
export const getAllAppointments = async (req, res) => {
  try {
    // Use lean() for better performance and select only needed fields
    const appointments = await Appointment.find()
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 })
      .lean();
    res.json(appointments);
  } catch (error) {
    // console.error("Error in getAllAppointments:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get appointment by ID
export const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate(
      "userId",
      "name email phone"
    );

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update appointment
export const updateAppointment = async (req, res) => {
  try {
    const { status, date, time, reason, notes } = req.body;

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Update fields if provided
    if (status) appointment.status = status;
    if (date) appointment.date = date;
    if (time) appointment.time = time;
    if (reason) appointment.reason = reason;
    if (notes !== undefined) appointment.notes = notes;

    await appointment.save();
        
    // Populate user details
    await appointment.populate("userId", "name email phone");

    res.json({
      message: "Appointment updated successfully",
      appointment,
    });
  } catch (error) {
    // console.error("Error updating appointment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete appointment
export const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Use deleteOne() instead of remove() for newer Mongoose versions
    await Appointment.deleteOne({ _id: req.params.id });
    res.json({ message: "Appointment deleted successfully" });
  } catch (error) {
    // console.error("Error deleting appointment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all contact messages
export const getAllContactMessages = async (req, res) => {
  try {
    // Use lean() for better performance
    const messages = await ContactMessage.find()
      .sort({ createdAt: -1 })
      .lean();
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete contact message
export const deleteContactMessage = async (req, res) => {
  try {
    const message = await ContactMessage.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: "Contact message not found" });
    }

    // Use deleteOne() instead of remove() for newer Mongoose versions
    await ContactMessage.deleteOne({ _id: req.params.id });
    res.json({ message: "Contact message deleted successfully" });
  } catch (error) {
    // console.error("Error deleting contact message:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Create medical report by admin
export const createMedicalReportByAdmin = async (req, res) => {
  try {
    const { userId, category, date, results, attachments, notes } = req.body;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Normalize test results based on report type
    const normalizedResults = normalizeTestResults(results, category);
    
    const report = new MedicalReport({
      userId,
      category,
      date,
      results: normalizedResults,
      attachments,
      notes,
    });
    
    await report.save();
    
    res.status(201).json({
      message: 'Medical report created successfully',
      report,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all medical reports (Admin only)
export const getAllMedicalReports = async (req, res) => {
  try {
    // Use lean() for better performance
    const reports = await MedicalReport.find()
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 })
      .lean();
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get medical report by ID (Admin only)
export const getMedicalReportById = async (req, res) => {
  try {
    const report = await MedicalReport.findById(req.params.id).populate(
      "userId",
      "name email phone"
    );

    if (!report) {
      return res.status(404).json({ message: "Medical report not found" });
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update medical report (Admin only)
export const updateMedicalReport = async (req, res) => {
  try {
    const { category, date, results, attachments, notes } = req.body;

    const report = await MedicalReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: "Medical report not found" });
    }

    // Update fields if provided
    if (category) report.category = category;
    if (date) report.date = date;
    if (results) report.results = results;
    if (attachments) report.attachments = attachments;
    if (notes !== undefined) report.notes = notes;

    await report.save();
        
    // Populate user details
    await report.populate("userId", "name email phone");

    res.json({
      message: "Medical report updated successfully",
      report,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete medical report (Admin only)
export const deleteMedicalReport = async (req, res) => {
  try {
    const report = await MedicalReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: "Medical report not found" });
    }

    // Use deleteOne() instead of remove() for newer Mongoose versions
    await MedicalReport.deleteOne({ _id: req.params.id });
    res.json({ message: "Medical report deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};