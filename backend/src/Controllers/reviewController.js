import Review from '../models/Review.js';
import Order from '../models/Order.js';
import Booking from '../models/Booking.js';
import Restaurant from '../models/Restaurant.js';
import Notification from '../models/Notification.js';
import { emitToUser } from '../socket.js';

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Recalculate restaurant average rating from all reviews
 */
const recalcAvgRating = async (restaurantId) => {
  const result = await Review.aggregate([
    { $match: { restaurantId } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  if (result.length > 0) {
    await Restaurant.findByIdAndUpdate(restaurantId, {
      avgRating: Math.round(result[0].avgRating * 10) / 10,
      totalRatings: result[0].count,
    });
  } else {
    await Restaurant.findByIdAndUpdate(restaurantId, { avgRating: 0, totalRatings: 0 });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/reviews — Create a review
// ══════════════════════════════════════════════════════════════════════════════
export const createReview = asyncHandler(async (req, res) => {
  const { orderId, bookingId, restaurantId, rating, comment, images } = req.body;

  if (!restaurantId || !rating || !comment) {
    return res.status(400).json({ success: false, message: 'restaurantId, rating, and comment are required' });
  }

  if (!orderId && !bookingId) {
    return res.status(400).json({ success: false, message: 'Either orderId or bookingId is required' });
  }

  // Verify ownership and completion status
  if (orderId) {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not your order' });
    }
    if (order.status !== 'delivered') {
      return res.status(400).json({ success: false, message: 'Can only review delivered orders' });
    }
  }

  if (bookingId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not your booking' });
    }
    if (booking.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Can only review completed bookings' });
    }
  }

  // Check for duplicate review
  const existingFilter = { customerId: req.user._id, restaurantId };
  if (orderId) existingFilter.orderId = orderId;
  if (bookingId) existingFilter.bookingId = bookingId;
  const existing = await Review.findOne(existingFilter);
  if (existing) {
    return res.status(409).json({ success: false, message: 'You have already reviewed this order/booking' });
  }

  const review = await Review.create({
    orderId: orderId || null,
    bookingId: bookingId || null,
    customerId: req.user._id,
    restaurantId,
    rating,
    comment,
    images: images || [],
  });

  // Update restaurant average rating
  const restaurant = await Restaurant.findById(restaurantId);
  await recalcAvgRating(restaurant._id);

  // Notify restaurant owner
  if (restaurant) {
    await Notification.create({
      userId: restaurant.ownerId,
      type: 'new_review',
      title: 'New Review!',
      body: `${req.user.name} gave you ${rating} stars: "${comment.substring(0, 60)}..."`,
      data: { reviewId: review._id.toString(), restaurantId: restaurantId.toString() },
    });

    emitToUser(restaurant.ownerId.toString(), 'review:new', {
      reviewId: review._id, rating, customerName: req.user.name,
    });
  }

  res.status(201).json({ success: true, data: review });
});

// ══════════════════════════════════════════════════════════════════════════════
// PUT /api/reviews/:id/reply — Owner replies to a review
// ══════════════════════════════════════════════════════════════════════════════
export const replyToReview = asyncHandler(async (req, res) => {
  const { reply } = req.body;
  if (!reply) {
    return res.status(400).json({ success: false, message: 'Reply text is required' });
  }

  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

  // Verify the restaurant belongs to this owner
  const restaurant = await Restaurant.findById(review.restaurantId);
  if (!restaurant || restaurant.ownerId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not your restaurant' });
  }

  review.reply = reply;
  await review.save();

  // Notify customer
  await Notification.create({
    userId: review.customerId,
    type: 'review_reply',
    title: 'Owner replied to your review',
    body: `${restaurant.name}: "${reply.substring(0, 60)}..."`,
    data: { reviewId: review._id.toString() },
  });

  emitToUser(review.customerId.toString(), 'review:reply', {
    reviewId: review._id, reply,
  });

  res.json({ success: true, data: review });
});

// ══════════════════════════════════════════════════════════════════════════════
// DELETE /api/reviews/:id — Customer deletes own review
// ══════════════════════════════════════════════════════════════════════════════
export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

  if (review.customerId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not your review' });
  }

  const restaurantId = review.restaurantId;
  await review.deleteOne();

  // Recalculate restaurant rating
  await recalcAvgRating(restaurantId);

  res.json({ success: true, message: 'Review deleted' });
});
