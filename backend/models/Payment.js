const { dbModel } = require('../config/db');

const paymentSchema = {
  bookingId: { type: String, ref: 'Booking', required: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, required: true }, // e.g. E-Wallet, Card, Bank Transfer
  transactionId: { type: String, required: true },
  status: { type: String, default: 'Pending' }, // Pending, Success, Failed
  paidAt: { type: String }
};

module.exports = dbModel('Payment', paymentSchema);
