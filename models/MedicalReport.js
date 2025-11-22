import mongoose from 'mongoose';

const medicalReportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  reportType: { 
    type: String, 
    required: true,
    enum: ['blood-test', 'urine-test', 'x-ray', 'mri', 'ct-scan', 'ecg', 'other']
  },
  date: { type: Date, required: true },
  doctor: String,
  hospital: String,
  results: mongoose.Schema.Types.Mixed,
  attachments: [String],
  notes: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('MedicalReport', medicalReportSchema);