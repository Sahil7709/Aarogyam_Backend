import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true },
  password: { type: String }, // Not required for OTP users
  phone: { type: String, unique: true, sparse: true }, // Unique constraint for phone numbers, sparse to allow null values
  otp: { type: String }, // OTP for phone verification
  otpExpires: { type: Date }, // OTP expiration time
  role: { type: String, default: 'patient', enum: ['patient', 'doctor', 'admin'] },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('User', userSchema);


{/* <userid>PhoneNbr</userid>
<account>1
   <username></username>


</account>

8700001101----->appontment/contact us
8700001102 */}








