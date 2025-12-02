import mongoose from 'mongoose';

const contactMessageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, default: 'unread', enum: ['unread', 'read', 'replied'] },
  createdAt: { type: Date, default: Date.now },
});

// Add indexes for better query performance
contactMessageSchema.index({ status: 1 });
contactMessageSchema.index({ createdAt: -1 });

export default mongoose.model('ContactMessage', contactMessageSchema);