const { dbModel } = require('../config/db');

const ticketSchema = {
  bookingId: { type: String, ref: 'Booking', required: true },
  ticketCode: { type: String, required: true }, // e.g. TK-8392019
  qrCode: { type: String, required: true }, // Data URL (QR image)
  scannedStatus: { type: Boolean, default: false }
};

module.exports = dbModel('Ticket', ticketSchema);
