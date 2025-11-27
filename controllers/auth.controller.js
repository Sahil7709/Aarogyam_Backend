import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendOTP, verifyOTP } from '../utils/twilio.js';

// Check if user exists by email or phone
export async function checkUserExists(req, res) {
  try {
    let { email, phone } = req.body;
    
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
      if (phone) {
        // Remove spaces and ensure it starts with +
        phone = phone.replace(/\s+/g, '').trim();
        if (!phone.startsWith('+')) {
          // If no country code, assume India (+91)
          if (phone.length === 10) {
            phone = '+91' + phone;
          }
        }
      }
      
      existingUser = await User.findOne({ phone });
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
    
    console.log(`=== CHECK PHONE DEBUG ===`);
    console.log(`Received phoneNumber: "${phoneNumber}"`);
    console.log(`Type of phoneNumber: ${typeof phoneNumber}`);
    console.log(`Length of phoneNumber: ${phoneNumber ? phoneNumber.length : 'null'}`);
    
    // Ensure consistent phone number format
    let formattedPhone = phoneNumber;
    if (phoneNumber) {
      // Remove spaces and ensure it starts with +
      formattedPhone = phoneNumber.replace(/\s+/g, '').trim();
      console.log(`After removing spaces: "${formattedPhone}"`);
      if (!formattedPhone.startsWith('+')) {
        // If no country code, assume India (+91)
        if (formattedPhone.length === 10) {
          formattedPhone = '+91' + formattedPhone;
        }
      }
    }
    
    console.log(`Final formattedPhone: "${formattedPhone}"`);
    
    const existingUser = await User.findOne({ phone: formattedPhone });
    
    console.log(`User lookup result:`, existingUser ? 'Found' : 'Not found');
    
    if (existingUser) {
      console.log(`Found user with phone: ${existingUser.phone}`);
      res.json({ 
        registered: true, 
        message: 'Phone number is registered' 
      });
    } else {
      console.log(`No user found with phone: ${formattedPhone}`);
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
    let { phone } = req.body;
    
    console.log(`=== SEND OTP DEBUG ===`);
    console.log(`Received phone: "${phone}"`);
    console.log(`Type of phone: ${typeof phone}`);
    console.log(`Length of phone: ${phone ? phone.length : 'null'}`);
    
    // Ensure consistent phone number format
    if (phone) {
      // Remove spaces and ensure it starts with +
      phone = phone.replace(/\s+/g, '').trim();
      console.log(`After removing spaces: "${phone}"`);
      if (!phone.startsWith('+')) {
        // If no country code, assume India (+91)
        if (phone.length === 10) {
          phone = '+91' + phone;
        }
      }
    }
    
    console.log(`Final phone: "${phone}"`);
    
    // Find user by phone
    const user = await User.findOne({ phone });
    
    console.log(`User lookup result:`, user ? 'Found' : 'Not found');
    
    if (!user) {
      console.log(`User not found with phone: ${phone}`);
      return res.status(400).json({ message: 'User not found. Please register first.' });
    }
    
    // Send OTP via Twilio
    console.log(`Sending OTP via Twilio to: ${phone}`);
    const otpResult = await sendOTP(phone);
    console.log(`Twilio OTP result:`, otpResult);
    
    if (!otpResult.success) {
      console.error('Failed to send OTP via Twilio:', otpResult.error);
      // Return a more descriptive error message
      const errorMessage = otpResult.error || 'Failed to send OTP';
      console.error('Detailed error:', errorMessage);
      return res.status(500).json({ 
        message: 'Authenticate', 
        error: 'Failed to send OTP',
        details: errorMessage 
      });
    }
    // If Twilio is not configured, our utility returns a devOtp which we should store
    // so that verification can work in development without Twilio.
    if (otpResult.devOtp) {
      try {
        user.otp = otpResult.devOtp;
        user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();
      } catch (err) {
        console.error('Failed to save dev OTP to user:', err);
      }
    }

    // Return success, and in non-production include the devOtp for easier testing
    const responseBody = { message: 'OTP sent successfully' };
    if (otpResult.devOtp && process.env.NODE_ENV !== 'production') {
      responseBody.devOtp = otpResult.devOtp;
    }

    res.json(responseBody);
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Verify OTP
export async function verifyOtp(req, res) {
  try {
    let { phone, otp } = req.body;
    
    console.log(`=== VERIFY OTP DEBUG ===`);
    console.log(`Received phone: "${phone}", OTP: "${otp}"`);
    
    // Ensure consistent phone number format
    if (phone) {
      // Remove spaces and ensure it starts with +
      phone = phone.replace(/\s+/g, '').trim();
      if (!phone.startsWith('+')) {
        // If no country code, assume India (+91)
        if (phone.length === 10) {
          phone = '+91' + phone;
        }
      }
    }
    
    console.log(`Formatted phone: "${phone}"`);
    
    // Find user by phone
    const user = await User.findOne({ phone });
    
    if (!user) {
      console.log(`User not found with phone: ${phone}`);
      return res.status(400).json({ message: 'User not found' });
    }
    
    // Use Twilio verification instead of checking stored OTP
    console.log(`Verifying OTP via Twilio for: ${phone}`);
    const verificationResult = await verifyOTP(phone, otp);
    console.log(`Twilio verification result:`, verificationResult);
    // Handle both Twilio-backed verification and local dev fallback
    let verified = false;
    if (verificationResult.success) {
      verified = true;
    } else if (verificationResult.error === 'TWILIO_NOT_CONFIGURED') {
      // Twilio is not configured: fall back to verifying the OTP stored in DB
      if (user.otp && user.otpExpires && user.otpExpires > Date.now()) {
        if (user.otp === otp) {
          verified = true;
        } else {
          return res.status(400).json({ message: 'Invalid OTP' });
        }
      } else {
        return res.status(400).json({ message: 'OTP expired or not found' });
      }
    } else {
      return res.status(400).json({ message: verificationResult.error || 'Invalid OTP' });
    }

    // If verified via dev fallback, clear stored OTP
    if (verified && user.otp) {
      try {
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();
      } catch (err) {
        console.error('Failed to clear user OTP after verification:', err);
      }
    }
    
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
    let { name, email, password, phone } = req.body;
    
    // Format phone number consistently
    if (phone) {
      // Remove spaces and ensure it starts with +
      phone = phone.replace(/\s+/g, '').trim();
      if (!phone.startsWith('+')) {
        // If no country code, assume India (+91)
        if (phone.length === 10) {
          phone = '+91' + phone;
        }
      }
    }
    
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
    
    // Add phone only if provided
    if (phone) {
      userData.phone = phone;
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
    let { name, email, password, phone } = req.body;
    
    // Format phone number consistently
    if (phone) {
      // Remove spaces and ensure it starts with +
      phone = phone.replace(/\s+/g, '').trim();
      if (!phone.startsWith('+')) {
        // If no country code, assume India (+91)
        if (phone.length === 10) {
          phone = '+91' + phone;
        }
      }
    }
    
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
    
    // Add phone only if provided
    if (phone) {
      userData.phone = phone;
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
    let { email, password, phone } = req.body;
    
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
      // Format phone number consistently
      if (phone) {
        // Remove spaces and ensure it starts with +
        phone = phone.replace(/\s+/g, '').trim();
        if (!phone.startsWith('+')) {
          // If no country code, assume India (+91)
          if (phone.length === 10) {
            phone = '+91' + phone;
          }
        }
      }
      
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
        createdAt: user.createdAt,
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Update User Profile
export async function updateProfile(req, res) {
  try {
    const { name, email, phone } = req.body;
    
    // Find user by ID from token
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update fields if provided
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    
    // Save updated user
    await user.save();
    
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
