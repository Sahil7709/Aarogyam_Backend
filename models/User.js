import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: String,
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








