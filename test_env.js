import dotenv from 'dotenv';
dotenv.config();

console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? 'SET' : 'NOT SET');
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? 'SET' : 'NOT SET');
console.log('TWILIO_SERVICE_SID:', process.env.TWILIO_SERVICE_SID ? 'SET' : 'NOT SET');

// Test Twilio connection
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_SERVICE_SID;

console.log('Account SID exists:', !!accountSid);
console.log('Auth Token exists:', !!authToken);
console.log('Service SID exists:', !!serviceSid);

if (accountSid && authToken) {
  const client = twilio(accountSid, authToken);
  console.log('Twilio client created successfully');
  
  // Test if we can access the service
  if (serviceSid) {
    client.verify.v2.services(serviceSid)
      .fetch()
      .then(service => {
        console.log('Twilio service verified:', service.friendlyName);
      })
      .catch(error => {
        console.error('Error verifying Twilio service:', error.message);
      });
  }
} else {
  console.log('Twilio credentials not properly configured');
}