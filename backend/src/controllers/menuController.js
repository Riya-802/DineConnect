import Menu from '../models/Menu.js';
import Restaurant from '../models/Restaurant.js';
import { uploadToCloudinary } from '../middleware/uploadMiddleware.js';

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const getOwnerRestaurant = async (ownerId) => {
  const restaurant = await Restaurant.findOne({ ownerId }).lean();
  if (!restaurant) {
    const err = new Error('No restaurant found for this owner');
    err.statusCode = 404;
    throw err;
  }
  return restaurant;
};

// @desc   Create a menu item
// @route  POST /api/menu
// @access Private/Owner
export const createMenuItem = asyncHandler(async (req, res) => {
  const { name, description, price, category, isVeg, preparationTime, tags } = req.body;

  if (!name || !price || !category) {
    const err = new Error('name, price, and category are required');
    err.statusCode = 400;
    throw err;
  }

  const restaurant = await getOwnerRestaurant(req.user._id);

  let imageUrls = [];
  if (req.file) {
    const { url } = await uploadToCloudinary(
      req.file.buffer,
      `dineconnect/menu/${restaurant._id}`
    );
    imageUrls = [url];
  }

  const item = await Menu.create({
    restaurantId: restaurant._id,
    name: name.trim(),
    description,
    price: parseFloat(price),
    category: category.trim(),
    isVeg: isVeg === 'true' || isVeg === true,
    preparationTime: preparationTime ? parseInt(preparationTime) : 20,
    tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim())) : [],
    images: imageUrls,
  });

  res.status(201).json({ success: true, data: item });
});

// @desc   Update a menu item
// @route  PUT /api/menu/:id
// @access Private/Owner
export const updateMenuItem = asyncHandler(async (req, res) => {
  const restaurant = await getOwnerRestaurant(req.user._id);
  const item = await Menu.findOne({ _id: req.params.id, restaurantId: restaurant._id });

  if (!item) {
    const err = new Error('Menu item not found or does not belong to your restaurant');
    err.statusCode = 404;
    throw err;
  }

  const { name, description, price, category, isVeg, preparationTime, tags, isAvailable } = req.body;

  if (name) item.name = name.trim();
  if (description !== undefined) item.description = description;
  if (price !== undefined) item.price = parseFloat(price);
  if (category) item.category = category.trim();
  if (isVeg !== undefined) item.isVeg = isVeg === 'true' || isVeg === true;
  if (preparationTime !== undefined) item.preparationTime = parseInt(preparationTime);
  if (isAvailable !== undefined) item.isAvailable = isAvailable === 'true' || isAvailable === true;
  if (tags !== undefined) {
    item.tags = Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim());
  }

  // Re-upload image if a new file was provided
  if (req.file) {
    const { url } = await uploadToCloudinary(
      req.file.buffer,
      `dineconnect/menu/${restaurant._id}`
    );
    item.images = [url]; // Replace with new image
  }

  await item.save();
  res.status(200).json({ success: true, data: item });
});

// @desc   Toggle menu item availability
// @route  PATCH /api/menu/:id/toggle
// @access Private/Owner
export const toggleAvailability = asyncHandler(async (req, res) => {
  const restaurant = await getOwnerRestaurant(req.user._id);
  const item = await Menu.findOne({ _id: req.params.id, restaurantId: restaurant._id });

  if (!item) {
    const err = new Error('Menu item not found or does not belong to your restaurant');
    err.statusCode = 404;
    throw err;
  }

  item.isAvailable = !item.isAvailable;
  await item.save();

  res.status(200).json({
    success: true,
    message: `Menu item is now ${item.isAvailable ? 'available' : 'unavailable'}`,
    data: { _id: item._id, isAvailable: item.isAvailable },
  });
});

// @desc   Delete a menu item (hard delete)
// @route  DELETE /api/menu/:id
// @access Private/Owner
export const deleteMenuItem = asyncHandler(async (req, res) => {
  const restaurant = await getOwnerRestaurant(req.user._id);
  const item = await Menu.findOne({ _id: req.params.id, restaurantId: restaurant._id });

  if (!item) {
    const err = new Error('Menu item not found or does not belong to your restaurant');
    err.statusCode = 404;
    throw err;
  }

  await item.deleteOne();
  res.status(200).json({ success: true, message: 'Menu item deleted successfully' });
});
