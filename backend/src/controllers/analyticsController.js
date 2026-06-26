import Order from '../models/Order.js';
import Booking from '../models/Booking.js';
import Restaurant from '../models/Restaurant.js';
import mongoose from 'mongoose';

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Helper — Determine owner's restaurant(s).
 * We only support one restaurant per owner for now.
 */
const getOwnerRestaurant = async (userId) => {
  const restaurant = await Restaurant.findOne({ ownerId: userId }).lean();
  if (!restaurant) throw Object.assign(new Error('No restaurant found for this owner'), { statusCode: 404 });
  return restaurant;
};

/**
 * Helper — Build date range filter from period query param
 */
const dateRange = (period = 'month') => {
  const now = new Date();
  const start = new Date(now);

  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start.setDate(now.getDate() - 7);
      break;
    case 'month':
      start.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      start.setFullYear(now.getFullYear() - 1);
      break;
    default:
      start.setMonth(now.getMonth() - 1);
  }

  return { $gte: start, $lte: now };
};

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/analytics/revenue — Daily/weekly/monthly revenue
// ══════════════════════════════════════════════════════════════════════════════
export const getRevenueAnalytics = asyncHandler(async (req, res) => {
  const restaurant = await getOwnerRestaurant(req.user._id);
  const { period = 'month', groupBy = 'day' } = req.query;

  const dateFilter = dateRange(period);

  // Choose date grouping format
  const dateFormats = {
    day:   '%Y-%m-%d',
    week:  '%Y-W%V',
    month: '%Y-%m',
  };
  const dateFormat = dateFormats[groupBy] || dateFormats.day;

  const revenue = await Order.aggregate([
    {
      $match: {
        restaurantId: restaurant._id,
        paymentStatus: 'paid',
        createdAt: dateFilter,
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
        totalRevenue: { $sum: '$totalAmount' },
        orderCount: { $sum: 1 },
        avgOrderValue: { $avg: '$totalAmount' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Also include booking pre-order revenue
  const bookingRevenue = await Booking.aggregate([
    {
      $match: {
        restaurantId: restaurant._id,
        paymentStatus: 'paid',
        createdAt: dateFilter,
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
        totalRevenue: { $sum: '$preOrderTotal' },
        bookingCount: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Summary stats
  const totalOrderRevenue = revenue.reduce((s, r) => s + r.totalRevenue, 0);
  const totalBookingRevenue = bookingRevenue.reduce((s, r) => s + r.totalRevenue, 0);

  res.json({
    success: true,
    data: {
      period,
      groupBy,
      orderRevenue: revenue,
      bookingRevenue,
      summary: {
        totalOrderRevenue: Math.round(totalOrderRevenue * 100) / 100,
        totalBookingRevenue: Math.round(totalBookingRevenue * 100) / 100,
        totalRevenue: Math.round((totalOrderRevenue + totalBookingRevenue) * 100) / 100,
        totalOrders: revenue.reduce((s, r) => s + r.orderCount, 0),
        totalBookings: bookingRevenue.reduce((s, r) => s + r.bookingCount, 0),
      },
    },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/analytics/orders — Order volume by status
// ══════════════════════════════════════════════════════════════════════════════
export const getOrderVolume = asyncHandler(async (req, res) => {
  const restaurant = await getOwnerRestaurant(req.user._id);
  const { period = 'month' } = req.query;
  const dateFilter = dateRange(period);

  // Volume by status
  const byStatus = await Order.aggregate([
    { $match: { restaurantId: restaurant._id, createdAt: dateFilter } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  // Volume by day
  const byDay = await Order.aggregate([
    { $match: { restaurantId: restaurant._id, createdAt: dateFilter } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
        revenue: { $sum: '$totalAmount' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Volume by hour of day
  const byHour = await Order.aggregate([
    { $match: { restaurantId: restaurant._id, createdAt: dateFilter } },
    { $group: { _id: { $hour: '$createdAt' }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  res.json({
    success: true,
    data: { period, byStatus, byDay, byHour },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/analytics/popular-items — Best-selling menu items
// ══════════════════════════════════════════════════════════════════════════════
export const getPopularItems = asyncHandler(async (req, res) => {
  const restaurant = await getOwnerRestaurant(req.user._id);
  const { period = 'month' } = req.query;
  const dateFilter = dateRange(period);
  const limit = parseInt(req.query.limit) || 10;

  const popular = await Order.aggregate([
    {
      $match: {
        restaurantId: restaurant._id,
        status: { $in: ['delivered', 'completed'] },
        createdAt: dateFilter,
      },
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.menuItemId',
        name: { $first: '$items.name' },
        totalQuantity: { $sum: '$items.quantity' },
        totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: limit },
  ]);

  res.json({ success: true, data: { period, popularItems: popular } });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/analytics/bookings — Booking fill rate & stats
// ══════════════════════════════════════════════════════════════════════════════
export const getBookingAnalytics = asyncHandler(async (req, res) => {
  const restaurant = await getOwnerRestaurant(req.user._id);
  const { period = 'month' } = req.query;
  const dateFilter = dateRange(period);

  // Count by status
  const byStatus = await Booking.aggregate([
    { $match: { restaurantId: restaurant._id, createdAt: dateFilter } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  // Bookings by day
  const byDay = await Booking.aggregate([
    { $match: { restaurantId: restaurant._id, createdAt: dateFilter } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
        preOrderRevenue: { $sum: '$preOrderTotal' },
        avgPartySize: { $avg: '$partySize' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Summary
  const totalBookings = byStatus.reduce((s, b) => s + b.count, 0);
  const completedBookings = byStatus.find((b) => b._id === 'completed')?.count || 0;
  const cancelledBookings = byStatus.find((b) => b._id === 'cancelled')?.count || 0;

  res.json({
    success: true,
    data: {
      period,
      byStatus,
      byDay,
      summary: {
        totalBookings,
        completedBookings,
        cancelledBookings,
        completionRate: totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0,
        cancellationRate: totalBookings > 0 ? Math.round((cancelledBookings / totalBookings) * 100) : 0,
      },
    },
  });
});
