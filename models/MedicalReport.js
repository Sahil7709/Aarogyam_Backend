import mongoose from 'mongoose';

const medicalReportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['blood-test', 'gut-test']
  },
  date: { type: Date, required: true },
  results: mongoose.Schema.Types.Mixed,
  attachments: [String],
  notes: String,
  createdAt: { type: Date, default: Date.now },
});

// Add indexes for better query performance
medicalReportSchema.index({ userId: 1 });
medicalReportSchema.index({ category: 1 });
medicalReportSchema.index({ date: -1 });
medicalReportSchema.index({ createdAt: -1 });

export default mongoose.model('MedicalReport', medicalReportSchema);