import User from '../models/User.js';
import { uploadToCloudinary } from '../middleware/uploadMiddleware.js';

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// @desc   Get current user profile
// @route  GET /api/users/me
// @access Private
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-passwordHash -refreshToken');
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  res.status(200).json({ success: true, data: user });
});

// @desc   Update current user profile (name, phone, avatar)
// @route  PUT /api/users/me
// @access Private
export const updateMe = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  if (name) user.name = name.trim();
  if (phone) user.phone = phone.trim();

  // If a file was uploaded, push it to Cloudinary
  if (req.file) {
    const { url } = await uploadToCloudinary(
      req.file.buffer,
      'dineconnect/avatars'
    );
    user.avatar = url;
  }

  await user.save();

  const updatedUser = user.toObject();
  delete updatedUser.passwordHash;
  delete updatedUser.refreshToken;

  res.status(200).json({ success: true, data: updatedUser });
});

// @desc   Add a delivery address to user profile
// @route  POST /api/users/me/address
// @access Private
export const addAddress = asyncHandler(async (req, res) => {
  const { street, city, state, zip, lat, lng, label } = req.body;

  if (!street || !city || lat === undefined || lng === undefined) {
    const err = new Error('street, city, lat, and lng are required');
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  user.address.push({ street, city, state, zip, lat, lng, label: label || 'Home' });
  await user.save();

  res.status(201).json({
    success: true,
    message: 'Address added successfully',
    data: user.address,
  });
});

// @desc   Remove an address from user profile
// @route  DELETE /api/users/me/address/:id
// @access Private
export const removeAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  const addressIndex = user.address.findIndex(
    (a) => a._id.toString() === req.params.id
  );

  if (addressIndex === -1) {
    const err = new Error('Address not found');
    err.statusCode = 404;
    throw err;
  }

  user.address.splice(addressIndex, 1);
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Address removed successfully',
    data: user.address,
  });
});
