import Booking from '../models/Booking.js';
import Table from '../models/Table.js';
import Restaurant from '../models/Restaurant.js';
import Menu from '../models/Menu.js';
import Notification from '../models/Notification.js';
import { createRazorpayOrder } from '../utils/razorpay.js';
import { sendBookingConfirmation } from '../utils/email.js';
import { emitToRoom, emitToUser } from '../socket.js';

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// @desc   Create a booking
// @route  POST /api/bookings
// @access Private/Customer
export const createBooking = asyncHandler(async (req, res) => {
  const {
    restaurantId,
    tableId,
    date,
    timeSlot,
    partySize,
    specialRequests,
    preOrderItems,
  } = req.body;

  if (!restaurantId || !tableId || !date || !timeSlot?.start || !timeSlot?.end || !partySize) {
    const err = new Error('restaurantId, tableId, date, timeSlot (start+end), and partySize are required');
    err.statusCode = 400;
    throw err;
  }

  // Validate restaurant exists
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant || !restaurant.isActive) {
    const err = new Error('Restaurant not found or inactive');
    err.statusCode = 404;
    throw err;
  }

  // Validate table belongs to this restaurant and is not under maintenance
  const table = await Table.findOne({ _id: tableId, restaurantId });
  if (!table) {
    const err = new Error('Table not found in this restaurant');
    err.statusCode = 404;
    throw err;
  }

  if (table.status === 'maintenance') {
    const err = new Error('This table is under maintenance');
    err.statusCode = 409;
    throw err;
  }

  if (parseInt(partySize) > table.capacity) {
    const err = new Error(`Party size ${partySize} exceeds table capacity ${table.capacity}`);
    err.statusCode = 409;
    throw err;
  }

  // Check for conflicting bookings
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const conflict = await Booking.findOne({
    tableId,
    date: { $gte: targetDate, $lt: nextDay },
    status: { $in: ['pending', 'confirmed', 'seated'] },
    $or: [
      {
        'timeSlot.start': { $lt: timeSlot.end },
        'timeSlot.end': { $gt: timeSlot.start },
      },
    ],
  });

  if (conflict) {
    const err = new Error('This table is already booked for the selected time slot');
    err.statusCode = 409;
    throw err;
  }

  // Calculate pre-order total from Menu prices
  let preOrderTotal = 0;
  let resolvedPreOrder = [];

  if (preOrderItems && preOrderItems.length > 0) {
    const menuIds = preOrderItems.map((p) => p.menuItemId);
    const menuItems = await Menu.find({ _id: { $in: menuIds }, restaurantId, isAvailable: true });

    const menuMap = {};
    menuItems.forEach((m) => (menuMap[m._id.toString()] = m));

    for (const p of preOrderItems) {
      const menuItem = menuMap[p.menuItemId.toString()];
      if (!menuItem) {
        const err = new Error(`Menu item ${p.menuItemId} not found or unavailable`);
        err.statusCode = 400;
        throw err;
      }
      preOrderTotal += menuItem.price * p.quantity;
      resolvedPreOrder.push({
        menuItemId: p.menuItemId,
        quantity: p.quantity,
        specialNote: p.specialNote || '',
      });
    }
  }

  // Create the booking
  const booking = await Booking.create({
    customerId: req.user._id,
    restaurantId,
    tableId,
    date: targetDate,
    timeSlot,
    partySize: parseInt(partySize),
    specialRequests,
    preOrderItems: resolvedPreOrder,
    preOrderTotal,
    status: 'pending',
    paymentStatus: preOrderTotal > 0 ? 'pending' : 'none',
  });

  // Update table status to reserved
  table.status = 'reserved';
  table.currentBookingId = booking._id;
  await table.save();

  // Create Razorpay order if pre-order total > 0
  let razorpayOrder = null;
  if (preOrderTotal > 0) {
    razorpayOrder = await createRazorpayOrder({
      amount: Math.round(preOrderTotal * 100), // convert to paise
      receipt: booking._id.toString(),
      notes: { bookingId: booking._id.toString(), type: 'booking' },
    });
  }

  // Notify restaurant owner via socket
  emitToRoom(
    `restaurant:${restaurantId}`,
    'booking:new',
    { bookingId: booking._id, tableId, date, timeSlot, partySize }
  );

  // Save notification for owner
  await Notification.create({
    userId: restaurant.ownerId,
    type: 'booking_new',
    title: 'New Booking Request',
    body: `${req.user.name} booked table ${table.tableNumber} on ${new Date(date).toDateString()} at ${timeSlot.start}`,
    data: { bookingId: booking._id.toString() },
  });

  // Send email confirmation
  sendBookingConfirmation(req.user, booking, restaurant).catch(() => {});

  res.status(201).json({
    success: true,
    data: {
      booking,
      razorpayOrder: razorpayOrder
        ? {
            id: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            key: process.env.RAZORPAY_KEY_ID,
          }
        : null,
    },
  });
});

