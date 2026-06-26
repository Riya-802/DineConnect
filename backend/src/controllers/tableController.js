import Table from '../models/Table.js';
import Restaurant from '../models/Restaurant.js';
import Booking from '../models/Booking.js';

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Helper: verify the owner owns the restaurant for this table
const getOwnerRestaurant = async (ownerId) => {
  const restaurant = await Restaurant.findOne({ ownerId }).lean();
  if (!restaurant) {
    const err = new Error('No restaurant found for this owner');
    err.statusCode = 404;
    throw err;
  }
  return restaurant;
};

// @desc   Add a table to the owner's restaurant
// @route  POST /api/tables
// @access Private/Owner
export const addTable = asyncHandler(async (req, res) => {
  const { tableNumber, capacity, position } = req.body;

  if (!tableNumber || !capacity) {
    const err = new Error('tableNumber and capacity are required');
    err.statusCode = 400;
    throw err;
  }

  const restaurant = await getOwnerRestaurant(req.user._id);

  const table = await Table.create({
    restaurantId: restaurant._id,
    tableNumber: tableNumber.toString(),
    capacity: parseInt(capacity),
    position: position || undefined,
  });

  res.status(201).json({ success: true, data: table });
});

// @desc   Update table number or capacity
// @route  PUT /api/tables/:id
// @access Private/Owner
export const updateTable = asyncHandler(async (req, res) => {
  const { tableNumber, capacity, position } = req.body;
  const restaurant = await getOwnerRestaurant(req.user._id);

  const table = await Table.findOne({ _id: req.params.id, restaurantId: restaurant._id });
  if (!table) {
    const err = new Error('Table not found or does not belong to your restaurant');
    err.statusCode = 404;
    throw err;
  }

  if (tableNumber) table.tableNumber = tableNumber.toString();
  if (capacity) table.capacity = parseInt(capacity);
  if (position) table.position = { ...table.position, ...position };

  await table.save();
  res.status(200).json({ success: true, data: table });
});

// @desc   Manually change a table's status
// @route  PUT /api/tables/:id/status
// @access Private/Owner
export const updateTableStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['available', 'occupied', 'reserved', 'maintenance'];

  if (!status || !validStatuses.includes(status)) {
    const err = new Error(`status must be one of: ${validStatuses.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  const restaurant = await getOwnerRestaurant(req.user._id);
  const table = await Table.findOne({ _id: req.params.id, restaurantId: restaurant._id });

  if (!table) {
    const err = new Error('Table not found or does not belong to your restaurant');
    err.statusCode = 404;
    throw err;
  }

  table.status = status;
  if (status === 'available') table.currentBookingId = null;
  await table.save();

  res.status(200).json({ success: true, data: table });
});

// @desc   Delete a table (only if not currently active)
// @route  DELETE /api/tables/:id
// @access Private/Owner
export const deleteTable = asyncHandler(async (req, res) => {
  const restaurant = await getOwnerRestaurant(req.user._id);
  const table = await Table.findOne({ _id: req.params.id, restaurantId: restaurant._id });

  if (!table) {
    const err = new Error('Table not found or does not belong to your restaurant');
    err.statusCode = 404;
    throw err;
  }

  if (['reserved', 'occupied'].includes(table.status)) {
    const err = new Error(`Cannot delete a table with status '${table.status}'. Clear booking first.`);
    err.statusCode = 409;
    throw err;
  }

  // Also check active bookings as extra safety
  const activeBooking = await Booking.findOne({
    tableId: table._id,
    status: { $in: ['pending', 'confirmed', 'seated'] },
  });

  if (activeBooking) {
    const err = new Error('Cannot delete a table with an active booking');
    err.statusCode = 409;
    throw err;
  }

  await table.deleteOne();
  res.status(200).json({ success: true, message: 'Table deleted successfully' });
});
