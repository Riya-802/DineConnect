import Notification from '../models/Notification.js';

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/notifications — User's notifications (paginated, newest first)
// ══════════════════════════════════════════════════════════════════════════════
export const getNotifications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filter = { userId: req.user._id };
  if (req.query.unread === 'true') filter.isRead = false;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId: req.user._id, isRead: false }),
  ]);

  res.json({
    success: true,
    data: {
      notifications,
      unreadCount,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// PATCH /api/notifications/:id/read — Mark single notification as read
// ══════════════════════════════════════════════════════════════════════════════
export const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }

  if (notification.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not your notification' });
  }

  notification.isRead = true;
  await notification.save();

  res.json({ success: true, data: notification });
});

// ══════════════════════════════════════════════════════════════════════════════
// PATCH /api/notifications/read-all — Mark all unread as read
// ══════════════════════════════════════════════════════════════════════════════
export const markAllRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { userId: req.user._id, isRead: false },
    { $set: { isRead: true } }
  );

  res.json({
    success: true,
    message: `${result.modifiedCount} notification(s) marked as read`,
  });
});
