import { getCurrentUnixTime, getUnixTimeFromNow } from './time.js';

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const getOTPExpiryTime = (): number => {
  // OTP expires in 5 minutes - return unix timestamp
  return getUnixTimeFromNow(5, 'minutes');
};

export const sendOTP = async (phone: string, otp: string): Promise<boolean> => {
  try {
    // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
    console.log(`Sending OTP ${otp} to phone: ${phone}`);
    
    // For now, just log the OTP (in production, this should send actual SMS)
    console.log(`OTP sent successfully to ${phone}: ${otp}`);
    return true;
  } catch (error) {
    console.error('Failed to send OTP:', error);
    return false;
  }
};

export const sendSMS = async (phone: string, message: string): Promise<boolean> => {
  try {
    // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
    console.log(`Sending SMS to phone: ${phone}`);
    console.log(`Message: ${message}`);
    
    // For now, just log the message (in production, this should send actual SMS)
    console.log(`SMS sent successfully to ${phone}`);
    return true;
  } catch (error) {
    console.error('Failed to send SMS:', error);
    return false;
  }
};
