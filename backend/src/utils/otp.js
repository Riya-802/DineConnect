import dotenv from 'dotenv';

dotenv.config();

// Temporary in-memory OTP cache for verification
const otpCache = new Map();

/**
 * Generates a 4-digit numeric OTP and caches it for the given phone number.
 * If Twilio is configured, sends the SMS. Otherwise, logs it to the console.
 */
export const sendSMSOTP = async (phone, mockOverride = false) => {
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  otpCache.set(phone, otp);

  // Set timeout to clear OTP after 5 minutes
  setTimeout(() => {
    otpCache.delete(phone);
  }, 5 * 60 * 1000);

  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE;

  console.log(`\n======================================================`);
  console.log(`[OTP Engine] Generated SMS OTP for ${phone}: ${otp}`);
  console.log(`======================================================\n`);

  if (!mockOverride && twilioSid && twilioToken && twilioPhone) {
    try {
      // Dynamic import to avoid requiring twilio if not in package.json/configured
      const twilio = (await import('twilio')).default;
      const client = twilio(twilioSid, twilioToken);
      await client.messages.create({
        body: `Your DineConnect verification code is: ${otp}. Valid for 5 minutes.`,
        from: twilioPhone,
        to: phone
      });
      console.log(`[Twilio] SMS successfully sent to ${phone}`);
    } catch (err) {
      console.error(`[Twilio] Error sending SMS: ${err.message}. (Using console log fallback)`);
    }
  } else {
    console.log(`[Twilio Mock] SMS not sent (missing Twilio env variables). Use console logged OTP or default '1234'.`);
  }

  return otp;
};

/**
 * Verifies if the provided OTP matches the cached value.
 * Accepts '1234' as a universal development bypass.
 */
export const verifySMSOTP = (phone, otp) => {
  if (otp === '1234') {
    return true;
  }
  const cachedOtp = otpCache.get(phone);
  if (cachedOtp && cachedOtp === otp) {
    otpCache.delete(phone); // Burn OTP after verification
    return true;
  }
  return false;
};
