import Order from '../models/Order.js';
import Booking from '../models/Booking.js';
import { createRazorpayOrder, verifyPaymentSignature } from '../utils/razorpay.js';
import { emitToUser } from '../socket.js';
import Notification from '../models/Notification.js';

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/payments/create-order — Create Razorpay order
// ══════════════════════════════════════════════════════════════════════════════
export const createPaymentOrder = asyncHandler(async (req, res) => {
  const { amount, type, referenceId } = req.body;
  // type: 'order' or 'booking'
  // referenceId: the Order or Booking _id

  if (!amount || !type || !referenceId) {
    return res.status(400).json({ success: false, message: 'amount, type, and referenceId are required' });
  }

  if (!['order', 'booking'].includes(type)) {
    return res.status(400).json({ success: false, message: 'type must be "order" or "booking"' });
  }

  // Verify the reference exists and belongs to the user
  let doc;
  if (type === 'order') {
    doc = await Order.findById(referenceId);
    if (!doc) return res.status(404).json({ success: false, message: 'Order not found' });
    if (doc.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not your order' });
    }
  } else {
    doc = await Booking.findById(referenceId);
    if (!doc) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (doc.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not your booking' });
    }
  }

  const razorpayOrder = await createRazorpayOrder({
    amount: Math.round(amount * 100), // convert to paise
    receipt: `${type}_${referenceId}`,
    notes: {
      type,
      referenceId: referenceId.toString(),
      customerId: req.user._id.toString(),
    },
  });

  res.status(201).json({
    success: true,
    data: {
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/payments/verify — Verify Razorpay payment signature
// ══════════════════════════════════════════════════════════════════════════════
export const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, type, referenceId } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ success: false, message: 'Razorpay order ID, payment ID, and signature are required' });
  }

  const isValid = verifyPaymentSignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });

  if (!isValid) {
    return res.status(400).json({ success: false, message: 'Payment verification failed — invalid signature' });
  }

  // Update the associated document
  if (type === 'order' && referenceId) {
    await Order.findByIdAndUpdate(referenceId, {
      paymentStatus: 'paid',
      paymentId: razorpay_payment_id,
    });

    const order = await Order.findById(referenceId);
    if (order) {
      emitToUser(order.customerId.toString(), 'payment:confirmed', {
        orderId: order._id, paymentId: razorpay_payment_id,
      });
    }
  } else if (type === 'booking' && referenceId) {
    await Booking.findByIdAndUpdate(referenceId, {
      paymentStatus: 'paid',
      paymentId: razorpay_payment_id,
    });

    const booking = await Booking.findById(referenceId);
    if (booking) {
      emitToUser(booking.customerId.toString(), 'payment:confirmed', {
        bookingId: booking._id, paymentId: razorpay_payment_id,
      });
    }
  }

  // Create notification
  await Notification.create({
    userId: req.user._id,
    type: 'payment_success',
    title: 'Payment Successful',
    body: `Payment of ₹${req.body.amount || ''} has been confirmed.`,
    data: { paymentId: razorpay_payment_id, type, referenceId },
  });

  res.json({
    success: true,
    message: 'Payment verified successfully',
    data: { paymentId: razorpay_payment_id },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/payments/history — User's payment history
// ══════════════════════════════════════════════════════════════════════════════
export const getPaymentHistory = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  // Get both paid orders and paid bookings
  const [orders, bookings] = await Promise.all([
    Order.find({ customerId: req.user._id, paymentStatus: 'paid' })
      .select('totalAmount paymentId paymentStatus createdAt restaurantId')
      .populate('restaurantId', 'name')
      .sort({ createdAt: -1 })
      .lean(),
    Booking.find({ customerId: req.user._id, paymentStatus: 'paid' })
      .select('preOrderTotal paymentId paymentStatus createdAt restaurantId')
      .populate('restaurantId', 'name')
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  // Merge and sort
  const payments = [
    ...orders.map((o) => ({ ...o, type: 'order', amount: o.totalAmount })),
    ...bookings.map((b) => ({ ...b, type: 'booking', amount: b.preOrderTotal })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const paginated = payments.slice(skip, skip + limit);

  res.json({
    success: true,
    data: {
      payments: paginated,
      pagination: { page, limit, total: payments.length, pages: Math.ceil(payments.length / limit) },
    },
  });
});
