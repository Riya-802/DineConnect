import Order from '../models/Order.js';
import Menu from '../models/Menu.js';
import Restaurant from '../models/Restaurant.js';
import Notification from '../models/Notification.js';
import { createRazorpayOrder } from '../utils/razorpay.js';
import { emitToUser, emitToRoom } from '../socket.js';

// ── Async handler wrapper ────────────────────────────────────────────────────
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Generate a random 4-digit OTP
 */
const generateOTP = () => String(Math.floor(1000 + Math.random() * 9000));

/**
 * Haversine distance between two lat/lng pairs (km)
 */
const haversine = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ── Valid status transitions ─────────────────────────────────────────────────
const STATUS_FLOW = {
  placed:    ['accepted', 'cancelled'],
  accepted:  ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready:     ['picked'],
  picked:    ['delivered'],
};

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/orders — Place delivery order
// ══════════════════════════════════════════════════════════════════════════════
export const placeOrder = asyncHandler(async (req, res) => {
  const { restaurantId, items, deliveryAddress, paymentMethod = 'razorpay' } = req.body;

  if (!restaurantId || !items?.length || !deliveryAddress) {
    return res.status(400).json({ success: false, message: 'restaurantId, items[], and deliveryAddress are required' });
  }

  // Validate restaurant
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant || !restaurant.isActive) {
    return res.status(404).json({ success: false, message: 'Restaurant not found or currently closed' });
  }

  // Check delivery radius
  const distance = haversine(
    restaurant.address.lat, restaurant.address.lng,
    deliveryAddress.lat, deliveryAddress.lng
  );
  if (distance > restaurant.deliveryRadius) {
    return res.status(400).json({
      success: false,
      message: `Delivery address is ${distance.toFixed(1)}km away, exceeds ${restaurant.deliveryRadius}km radius`,
    });
  }

  // Validate & price each item
  const menuItemIds = items.map((i) => i.menuItemId);
  const menuItems = await Menu.find({ _id: { $in: menuItemIds }, restaurantId, isAvailable: true });
  if (menuItems.length !== items.length) {
    return res.status(400).json({ success: false, message: 'One or more items are unavailable' });
  }

  const menuMap = Object.fromEntries(menuItems.map((m) => [m._id.toString(), m]));
  const orderItems = items.map((i) => {
    const menu = menuMap[i.menuItemId];
    return { menuItemId: menu._id, name: menu.name, price: menu.price, quantity: i.quantity };
  });

  const subtotal = orderItems.reduce((s, i) => s + i.price * i.quantity, 0);

  // Check min order
  if (subtotal < restaurant.minOrderAmount) {
    return res.status(400).json({
      success: false,
      message: `Minimum order amount is ₹${restaurant.minOrderAmount}`,
    });
  }

  const deliveryFee = distance <= 3 ? 30 : Math.round(30 + (distance - 3) * 10);
  const taxes = Math.round(subtotal * 0.05 * 100) / 100; // 5% GST
  const totalAmount = Math.round((subtotal + deliveryFee + taxes) * 100) / 100;

  const otp = generateOTP();

  const order = new Order({
    customerId: req.user._id,
    restaurantId,
    items: orderItems,
    subtotal,
    deliveryFee,
    taxes,
    totalAmount,
    deliveryAddress,
    paymentMethod,
    otp,
    estimatedDelivery: new Date(Date.now() + (restaurant.estimatedDeliveryTime || 40) * 60 * 1000),
  });

  await order.save();

  // Create Razorpay payment order if not COD
  let razorpayOrder = null;
  if (paymentMethod === 'razorpay') {
    try {
      razorpayOrder = await createRazorpayOrder({
        amount: Math.round(totalAmount * 100), // paise
        receipt: `order_${order._id}`,
        notes: { orderId: order._id.toString(), customerId: req.user._id.toString() },
      });
    } catch (err) {
      console.error('[Order] Razorpay order creation failed:', err.message);
      // Don't fail the order — let them retry payment
    }
  }

  // Notify restaurant owner
  const ownerNotif = new Notification({
    userId: restaurant.ownerId,
    type: 'new_order',
    title: 'New Order Received!',
    body: `${req.user.name} placed an order worth ₹${totalAmount}`,
    data: { orderId: order._id.toString() },
  });
  await ownerNotif.save();

  // Socket: real-time notification to restaurant
  emitToUser(restaurant.ownerId.toString(), 'order:new', {
    orderId: order._id,
    customerName: req.user.name,
    totalAmount,
    items: orderItems.length,
  });

  res.status(201).json({
    success: true,
    data: {
      order,
      otp, // show OTP to customer
      razorpayOrder, // for frontend Razorpay checkout
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/orders/user — Customer order history
// ══════════════════════════════════════════════════════════════════════════════
export const getUserOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = { customerId: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('restaurantId', 'name coverImage address')
      .populate('deliveryPartnerId', 'name phone avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/orders/restaurant/:id — Owner's order dashboard
// ══════════════════════════════════════════════════════════════════════════════
export const getRestaurantOrders = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) {
    return res.status(404).json({ success: false, message: 'Restaurant not found' });
  }
  if (restaurant.ownerId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not your restaurant' });
  }

  const { status, date } = req.query;
  const filter = { restaurantId: req.params.id };
  if (status) filter.status = status;
  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    filter.createdAt = { $gte: start, $lte: end };
  }

  const orders = await Order.find(filter)
    .populate('customerId', 'name phone avatar')
    .populate('deliveryPartnerId', 'name phone avatar')
    .sort({ createdAt: -1 })
    .lean();

  res.json({ success: true, data: orders });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/orders/delivery — Available orders for delivery partner
// ══════════════════════════════════════════════════════════════════════════════
export const getDeliveryOrders = asyncHandler(async (req, res) => {
  const { lat, lng } = req.query;

  // Find orders that are ready for pickup and unassigned
  const orders = await Order.find({
    status: 'ready',
    deliveryPartnerId: null,
  })
    .populate('restaurantId', 'name address coverImage')
    .populate('customerId', 'name phone')
    .sort({ createdAt: 1 })
    .lean();

  // If delivery partner provided location, sort by distance to restaurant
  if (lat && lng) {
    orders.forEach((order) => {
      if (order.restaurantId?.address) {
        order._distance = haversine(
          parseFloat(lat), parseFloat(lng),
          order.restaurantId.address.lat, order.restaurantId.address.lng
        );
      }
    });
    orders.sort((a, b) => (a._distance || 999) - (b._distance || 999));
  }

  res.json({ success: true, data: orders });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/orders/:id — Order detail
// ══════════════════════════════════════════════════════════════════════════════
export const getOrderDetail = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('customerId', 'name phone avatar email')
    .populate('restaurantId', 'name coverImage address phone')
    .populate('deliveryPartnerId', 'name phone avatar')
    .populate('items.menuItemId', 'name images')
    .lean();

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  // Only allow involved parties to see the order
  const userId = req.user._id.toString();
  const isCustomer = order.customerId?._id?.toString() === userId;
  const isOwner = order.restaurantId && (await Restaurant.findById(order.restaurantId._id))?.ownerId?.toString() === userId;
  const isDelivery = order.deliveryPartnerId?._id?.toString() === userId;

  if (!isCustomer && !isOwner && !isDelivery) {
    return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
  }

  // Hide OTP from delivery partner until order is picked up
  if (isDelivery && order.status !== 'picked') {
    order.otp = undefined;
  }
  // Show OTP to customer always (they share it with delivery partner)
  if (isOwner) {
    order.otp = undefined;
  }

  res.json({ success: true, data: order });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/orders/:id/track — Live tracking location
// ══════════════════════════════════════════════════════════════════════════════
export const trackOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .select('status deliveryPartnerId restaurantId deliveryAddress estimatedDelivery')
    .populate('deliveryPartnerId', 'name phone avatar')
    .populate('restaurantId', 'name address')
    .lean();

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  // Return order tracking info; live location comes via Socket.io
  res.json({
    success: true,
    data: {
      status: order.status,
      deliveryPartner: order.deliveryPartnerId,
      restaurant: { name: order.restaurantId?.name, address: order.restaurantId?.address },
      deliveryAddress: order.deliveryAddress,
      estimatedDelivery: order.estimatedDelivery,
    },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// PATCH /api/orders/:id/accept — Owner accepts order
// ══════════════════════════════════════════════════════════════════════════════
export const acceptOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  if (order.status !== 'placed') {
    return res.status(400).json({ success: false, message: `Cannot accept order with status '${order.status}'` });
  }

  // Verify owner
  const restaurant = await Restaurant.findById(order.restaurantId);
  if (!restaurant || restaurant.ownerId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not your restaurant' });
  }

  order.status = 'accepted';
  order.timeline.push({ status: 'accepted', timestamp: new Date() });
  await order.save();

  // Notify customer
  emitToUser(order.customerId.toString(), 'order:status_update', {
    orderId: order._id, status: 'accepted', timestamp: new Date(),
  });

  await Notification.create({
    userId: order.customerId,
    type: 'order_status',
    title: 'Order Accepted!',
    body: `${restaurant.name} has accepted your order and started preparing it.`,
    data: { orderId: order._id.toString() },
  });

  res.json({ success: true, data: order });
});

// ══════════════════════════════════════════════════════════════════════════════
// PATCH /api/orders/:id/status — Update order status
// ══════════════════════════════════════════════════════════════════════════════
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status: newStatus } = req.body;
  if (!newStatus) {
    return res.status(400).json({ success: false, message: 'status is required' });
  }

  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  // Validate transition
  const allowed = STATUS_FLOW[order.status];
  if (!allowed || !allowed.includes(newStatus)) {
    return res.status(400).json({
      success: false,
      message: `Invalid transition: ${order.status} → ${newStatus}. Allowed: ${allowed?.join(', ') || 'none'}`,
    });
  }

  order.status = newStatus;
  order.timeline.push({ status: newStatus, timestamp: new Date() });

  if (newStatus === 'delivered') {
    order.actualDelivery = new Date();
  }

  await order.save();

  // Emit to customer
  emitToUser(order.customerId.toString(), 'order:status_update', {
    orderId: order._id, status: newStatus, timestamp: new Date(),
  });

  // Emit to order room (for tracking page subscribers)
  emitToRoom(`order:${order._id}`, 'order:status_update', {
    orderId: order._id, status: newStatus, timestamp: new Date(),
  });

  // If ready, notify delivery partners
  if (newStatus === 'ready') {
    emitToRoom('delivery:available', 'kitchen:order_ready', { orderId: order._id });
  }

  // Status-specific notifications
  const statusMessages = {
    preparing: 'Your order is being prepared!',
    ready: 'Your order is ready for pickup!',
    picked: 'Your order is on the way!',
    delivered: 'Your order has been delivered!',
    cancelled: 'Your order has been cancelled.',
  };
  if (statusMessages[newStatus]) {
    await Notification.create({
      userId: order.customerId,
      type: 'order_status',
      title: statusMessages[newStatus],
      body: statusMessages[newStatus],
      data: { orderId: order._id.toString(), status: newStatus },
    });
  }

  res.json({ success: true, data: order });
});

// ══════════════════════════════════════════════════════════════════════════════
// PATCH /api/orders/:id/assign — Assign delivery partner
// ══════════════════════════════════════════════════════════════════════════════
export const assignDeliveryPartner = asyncHandler(async (req, res) => {
  const { deliveryPartnerId } = req.body;
  if (!deliveryPartnerId) {
    return res.status(400).json({ success: false, message: 'deliveryPartnerId is required' });
  }

  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  if (!['ready', 'accepted', 'preparing'].includes(order.status)) {
    return res.status(400).json({ success: false, message: 'Order is not ready for delivery assignment' });
  }

  order.deliveryPartnerId = deliveryPartnerId;
  await order.save();

  // Notify delivery partner
  emitToUser(deliveryPartnerId, 'order:assigned', {
    orderId: order._id,
    restaurant: await Restaurant.findById(order.restaurantId).select('name address').lean(),
    deliveryAddress: order.deliveryAddress,
  });

  await Notification.create({
    userId: deliveryPartnerId,
    type: 'delivery_assigned',
    title: 'New Delivery Assignment',
    body: 'You have a new delivery to pick up!',
    data: { orderId: order._id.toString() },
  });

  res.json({ success: true, data: order });
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/orders/:id/verify-otp — Delivery partner confirms delivery with OTP
// ══════════════════════════════════════════════════════════════════════════════
export const verifyDeliveryOTP = asyncHandler(async (req, res) => {
  const { otp } = req.body;
  if (!otp) {
    return res.status(400).json({ success: false, message: 'OTP is required' });
  }

  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  if (order.deliveryPartnerId?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not your delivery' });
  }

  if (order.status !== 'picked') {
    return res.status(400).json({ success: false, message: 'Order must be in "picked" status to verify OTP' });
  }

  if (order.otp !== otp.toString()) {
    return res.status(400).json({ success: false, message: 'Invalid OTP' });
  }

  // OTP matches — mark delivered
  order.status = 'delivered';
  order.actualDelivery = new Date();
  order.timeline.push({ status: 'delivered', timestamp: new Date() });
  await order.save();

  // Notify customer
  emitToUser(order.customerId.toString(), 'order:status_update', {
    orderId: order._id, status: 'delivered', timestamp: new Date(),
  });

  await Notification.create({
    userId: order.customerId,
    type: 'order_status',
    title: 'Order Delivered!',
    body: 'Your order has been delivered successfully. Enjoy your meal!',
    data: { orderId: order._id.toString() },
  });

  res.json({ success: true, message: 'Delivery confirmed successfully', data: order });
});
