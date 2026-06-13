import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

/**
 * Create a Razorpay order
 * @param {{ amount: number, currency?: string, receipt: string, notes?: object }} opts
 *   amount — must be in paise (INR smallest unit). e.g. ₹100 → 10000
 * @returns {Promise<object>} Razorpay order object
 */
export const createRazorpayOrder = async ({
  amount,
  currency = 'INR',
  receipt,
  notes = {},
}) => {
  if (!amount || amount <= 0) {
    throw new Error('Amount must be a positive number (in paise)');
  }

  const options = {
    amount: Math.round(amount), // paise — must be integer
    currency,
    receipt: receipt?.toString().substring(0, 40), // max 40 chars
    notes,
  };

  const order = await razorpay.orders.create(options);
  return order;
};

/**
 * Verify Razorpay payment signature
 * Razorpay signs: HMAC-SHA256( razorpay_order_id + "|" + razorpay_payment_id )
 * using the key_secret.
 *
 * @param {{ orderId: string, paymentId: string, signature: string }} params
 * @returns {boolean} true if signature matches
 */
export const verifyPaymentSignature = ({ orderId, paymentId, signature }) => {
  try {
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(body)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(signature, 'hex')
    );
  } catch {
    return false;
  }
};

export default razorpay;
