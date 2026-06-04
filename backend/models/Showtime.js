const { dbModel } = require('../config/db');

const showtimeSchema = {
  movieId: { type: String, ref: 'Movie', required: true },
  studioId: { type: String, ref: 'Studio', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  startTime: { type: String, required: true }, // HH:MM
  price: { type: Number, required: true }
};

module.exports = dbModel('Showtime', showtimeSchema);
