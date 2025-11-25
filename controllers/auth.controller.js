import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendOTP, verifyOTP } from '../utils/twilio.js';

// Check if user exists by email or phone
export async function checkUserExists(req, res) {
  try {
    const { email, phone } = req.body;
    
    let existingUser = null;
    
    if (email) {
      existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.json({ 
          exists: true, 
          message: 'An account with this email already exists' 
        });
      }
    }
    
    if (phone) {
      // Ensure consistent phone number format
      let formattedPhone = phone;
      if (phone) {
        formattedPhone = phone.replace(/\s+/g, '').trim();
      }
      
      existingUser = await User.findOne({ phone: formattedPhone });
      if (existingUser) {
        return res.json({ 
          exists: true, 
          message: 'An account with this phone number already exists' 
        });
      }
    }
    
    res.json({ 
      exists: false, 
      message: 'User does not exist' 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Check if phone number is registered
export async function checkPhoneNumber(req, res) {
  try {
    const { phoneNumber } = req.body;
    
    console.log(`Checking phone number: ${phoneNumber}`);
    
    const existingUser = await User.findOne({ phone: phoneNumber });
    
    if (existingUser) {
      console.log(`Found user with phone: ${existingUser.phone}`);
      res.json({ 
        registered: true, 
        message: 'Phone number is registered' 
      });
    } else {
      console.log(`No user found with phone: ${phoneNumber}`);
      res.json({ 
        registered: false, 
        message: 'Phone number is not registered' 
      });
    }
  } catch (error) {
    console.error('Error checking phone number:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Send OTP
export async function sendOtp(req, res) {
  try {
    const { phone } = req.body;
    
    // Find user by phone
    const user = await User.findOne({ phone });
    
    if (!user) {
      console.log(`User not found with phone: ${phone}`);
      return res.status(400).json({ message: 'User not found. Please register first.' });
    }
    
    // Send OTP via Twilio
    const otpResult = await sendOTP(phone);
    
    if (!otpResult.success) {
      console.error('Failed to send OTP via Twilio:', otpResult.error);
      return res.status(500).json({ message: 'Failed to send OTP', error: otpResult.error });
    }
    
    // For development purposes, we'll still generate and save a random OTP
    // In production with Twilio Verify, this wouldn't be necessary
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();
    
    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Verify OTP
export async function verifyOtp(req, res) {
  try {
    const { phone, otp } = req.body;
    
    // Find user by phone
    const user = await User.findOne({ phone });
    
    if (!user) {
      console.log(`User not found with phone: ${phone}`);
      return res.status(400).json({ message: 'User not found' });
    }
    
    // For production with Twilio Verify, we would use the Twilio verification
    // For development, we'll check the stored OTP
    // In production, you would comment out the next 2 lines and uncomment the Twilio verification
    
    if (user.otp !== otp) {
      // For production with Twilio:
      // const verificationResult = await verifyOTP(phone, otp);
      // if (!verificationResult.success) {
      //   return res.status(400).json({ message: verificationResult.error || 'Invalid OTP' });
      // }
      
      // For development:
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    
    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'OTP has expired' });
    }
    
    // Clear OTP
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
    
    // Generate JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'aarogyam_secret_key';
    const payload = { userId: user._id };
    if (user.email) payload.email = user.email;
    if (user.phone) payload.phone = user.phone;
    
    const token = jwt.sign(payload, JWT_SECRET);
    
    res.json({
      message: 'OTP verified successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// User Registration
export async function register(req, res) {
  try {
    const { name, email, password, phone } = req.body;
    
    // Check if user already exists
    let existingUser = null;
    if (email) {
      existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'An account with this email already exists' });
      }
    }
    
    if (phone) {
      existingUser = await User.findOne({ phone });
      if (existingUser) {
        return res.status(400).json({ message: 'An account with this phone number already exists' });
      }
    }
    
    // Create user object
    const userData = { name };
    
    // Add phone only if provided, with consistent formatting
    if (phone) {
      // Ensure consistent phone number format
      let formattedPhone = phone || '';
      if (phone) {
        formattedPhone = phone.replace(/\s+/g, '').trim();
      }
      userData.phone = formattedPhone;
    }
    
    // Add email and password if provided
    if (email) {
      userData.email = email;
      // Hash password
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(password, salt);
    }
    
    // Create new user
    const user = new User(userData);
    await user.save();
    
    // Generate JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'aarogyam_secret_key';
    const payload = { userId: user._id };
    if (user.email) payload.email = user.email;
    if (user.phone) payload.phone = user.phone;
    
    const token = jwt.sign(payload, JWT_SECRET);
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Admin Registration
export async function registerAdmin(req, res) {
  try {
    const { name, email, password, phone } = req.body;
    
    // Check if user already exists
    let existingUser = null;
    if (email) {
      existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'An account with this email already exists' });
      }
    }
    
    if (phone) {
      existingUser = await User.findOne({ phone });
      if (existingUser) {
        return res.status(400).json({ message: 'An account with this phone number already exists' });
      }
    }
    
    // Create user object with admin role
    const userData = { name, role: 'admin' };
    
    // Add phone only if provided, with consistent formatting
    if (phone) {
      // Ensure consistent phone number format
      let formattedPhone = phone || '';
      if (phone) {
        formattedPhone = phone.replace(/\s+/g, '').trim();
      }
      userData.phone = formattedPhone;
    }
    
    // Add email and password if provided
    if (email) {
      userData.email = email;
      // Hash password
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(password, salt);
    }
    
    // Create new user
    const user = new User(userData);
    await user.save();
    
    // Generate JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'aarogyam_secret_key';
    const payload = { userId: user._id };
    if (user.email) payload.email = user.email;
    if (user.phone) payload.phone = user.phone;
    
    const token = jwt.sign(payload, JWT_SECRET);
    
    res.status(201).json({
      message: 'Admin registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// User Login
export async function login(req, res) {
  try {
    const { email, password, phone } = req.body;
    
    console.log('Login attempt with:', { email, password, phone });
    
    // Check if either email or phone is provided
    if (!email && !phone) {
      console.log('Login failed: Email or phone number is required');
      return res.status(400).json({ message: 'Email or phone number is required' });
    }
    
    let user;
    if (email) {
      // Find user by email
      console.log('Searching for user by email:', email);
      user = await User.findOne({ email });
      if (!user) {
        console.log('Login failed: User not found with email');
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      
      // Check password
      console.log('Checking password for user:', user.email);
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.log('Login failed: Invalid password');
        return res.status(400).json({ message: 'Invalid credentials' });
      }
    } else if (phone) {
      // Find user by phone (for OTP users)
      console.log('Searching for user by phone:', phone);
      user = await User.findOne({ phone });
      if (!user) {
        console.log('Login failed: User not found with phone');
        return res.status(400).json({ message: 'User not found. Please register first.' });
      }
      
      // For phone-based login, we'll send an OTP
      // In a real implementation, you would redirect to OTP verification
      // For now, we'll just return success
    }
    
    // Generate JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'aarogyam_secret_key';
    const payload = { userId: user._id };
    if (user.email) payload.email = user.email;
    if (user.phone) payload.phone = user.phone;
    
    console.log('Generating token for user:', user.email || user.phone);
    const token = jwt.sign(payload, JWT_SECRET);
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Get User Profile
export async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}