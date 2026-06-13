import { Server } from 'socket.io';
import dotenv from 'dotenv';

dotenv.config();

let io;

/**
 * Initialize Socket.io server.
 * @param {import('http').Server} server - HTTP server instance
 * @returns {import('socket.io').Server} io instance
 */
export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // ── Join a personal room keyed by userId ─────────────────────────────
    socket.on('join:room', (userId) => {
      if (!userId) return;
      socket.join(userId.toString());
      console.log(`[Socket.io] Socket ${socket.id} joined room: ${userId}`);
    });

    // ── Delivery partner broadcasts their live location ───────────────────
    // Payload: { orderId, lat, lng }
    socket.on('delivery:update_location', ({ orderId, lat, lng }) => {
      if (!orderId) return;
      const room = `order:${orderId}`;
      // Broadcast to anyone watching this order (customer + restaurant)
      io.to(room).emit('delivery:location', { orderId, lat, lng });
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.io] Client disconnected: ${socket.id} — ${reason}`);
    });
  });

  console.log('[Socket.io] Server initialized');
  return io;
};

/**
 * Emit an event to a specific user's personal room.
 * @param {string} userId - MongoDB ObjectId as string
 * @param {string} event  - Event name
 * @param {*}      data   - Payload
 */
export const emitToUser = (userId, event, data) => {
  if (!io) {
    console.warn('[Socket.io] emitToUser called before io was initialized');
    return;
  }
  if (!userId) return;
  io.to(userId.toString()).emit(event, data);
};

/**
 * Emit an event to an arbitrary named room.
 * @param {string} room  - Room name (e.g. 'restaurant:64abc...', 'order:64xyz...')
 * @param {string} event - Event name
 * @param {*}      data  - Payload
 */
export const emitToRoom = (room, event, data) => {
  if (!io) {
    console.warn('[Socket.io] emitToRoom called before io was initialized');
    return;
  }
  if (!room) return;
  io.to(room).emit(event, data);
};

/**
 * Get the Socket.io instance (after initSocket has been called).
 * @returns {import('socket.io').Server}
 */
export const getIO = () => {
  if (!io) throw new Error('Socket.io has not been initialized. Call initSocket(server) first.');
  return io;
};

export { io };