// @desc   Get current user's bookings
// @route  GET /api/bookings/user
// @access Private/Customer
export const getUserBookings = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const query = { customerId: req.user._id };
  if (status) query.status = status;

  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .populate('restaurantId', 'name address images coverImage')
      .populate('tableId', 'tableNumber capacity')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Booking.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: bookings,
    pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
  });
});

// @desc   Get bookings for owner's restaurant
// @route  GET /api/bookings/restaurant/:id
// @access Private/Owner
export const getRestaurantBookings = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, date, status } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Verify ownership
  const restaurant = await Restaurant.findOne({ _id: req.params.id, ownerId: req.user._id });
  if (!restaurant) {
    const err = new Error('Restaurant not found or you do not own it');
    err.statusCode = 404;
    throw err;
  }

  const query = { restaurantId: req.params.id };
  if (status) query.status = status;
  if (date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const nextDay = new Date(d);
    nextDay.setDate(nextDay.getDate() + 1);
    query.date = { $gte: d, $lt: nextDay };
  }

  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .populate('customerId', 'name email phone avatar')
      .populate('tableId', 'tableNumber capacity position')
      .sort({ date: 1, 'timeSlot.start': 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Booking.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: bookings,
    pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
  });
});

// @desc   Customer updates pre-order items before booking time
// @route  PUT /api/bookings/:id/preorder
// @access Private/Customer
export const updatePreOrder = asyncHandler(async (req, res) => {
  const { preOrderItems } = req.body;

  const booking = await Booking.findOne({ _id: req.params.id, customerId: req.user._id });
  if (!booking) {
    const err = new Error('Booking not found or does not belong to you');
    err.statusCode = 404;
    throw err;
  }

  if (!['pending', 'confirmed'].includes(booking.status)) {
    const err = new Error('Cannot modify pre-order for a booking that is seated, completed, or cancelled');
    err.statusCode = 409;
    throw err;
  }

  // Recalculate total
  let preOrderTotal = 0;
  let resolvedPreOrder = [];

  if (preOrderItems && preOrderItems.length > 0) {
    const menuIds = preOrderItems.map((p) => p.menuItemId);
    const menuItems = await Menu.find({
      _id: { $in: menuIds },
      restaurantId: booking.restaurantId,
      isAvailable: true,
    });

    const menuMap = {};
    menuItems.forEach((m) => (menuMap[m._id.toString()] = m));

    for (const p of preOrderItems) {
      const menuItem = menuMap[p.menuItemId.toString()];
      if (!menuItem) {
        const err = new Error(`Menu item ${p.menuItemId} not found or unavailable`);
        err.statusCode = 400;
        throw err;
      }
      preOrderTotal += menuItem.price * p.quantity;
      resolvedPreOrder.push({ menuItemId: p.menuItemId, quantity: p.quantity, specialNote: p.specialNote || '' });
    }
  }

  booking.preOrderItems = resolvedPreOrder;
  booking.preOrderTotal = preOrderTotal;
  await booking.save();

  res.status(200).json({ success: true, data: booking });
});

// @desc   Owner confirms a booking
// @route  PATCH /api/bookings/:id/confirm
// @access Private/Owner
export const confirmBooking = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findOne({ ownerId: req.user._id });
  if (!restaurant) {
    const err = new Error('No restaurant for this owner');
    err.statusCode = 404;
    throw err;
  }

  const booking = await Booking.findOne({ _id: req.params.id, restaurantId: restaurant._id });
  if (!booking) {
    const err = new Error('Booking not found in your restaurant');
    err.statusCode = 404;
    throw err;
  }

  if (booking.status !== 'pending') {
    const err = new Error(`Cannot confirm a booking with status '${booking.status}'`);
    err.statusCode = 409;
    throw err;
  }

  booking.status = 'confirmed';
  await booking.save();

  emitToUser(booking.customerId.toString(), 'booking:confirmed', {
    bookingId: booking._id,
    restaurantName: restaurant.name,
  });

  await Notification.create({
    userId: booking.customerId,
    type: 'booking_confirmed',
    title: 'Booking Confirmed!',
    body: `Your booking at ${restaurant.name} has been confirmed.`,
    data: { bookingId: booking._id.toString() },
  });

  res.status(200).json({ success: true, data: booking });
});

