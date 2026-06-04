const Movie = require('../models/Movie');
const AuditLog = require('../models/AuditLog');

const logAdminAction = async (adminUserId, action, targetResource, payload) => {
  try {
    await AuditLog.create({
      adminUserId,
      action,
      targetResource,
      payload: JSON.stringify(payload),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to write audit log:', error.message);
  }
};

const getMovies = async (req, res) => {
  try {
    const { search, genre, sort, page = 1, limit = 10 } = req.query;

    const query = {};
    if (genre) {
      query.genre = { $in: [genre] }; // Simplified mock search or standard mongoose
    }

    let moviesQuery = Movie.find(query);

    // Apply sort
    if (sort) {
      moviesQuery = moviesQuery.sort(sort);
    } else {
      moviesQuery = moviesQuery.sort('title');
    }

    let movies = await moviesQuery.exec();

    // Process custom search filtering (especially useful for mock mode)
    if (search) {
      const searchLower = search.toLowerCase();
      movies = movies.filter(m => 
        m.title.toLowerCase().includes(searchLower) || 
        m.genre.toLowerCase().includes(searchLower) ||
        m.synopsis.toLowerCase().includes(searchLower)
      );
    }

    // Manual mock pagination
    const total = movies.length;
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedMovies = movies.slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      count: paginatedMovies.length,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      total,
      movies: paginatedMovies
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMovieById = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ success: false, message: 'Film tidak ditemukan' });
    }
    res.status(200).json({ success: true, movie });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createMovie = async (req, res) => {
  try {
    const { title, posterUrl, trailerUrl, synopsis, genre, duration, rating, releaseDate } = req.body;

    if (!title || !posterUrl || !trailerUrl || !synopsis || !genre || !duration || !rating || !releaseDate) {
      return res.status(400).json({ success: false, message: 'Harap isi semua data film' });
    }

    const movie = await Movie.create({
      title,
      posterUrl,
      trailerUrl,
      synopsis,
      genre,
      duration: Number(duration),
      rating,
      releaseDate
    });

    await logAdminAction(req.user.id, 'CREATE_MOVIE', 'Movie', { id: movie._id, title });

    const io = req.app.get('socketio');
    if (io) io.emit('movies-updated');

    res.status(201).json({ success: true, message: 'Film berhasil ditambahkan', movie });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateMovie = async (req, res) => {
  try {
    const { title, posterUrl, trailerUrl, synopsis, genre, duration, rating, releaseDate } = req.body;

    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ success: false, message: 'Film tidak ditemukan' });
    }

    const updated = await Movie.findByIdAndUpdate(req.params.id, {
      title,
      posterUrl,
      trailerUrl,
      synopsis,
      genre,
      duration: duration ? Number(duration) : undefined,
      rating,
      releaseDate
    }, { new: true });

    await logAdminAction(req.user.id, 'UPDATE_MOVIE', 'Movie', { id: req.params.id, title });

    const io = req.app.get('socketio');
    if (io) io.emit('movies-updated');

    res.status(200).json({ success: true, message: 'Film berhasil diperbarui', movie: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteMovie = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ success: false, message: 'Film tidak ditemukan' });
    }

    await Movie.findByIdAndDelete(req.params.id);

    await logAdminAction(req.user.id, 'DELETE_MOVIE', 'Movie', { id: req.params.id, title: movie.title });

    const io = req.app.get('socketio');
    if (io) io.emit('movies-updated');

    res.status(200).json({ success: true, message: 'Film berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie
};
