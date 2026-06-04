const { dbModel } = require('../config/db');

const seatSchema = {
  studioId: { type: String, ref: 'Studio', required: true },
  row: { type: String, required: true }, // e.g. A, B, C
  number: { type: Number, required: true }, // e.g. 1, 2, 3
  type: { type: String, default: 'Regular' } // Regular, Sweetbox
};

module.exports = dbModel('Seat', seatSchema);
