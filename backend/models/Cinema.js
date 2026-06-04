const { dbModel } = require('../config/db');

const cinemaSchema = {
  name: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String }
};

module.exports = dbModel('Cinema', cinemaSchema);