// @desc   Owner marks customer as seated
// @route  PATCH /api/bookings/:id/seat
// @access Private/Owner
export const seatCustomer = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findOne({ ownerId: req.user._id });
  if (!restaurant) {
    const err = new Error('No restaurant for this owner');
    err.statusCode = 404;
    throw err;
  }

  const booking = await Booking.findOne({ _id: req.params.id, restaurantId: restaurant._id });
  if (!booking) {
    const err = new Error('Booking not found in your restaurant');
    err.statusCode = 404;
    throw err;
  }

  if (booking.status !== 'confirmed') {
    const err = new Error(`Cannot seat a booking with status '${booking.status}'`);
    err.statusCode = 409;
    throw err;
  }

  booking.status = 'seated';
  await booking.save();

  // Update table to occupied
  await Table.findByIdAndUpdate(booking.tableId, { status: 'occupied' });

  emitToRoom(`restaurant:${restaurant._id}`, 'table:status_changed', {
    tableId: booking.tableId,
    status: 'occupied',
  });

  res.status(200).json({ success: true, data: booking });
});

// @desc   Owner marks booking as complete
// @route  PATCH /api/bookings/:id/complete
// @access Private/Owner
export const completeBooking = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findOne({ ownerId: req.user._id });
  if (!restaurant) {
    const err = new Error('No restaurant for this owner');
    err.statusCode = 404;
    throw err;
  }

  const booking = await Booking.findOne({ _id: req.params.id, restaurantId: restaurant._id });
  if (!booking) {
    const err = new Error('Booking not found in your restaurant');
    err.statusCode = 404;
    throw err;
  }

  if (booking.status !== 'seated') {
    const err = new Error(`Cannot complete a booking with status '${booking.status}'`);
    err.statusCode = 409;
    throw err;
  }

  booking.status = 'completed';
  await booking.save();

  // Free the table
  await Table.findByIdAndUpdate(booking.tableId, { status: 'available', currentBookingId: null });

  emitToRoom(`restaurant:${restaurant._id}`, 'table:status_changed', {
    tableId: booking.tableId,
    status: 'available',
  });

  // Prompt customer to leave a review
  await Notification.create({
    userId: booking.customerId,
    type: 'review_prompt',
    title: 'How was your experience?',
    body: `Enjoyed your visit to ${restaurant.name}? Leave a review!`,
    data: { bookingId: booking._id.toString(), restaurantId: restaurant._id.toString() },
  });

  res.status(200).json({ success: true, data: booking });
});

// @desc   Cancel a booking (customer or owner)
// @route  PATCH /api/bookings/:id/cancel
// @access Private
export const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    const err = new Error('Booking not found');
    err.statusCode = 404;
    throw err;
  }

  const isCustomer = booking.customerId.toString() === req.user._id.toString();
  const isOwner = req.user.role === 'owner';

  if (!isCustomer && !isOwner) {
    const err = new Error('You are not authorized to cancel this booking');
    err.statusCode = 403;
    throw err;
  }

  if (['completed', 'cancelled'].includes(booking.status)) {
    const err = new Error(`Booking is already ${booking.status}`);
    err.statusCode = 409;
    throw err;
  }

  booking.status = 'cancelled';
  // Refund logic placeholder — in production, trigger Razorpay refund if paymentStatus === 'paid'
  if (booking.paymentStatus === 'paid') {
    booking.paymentStatus = 'refunded';
    // TODO: razorpay.payments.refund(booking.paymentId, { amount: booking.preOrderTotal * 100 })
  }
  await booking.save();

  // Free the table
  const table = await Table.findById(booking.tableId);
  if (table && table.currentBookingId?.toString() === booking._id.toString()) {
    table.status = 'available';
    table.currentBookingId = null;
    await table.save();
  }

  // Notify the other party
  const notifyUserId = isCustomer ? null : booking.customerId; // owner cancelled → notify customer
  if (notifyUserId) {
    emitToUser(notifyUserId.toString(), 'booking:cancelled', { bookingId: booking._id });
    await Notification.create({
      userId: notifyUserId,
      type: 'booking_cancelled',
      title: 'Booking Cancelled',
      body: 'Your booking has been cancelled by the restaurant.',
      data: { bookingId: booking._id.toString() },
    });
  }

  res.status(200).json({ success: true, data: booking });
});
