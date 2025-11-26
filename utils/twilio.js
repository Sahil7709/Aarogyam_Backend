// backend/utils/twilio.js
import twilio from "twilio";
import dotenv from "dotenv";
dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_SERVICE_SID;

let client = null;
if (accountSid && authToken) {
  client = twilio(accountSid, authToken);
}

/**
 * Send an OTP using Twilio Verify (if configured).
 * If Twilio not configured, returns a generated OTP for dev (caller should store/send it).
 * @param {string} phone - E.164 formatted phone e.g. +919876543210
 * @returns {Promise<{success:boolean, sid?:string, devOtp?:string, error?:string}>}
 */
export async function sendOTP(phone) {
  try {
    if (client && serviceSid) {
      const verification = await client.verify.v2
        .services(serviceSid)
        .verifications.create({ to: phone, channel: "sms" });
      return { success: true, sid: verification.sid };
    }

    // DEV fallback: generate OTP and return it so caller can save & (optionally) log it
    const devOtp = Math.floor(100000 + Math.random() * 900000).toString();
    console.warn("Twilio not configured. Using DEV fallback OTP:", devOtp);
    return { success: true, devOtp };
  } catch (err) {
    console.error("sendOTP error:", err);
    return { success: false, error: err.message || "sendOTP failed" };
  }
}

/**
 * Verify OTP. If Twilio configured it checks with Twilio Verify.
 * If Twilio not configured, caller should pass the stored dev OTP check (we will not access DB here).
 * @param {string} phone
 * @param {string} code
 * @returns {Promise<{success:boolean, status?:string, error?:string}>}
 */
export async function verifyOTP(phone, code) {
  try {
    if (client && serviceSid) {
      const verificationCheck = await client.verify.v2
        .services(serviceSid)
        .verificationChecks.create({ to: phone, code });
      // Twilio returns status 'approved' when code correct
      if (verificationCheck.status === "approved") {
        return { success: true, status: verificationCheck.status };
      }
      return { success: false, status: verificationCheck.status };
    }

    // DEV fallback: we cannot access DB here; caller will compare code with stored OTP
    // Return success:false but no error so caller uses local check
    return { success: false, error: "TWILIO_NOT_CONFIGURED" };
  } catch (err) {
    console.error("verifyOTP error:", err);
    return { success: false, error: err.message || "verifyOTP failed" };
  }
}
