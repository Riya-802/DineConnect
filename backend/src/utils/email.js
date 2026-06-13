import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@dineconnect.app';

/**
 * Base email sender
 * @param {{ to: string, subject: string, html: string, text?: string }} opts
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  const msg = {
    to,
    from: FROM_EMAIL,
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, ''),
  };

  try {
    await sgMail.send(msg);
    console.log(`[Email] Sent "${subject}" to ${to}`);
  } catch (error) {
    const detail =
      error.response?.body?.errors?.[0]?.message || error.message;
    console.error(`[Email] Failed to send to ${to}: ${detail}`);
    // Do not re-throw — email failures should not crash the main flow
  }
};

/**
 * Booking confirmation email
 */
export const sendBookingConfirmation = async (user, booking, restaurant) => {
  const dateStr = new Date(booking.date).toDateString();
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #e44d26;">🍽️ Booking Confirmed — DineConnect</h2>
      <p>Hi <strong>${user.name}</strong>,</p>
      <p>Your table booking has been confirmed. Here are the details:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Restaurant</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${restaurant.name}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Date</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${dateStr}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Time</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${booking.timeSlot.start} – ${booking.timeSlot.end}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Party Size</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${booking.partySize}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Booking ID</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${booking._id}</td></tr>
        ${booking.preOrderTotal > 0 ? `<tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Pre-order Total</strong></td><td style="padding: 8px; border: 1px solid #ddd;">₹${booking.preOrderTotal.toFixed(2)}</td></tr>` : ''}
      </table>
      ${booking.specialRequests ? `<p><strong>Special Requests:</strong> ${booking.specialRequests}</p>` : ''}
      <p style="color: #888; font-size: 12px;">Please arrive 5 minutes before your slot. To cancel, use the DineConnect app.</p>
      <p style="color: #e44d26;"><strong>DineConnect Team</strong></p>
    </div>
  `;

  await sendEmail({
    to: user.email,
    subject: `Booking Confirmed at ${restaurant.name} — ${dateStr}`,
    html,
  });
};

/**
 * Order confirmation email
 */
export const sendOrderConfirmation = async (user, order) => {
  const itemRows = order.items
    .map(
      (item) =>
        `<tr><td style="padding: 8px; border: 1px solid #ddd;">${item.name}</td><td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.quantity}</td><td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹${(item.price * item.quantity).toFixed(2)}</td></tr>`
    )
    .join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #e44d26;">🛵 Order Placed — DineConnect</h2>
      <p>Hi <strong>${user.name}</strong>,</p>
      <p>Your order has been placed successfully! Estimated delivery: <strong>~${order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleTimeString() : '40 min'}</strong></p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background: #f0f0f0;">
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Item</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Qty</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
        <tfoot>
          <tr><td colspan="2" style="padding: 8px; border: 1px solid #ddd; text-align: right;"><strong>Subtotal</strong></td><td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹${order.subtotal.toFixed(2)}</td></tr>
          <tr><td colspan="2" style="padding: 8px; border: 1px solid #ddd; text-align: right;"><strong>Delivery Fee</strong></td><td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹${order.deliveryFee.toFixed(2)}</td></tr>
          <tr><td colspan="2" style="padding: 8px; border: 1px solid #ddd; text-align: right;"><strong>GST (5%)</strong></td><td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹${order.taxes.toFixed(2)}</td></tr>
          <tr style="background: #fff3e0;"><td colspan="2" style="padding: 8px; border: 1px solid #ddd; text-align: right;"><strong>Total</strong></td><td style="padding: 8px; border: 1px solid #ddd; text-align: right;"><strong>₹${order.totalAmount.toFixed(2)}</strong></td></tr>
        </tfoot>
      </table>
      <p><strong>Delivery OTP:</strong> <span style="font-size: 22px; font-weight: bold; color: #e44d26;">${order.otp}</span><br/><small>Share this with your delivery partner to confirm receipt.</small></p>
      <p style="color: #888; font-size: 12px;">Order ID: ${order._id}</p>
      <p style="color: #e44d26;"><strong>DineConnect Team</strong></p>
    </div>
  `;

  await sendEmail({
    to: user.email,
    subject: `Order Confirmed — ₹${order.totalAmount.toFixed(2)} | DineConnect`,
    html,
  });
};

/**
 * Password reset email
 */
export const sendPasswordReset = async (user, resetUrl) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #e44d26;">🔒 Password Reset — DineConnect</h2>
      <p>Hi <strong>${user.name}</strong>,</p>
      <p>We received a request to reset your DineConnect account password.</p>
      <p>Click the button below to set a new password. This link expires in <strong>15 minutes</strong>.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #e44d26; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-size: 16px;">Reset Password</a>
      </div>
      <p>Or copy this link into your browser:</p>
      <p style="word-break: break-all; color: #555;">${resetUrl}</p>
      <p>If you did not request this, please ignore this email. Your password will remain unchanged.</p>
      <p style="color: #e44d26;"><strong>DineConnect Team</strong></p>
    </div>
  `;

  await sendEmail({
    to: user.email,
    subject: 'Reset Your DineConnect Password',
    html,
  });
};
