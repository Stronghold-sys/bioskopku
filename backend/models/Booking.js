const { dbModel } = require('../config/db');

const bookingSchema = {
  userId: { type: String, ref: 'User', required: true },
  showtimeId: { type: String, ref: 'Showtime', required: true },
  selectedSeats: [{ type: String, required: true }], // e.g. ["A-5", "A-6"]
  subtotal: { type: Number, required: true },
  promoCode: { type: String, default: null },
  totalPrice: { type: Number, required: true },
  paymentStatus: { type: String, default: 'Pending' }, // Pending, Paid, Cancelled, Expired
  expiresAt: { type: String, required: true } // ISO String for expiration
};

module.exports = dbModel('Booking', bookingSchema);
