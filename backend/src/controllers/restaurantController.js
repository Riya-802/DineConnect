import Restaurant from '../models/Restaurant.js';
import Menu from '../models/Menu.js';
import Table from '../models/Table.js';
import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import { uploadToCloudinary } from '../middleware/uploadMiddleware.js';

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// ── Haversine distance in km ──────────────────────────────────────────────────
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

// @desc   List restaurants (with geo + filters)
// @route  GET /api/restaurants
// @access Public
export const listRestaurants = asyncHandler(async (req, res) => {
  const {
    lat,
    lng,
    cuisine,
    search,
    sort = 'rating',
    page = 1,
    limit = 10,
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const query = { isActive: true };

  if (cuisine) {
    query.cuisineTypes = { $in: [cuisine] };
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { cuisineTypes: { $regex: search, $options: 'i' } },
    ];
  }

  let restaurants = await Restaurant.find(query)
    .select('-__v')
    .lean()
    .skip(skip)
    .limit(parseInt(limit));

  // Compute distance and attach if user coords provided
  if (lat && lng) {
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    restaurants = restaurants.map((r) => ({
      ...r,
      distance: haversine(userLat, userLng, r.address.lat, r.address.lng),
    }));
  }

  // Sort
  if (sort === 'distance' && lat && lng) {
    restaurants.sort((a, b) => a.distance - b.distance);
  } else if (sort === 'rating') {
    restaurants.sort((a, b) => b.avgRating - a.avgRating);
  }

  const total = await Restaurant.countDocuments(query);

  res.status(200).json({
    success: true,
    data: restaurants,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// @desc   Get a single restaurant (with owner, menu summary, table count)
// @route  GET /api/restaurants/:id
// @access Public
export const getRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id)
    .populate('ownerId', 'name email phone')
    .lean();

  if (!restaurant) {
    const err = new Error('Restaurant not found');
    err.statusCode = 404;
    throw err;
  }

  // Aggregate table counts by status
  const tableCounts = await Table.aggregate([
    { $match: { restaurantId: restaurant._id } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const tableStats = tableCounts.reduce((acc, t) => {
    acc[t._id] = t.count;
    return acc;
  }, {});

  // Menu items grouped by category
  const menus = await Menu.find({
    restaurantId: restaurant._id,
    isAvailable: true,
  })
    .select('-__v')
    .lean();

  res.status(200).json({
    success: true,
    data: { ...restaurant, tableStats, menu: menus },
  });
});

// @desc   Get restaurant menu (grouped by category)
// @route  GET /api/restaurants/:id/menu
// @access Public
export const getRestaurantMenu = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id).lean();
  if (!restaurant) {
    const err = new Error('Restaurant not found');
    err.statusCode = 404;
    throw err;
  }

  const menus = await Menu.find({
    restaurantId: req.params.id,
    isAvailable: true,
  })
    .select('-__v')
    .lean();

  res.status(200).json({ success: true, data: menus });
});

// @desc   Get tables for a restaurant (exclude booked for given date+timeSlot)
// @route  GET /api/restaurants/:id/tables
// @access Public
export const getRestaurantTables = asyncHandler(async (req, res) => {
  const { date, slotStart, slotEnd } = req.query;

  const restaurant = await Restaurant.findById(req.params.id).lean();
  if (!restaurant) {
    const err = new Error('Restaurant not found');
    err.statusCode = 404;
    throw err;
  }

  const allTables = await Table.find({ restaurantId: req.params.id }).lean();

  if (!date || !slotStart || !slotEnd) {
    return res.status(200).json({ success: true, data: allTables });
  }

  // Find tables with conflicting confirmed/pending bookings
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const conflictingBookings = await Booking.find({
    restaurantId: req.params.id,
    date: { $gte: targetDate, $lt: nextDay },
    status: { $in: ['pending', 'confirmed', 'seated'] },
    $or: [
      { 'timeSlot.start': { $lt: slotEnd }, 'timeSlot.end': { $gt: slotStart } },
    ],
  }).select('tableId');

  const bookedTableIds = new Set(
    conflictingBookings.map((b) => b.tableId.toString())
  );

  const tables = allTables.map((t) => ({
    ...t,
    isAvailableForSlot: !bookedTableIds.has(t._id.toString()) && t.status === 'available',
  }));

  res.status(200).json({ success: true, data: tables });
});

// @desc   Get reviews for a restaurant (paginated)
// @route  GET /api/restaurants/:id/reviews
// @access Public
export const getRestaurantReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const restaurant = await Restaurant.findById(req.params.id).lean();
  if (!restaurant) {
    const err = new Error('Restaurant not found');
    err.statusCode = 404;
    throw err;
  }

  const [reviews, total] = await Promise.all([
    Review.find({ restaurantId: req.params.id })
      .populate('customerId', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Review.countDocuments({ restaurantId: req.params.id }),
  ]);

  res.status(200).json({
    success: true,
    data: reviews,
    pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
  });
});

// @desc   Create a restaurant (owner only)
// @route  POST /api/restaurants
// @access Private/Owner
export const createRestaurant = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    cuisineTypes,
    address,
    openingHours,
    deliveryRadius,
    minOrderAmount,
    estimatedDeliveryTime,
  } = req.body;

  if (!name || !address || !address.street || !address.city || address.lat === undefined || address.lng === undefined) {
    const err = new Error('name and full address (street, city, lat, lng) are required');
    err.statusCode = 400;
    throw err;
  }

  const restaurant = await Restaurant.create({
    ownerId: req.user._id,
    name,
    description,
    cuisineTypes: cuisineTypes || [],
    address,
    openingHours: openingHours || [],
    deliveryRadius,
    minOrderAmount,
    estimatedDeliveryTime,
  });

  res.status(201).json({ success: true, data: restaurant });
});

// @desc   Update a restaurant (owner only, must own it)
// @route  PUT /api/restaurants/:id
// @access Private/Owner
export const updateRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) {
    const err = new Error('Restaurant not found');
    err.statusCode = 404;
    throw err;
  }

  if (restaurant.ownerId.toString() !== req.user._id.toString()) {
    const err = new Error('You do not own this restaurant');
    err.statusCode = 403;
    throw err;
  }

  const allowedFields = [
    'name', 'description', 'cuisineTypes', 'address',
    'openingHours', 'isActive', 'deliveryRadius', 'minOrderAmount', 'estimatedDeliveryTime',
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      restaurant[field] = req.body[field];
    }
  });

  await restaurant.save();
  res.status(200).json({ success: true, data: restaurant });
});

// @desc   Upload multiple images for a restaurant
// @route  POST /api/restaurants/:id/images
// @access Private/Owner
export const uploadImages = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) {
    const err = new Error('Restaurant not found');
    err.statusCode = 404;
    throw err;
  }

  if (restaurant.ownerId.toString() !== req.user._id.toString()) {
    const err = new Error('You do not own this restaurant');
    err.statusCode = 403;
    throw err;
  }

  if (!req.files || req.files.length === 0) {
    const err = new Error('No images uploaded');
    err.statusCode = 400;
    throw err;
  }

  const uploadPromises = req.files.map((file) =>
    uploadToCloudinary(file.buffer, `dineconnect/restaurants/${restaurant._id}`)
  );

  const results = await Promise.all(uploadPromises);
  const urls = results.map((r) => r.url);

  restaurant.images.push(...urls);
  if (!restaurant.coverImage) restaurant.coverImage = urls[0];
  await restaurant.save();

  res.status(200).json({ success: true, data: { images: restaurant.images } });
});
