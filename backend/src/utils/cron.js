import cron from 'node-cron';
import Booking from '../models/Booking.js';
import Table from '../models/Table.js';

// Helper to check if a slot start time has expired by more than 15 minutes
export const isBookingExpired = (bookingDate, startSlotStr) => {
  try {
    const [startHour, startMin] = startSlotStr.split(':').map(Number);
    const bookingDateTime = new Date(bookingDate);
    bookingDateTime.setHours(startHour, startMin, 0, 0);

    const now = new Date();
    const differenceInMinutes = (now.getTime() - bookingDateTime.getTime()) / (1000 * 60);

    return differenceInMinutes > 15;
  } catch (err) {
    return false;
  }
};

export const startBookingReleaseCron = (io) => {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    console.log('[Cron] Checking for expired reservations / no-shows...');
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find all confirmed reservations for today
      const expiredBookings = await Booking.find({
        status: 'confirmed',
        date: { $lte: new Date() } // today or in the past
      });

      for (const booking of expiredBookings) {
        if (isBookingExpired(booking.date, booking.timeSlot.start)) {
          console.log(`[Cron] Auto-releasing no-show booking ID: ${booking._id}`);
          
          booking.status = 'cancelled';
          await booking.save();

          // Free up the table if it was assigned to this booking
          const table = await Table.findById(booking.tableId);
          if (table && table.currentBookingId && table.currentBookingId.toString() === booking._id.toString()) {
            table.status = 'available';
            table.currentBookingId = null;
            await table.save();

            // Emit real-time status update to clients
            if (io) {
              io.emit('table:status_changed', { tableId: table._id, status: 'available' });
              io.to(booking.customerId.toString()).emit('booking:cancelled', {
                bookingId: booking._id,
                reason: 'No-show auto-release'
              });
            }
          }
        }
      }
    } catch (err) {
      console.error(`[Cron Error] Failed to execute auto-release: ${err.message}`);
    }
  });
};
