import Restaurant from '../models/Restaurant.js';
import Menu from '../models/Menu.js';

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/search?q=...  — Unified search across restaurants + menu items
// ══════════════════════════════════════════════════════════════════════════════
export const search = asyncHandler(async (req, res) => {
  const { q, lat, lng, limit: rawLimit } = req.query;
  const limit = Math.min(parseInt(rawLimit) || 20, 50);

  if (!q || q.trim().length < 2) {
    return res.status(400).json({ success: false, message: 'Search query "q" must be at least 2 characters' });
  }

  const searchRegex = new RegExp(q.trim(), 'i');

  // Search restaurants by name, description, cuisineTypes
  const restaurantQuery = Restaurant.find({
    isActive: true,
    $or: [
      { name: searchRegex },
      { description: searchRegex },
      { cuisineTypes: searchRegex },
      { 'address.city': searchRegex },
    ],
  })
    .select('name coverImage cuisineTypes avgRating totalRatings address estimatedDeliveryTime minOrderAmount')
    .limit(limit)
    .lean();

  // Search menu items by name, description, tags, category
  const menuQuery = Menu.find({
    isAvailable: true,
    $or: [
      { name: searchRegex },
      { description: searchRegex },
      { tags: searchRegex },
      { category: searchRegex },
    ],
  })
    .select('name description price images isVeg category restaurantId')
    .populate('restaurantId', 'name coverImage avgRating')
    .limit(limit)
    .lean();

  const [restaurants, menuItems] = await Promise.all([restaurantQuery, menuQuery]);

  // Add distance if user location provided
  if (lat && lng) {
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const haversine = (lat1, lng1, lat2, lng2) => {
      const R = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLng = ((lng2 - lng1) * Math.PI) / 180;
      const a = Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };
    restaurants.forEach((r) => {
      if (r.address?.lat && r.address?.lng) {
        r.distance = Math.round(haversine(userLat, userLng, r.address.lat, r.address.lng) * 10) / 10;
      }
    });
  }

  // Tag results with type
  const results = [
    ...restaurants.map((r) => ({ ...r, _type: 'restaurant' })),
    ...menuItems.map((m) => ({ ...m, _type: 'menuItem' })),
  ];

  res.json({
    success: true,
    data: {
      query: q.trim(),
      total: results.length,
      restaurants: restaurants.length,
      menuItems: menuItems.length,
      results,
    },
  });
});
