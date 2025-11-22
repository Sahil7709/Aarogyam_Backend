import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  // For authenticated users
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  
  // For public appointments
  name: { type: String, required: false },
  gender: { type: String, required: false },
  age: { type: Number, required: false },
  phone: { type: String, required: false },
  email: { type: String, required: false },
   
  // Common fields
  date: { type: Date, required: true },
  time: { type: String, required: true },
  status: { type: String, default: 'pending', enum: ['pending', 'confirmed', 'cancelled', 'completed'] },
  reason: { type: String, required: true },
  notes: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Appointment', appointmentSchema);