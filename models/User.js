import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true },
  password: { type: String }, // Not required for OTP users
  phone: { type: String, unique: true, sparse: true }, // Unique constraint for phone numbers, sparse to allow null values
  otp: { type: String }, // OTP for phone verification
  otpExpires: { type: Date }, // OTP expiration time
  role: { type: String, default: 'patient', enum: ['patient', 'doctor', 'admin'] },
  
  // Basic health information
  bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
  height: { type: String },
  weight: { type: String },
  allergies: { type: String },
  location: { type: String }, // Added location field
  
  // Additional health information
  additionalHealthInfo: [{
    title: { type: String },
    value: { type: String }
  }],
  
  createdAt: { type: Date, default: Date.now },
});

// Add indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

export default mongoose.model('User', userSchema);