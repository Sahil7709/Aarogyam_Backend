import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendOTP, verifyOTP } from '../utils/twilio.js';
import asyncHandler from '../utils/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';

// Check if user exists by email or phone
export const checkUserExists = asyncHandler(async (req, res, next) => {
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
});

// Check if phone number is registered
export const checkPhoneNumber = asyncHandler(async (req, res, next) => {
  const { phoneNumber } = req.body;
  
  // Ensure consistent phone number format
  let formattedPhone = phoneNumber;
  if (phoneNumber) {
    // Remove spaces and ensure it starts with +
    formattedPhone = phoneNumber.replace(/\s+/g, '').trim();
    if (!formattedPhone.startsWith('+')) {
      // If no country code, assume India (+91)
      if (formattedPhone.length === 10) {
        formattedPhone = '+91' + formattedPhone;
      }
    }
  }
  
  const existingUser = await User.findOne({ phone: formattedPhone });
  
  if (existingUser) {
    res.json({ 
      registered: true, 
      message: 'Phone number is registered' 
    });
  } else {
    res.json({ 
      registered: false, 
      message: 'Phone number is not registered' 
    });
  }
});

// Send OTP
export const sendOtp = asyncHandler(async (req, res, next) => {
  let { phone } = req.body;
  
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
  
  // Find user by phone
  const user = await User.findOne({ phone });
  
  if (!user) {
    return next(new ErrorResponse('User not found. Please register first.', 404));
  }
  
  // Send OTP via Twilio
  const otpResult = await sendOTP(phone);
  
  if (!otpResult.success) {
    // Return a more descriptive error message
    const errorMessage = otpResult.error || 'Failed to send OTP';
    return next(new ErrorResponse(errorMessage, 500));
  }
  
  // If Twilio is not configured, our utility returns a devOtp which we should store
  // so that verification can work in development without Twilio.
  if (otpResult.devOtp) {
    try {
      user.otp = otpResult.devOtp;
      user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
      await user.save();
    } catch (err) {
      // Error saving OTP, but we shouldn't fail the request because of this
      console.error('Failed to save dev OTP to user:', err);
    }
  }

  // Return success, and in non-production include the devOtp for easier testing
  const responseBody = { message: 'OTP sent successfully' };
  if (otpResult.devOtp && process.env.NODE_ENV !== 'production') {
    responseBody.devOtp = otpResult.devOtp;
  }

  res.json(responseBody);
});

// Verify OTP
export const verifyOtp = asyncHandler(async (req, res, next) => {
  let { phone, otp } = req.body;
  
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
  
  // Find user by phone
  const user = await User.findOne({ phone });
  
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }
  
  // Use Twilio verification instead of checking stored OTP
  const verificationResult = await verifyOTP(phone, otp);
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
        return next(new ErrorResponse('Invalid OTP', 400));
      }
    } else {
      return next(new ErrorResponse('OTP expired or not found', 400));
    }
  } else {
    return next(new ErrorResponse(verificationResult.error || 'Invalid OTP', 400));
  }

  // If verified via dev fallback, clear stored OTP
  if (verified && user.otp) {
    try {
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save();
    } catch (err) {
      // Error clearing OTP, but we shouldn't fail the request because of this
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
});

// User Registration
export const register = asyncHandler(async (req, res, next) => {
  let { name, email, password, phone, bloodGroup, height, weight, allergies, location } = req.body;
  
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
      return next(new ErrorResponse('An account with this email already exists', 409));
    }
  }
  
  if (phone) {
    existingUser = await User.findOne({ phone });
    if (existingUser) {
      return next(new ErrorResponse('An account with this phone number already exists', 409));
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
  
  // Add patient profile information if provided
  if (bloodGroup) userData.bloodGroup = bloodGroup;
  if (height) userData.height = height;
  if (weight) userData.weight = weight;
  if (allergies) userData.allergies = allergies;
  if (location) userData.location = location;
  
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
    success: true,
    message: 'User registered successfully',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      bloodGroup: user.bloodGroup,
      height: user.height,
      weight: user.weight,
      allergies: user.allergies,
      location: user.location,
    },
  });
});

// Admin Registration
export const registerAdmin = asyncHandler(async (req, res, next) => {
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
      return next(new ErrorResponse('An account with this email already exists', 409));
    }
  }
  
  if (phone) {
    existingUser = await User.findOne({ phone });
    if (existingUser) {
      return next(new ErrorResponse('An account with this phone number already exists', 409));
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
    success: true,
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
});

// User Login
export const login = asyncHandler(async (req, res, next) => {
  let { email, password, phone } = req.body;
  
  // Check if either email or phone is provided
  if (!email && !phone) {
    return next(new ErrorResponse('Email or phone number is required', 400));
  }
  
  let user;
  if (email) {
    // Find user by email
    user = await User.findOne({ email });
    if (!user) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(new ErrorResponse('Invalid credentials', 401));
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
    user = await User.findOne({ phone });
    if (!user) {
      return next(new ErrorResponse('User not found. Please register first.', 404));
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
  

  const token = jwt.sign(payload, JWT_SECRET);
  
  res.json({
    success: true,
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
});

// Get User Profile
export const getProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.userId).select('-password');
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }
  res.json({
    success: true,
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
      createdAt: user.createdAt,
    }
  });
});

// Update User Profile
export const updateProfile = asyncHandler(async (req, res, next) => {
  const { name, email, phone, bloodGroup, height, weight, allergies, location, additionalHealthInfo } = req.body;
  
  // Find user by ID from token
  const user = await User.findById(req.user.userId);
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }
  
  // Check for email conflicts if email is being updated
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ErrorResponse('An account with this email already exists', 409));
    }
  }
  
  // Check for phone conflicts if phone is being updated
  if (phone && phone !== user.phone) {
    // Format phone number consistently
    let formattedPhone = phone;
    if (phone) {
      formattedPhone = phone.replace(/\s+/g, '').trim();
      if (!formattedPhone.startsWith('+')) {
        if (formattedPhone.length === 10) {
          formattedPhone = '+91' + formattedPhone;
        }
      }
    }
    
    const existingUser = await User.findOne({ phone: formattedPhone });
    if (existingUser) {
      return next(new ErrorResponse('An account with this phone number already exists', 409));
    }
    
    // Update the formatted phone
    user.phone = formattedPhone;
  }
  
  // Update fields if provided
  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (bloodGroup !== undefined) user.bloodGroup = bloodGroup;
  if (height !== undefined) user.height = height;
  if (weight !== undefined) user.weight = weight;
  if (allergies !== undefined) user.allergies = allergies;
  if (location !== undefined) user.location = location;
  if (additionalHealthInfo !== undefined) user.additionalHealthInfo = additionalHealthInfo;
  
  // Save updated user
  await user.save();
  
  res.json({
    success: true,
    message: 'Profile updated successfully',
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
});