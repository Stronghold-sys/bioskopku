const { dbModel } = require('../config/db');

const studioSchema = {
  name: { type: String, required: true },
  cinemaId: { type: String, ref: 'Cinema', required: true },
  classType: { type: String, required: true }, // e.g. Regular, IMAX, Premiere
  basePrice: { type: Number, required: true }
};

module.exports = dbModel('Studio', studioSchema);
