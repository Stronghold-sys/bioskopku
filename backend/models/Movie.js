const { dbModel } = require('../config/db');

const movieSchema = {
  title: { type: String, required: true },
  posterUrl: { type: String, required: true },
  trailerUrl: { type: String, required: true },
  synopsis: { type: String, required: true },
  genre: { type: String, required: true },
  duration: { type: Number, required: true }, // in minutes
  rating: { type: String, required: true }, // e.g. PG-13, R, SU
  releaseDate: { type: String, required: true }
};

module.exports = dbModel('Movie', movieSchema);
