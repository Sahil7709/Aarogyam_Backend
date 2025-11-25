import twilio from 'twilio';

// Twilio configuration - to be set in environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_SERVICE_SID;
const fromNumber = process.env.TWILIO_FROM_NUMBER;

// Initialize Twilio client only if credentials are provided
let client = null;
if (accountSid && authToken) {
  client = twilio(accountSid, authToken);
}

// Send OTP to phone number
export async function sendOTP(phoneNumber) {
  // Skip Twilio functionality if not configured
  if (!client || !serviceSid) {
    console.warn('Twilio not configured. Skipping OTP sending.');
    // Return a mock success response for development
    return { success: true, sessionId: 'mock-session-id' };
  }
  
  try {
    // Format phone number (ensure it starts with +)
    const formattedPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    
    // Send verification code
    const verification = await client.verify.v2
      .services(serviceSid)
      .verifications.create({
        to: formattedPhoneNumber,
        channel: 'sms'
      });
    
    console.log(`OTP sent to ${formattedPhoneNumber}: ${verification.status}`);
    return { success: true, sessionId: verification.sid };
  } catch (error) {
    console.error('Error sending OTP:', error);
    return { success: false, error: error.message };
  }
}

// Verify OTP
export async function verifyOTP(phoneNumber, otp) {
  // Skip Twilio functionality if not configured
  if (!client || !serviceSid) {
    console.warn('Twilio not configured. Accepting any OTP for development.');
    // Accept any OTP for development purposes
    return { success: true };
  }
  
  try {
    // Format phone number (ensure it starts with +)
    const formattedPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    
    // Verify the code
    const verificationCheck = await client.verify.v2
      .services(serviceSid)
      .verificationChecks.create({
        to: formattedPhoneNumber,
        code: otp
      });
    
    console.log(`OTP verification for ${formattedPhoneNumber}: ${verificationCheck.status}`);
    
    if (verificationCheck.status === 'approved') {
      return { success: true };
    } else {
      return { success: false, error: 'Invalid OTP' };
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return { success: false, error: error.message };
  }
}