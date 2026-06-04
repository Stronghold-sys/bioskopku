const Cinema = require('../models/Cinema');
const Studio = require('../models/Studio');
const Showtime = require('../models/Showtime');
const Seat = require('../models/Seat');
const Booking = require('../models/Booking');
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

// --- USER ENDPOINTS ---

const getCinemas = async (req, res) => {
  try {
    const cinemas = await Cinema.find();
    res.status(200).json({ success: true, cinemas });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCinemaStudios = async (req, res) => {
  try {
    const studios = await Studio.find({ cinemaId: req.params.cinemaId });
    res.status(200).json({ success: true, studios });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getShowtimes = async (req, res) => {
  try {
    const { movieId, date, cinemaId } = req.query;
    const filter = {};
    if (movieId) filter.movieId = movieId;
    if (date) filter.date = date;

    let showtimes = await Showtime.find(filter)
      .populate('movieId')
      .populate({
        path: 'studioId',
        populate: { path: 'cinemaId' }
      });

    // Filter by cinema if needed (since studio is referenced to cinema)
    if (cinemaId) {
      showtimes = showtimes.filter(s => {
        const studio = s.studioId;
        const studioCinemaId = studio && studio.cinemaId && (typeof studio.cinemaId === 'object' ? studio.cinemaId._id : studio.cinemaId);
        return studio && studioCinemaId === cinemaId;
      });
    }

    res.status(200).json({ success: true, showtimes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Retrieve seat map and booked status for a showtime
const getShowtimeDetails = async (req, res) => {
  try {
    const showtime = await Showtime.findById(req.params.id).populate('movieId').populate('studioId');
    if (!showtime) {
      return res.status(404).json({ success: false, message: 'Jadwal tayang tidak ditemukan' });
    }

    const studio = showtime.studioId;
    const cinema = await Cinema.findById(studio.cinemaId);

    // Get all seats for this studio
    const seats = await Seat.find({ studioId: studio._id }).sort('row');

    // Get all bookings for this showtime that are Paid or Pending (and not expired)
    const bookings = await Booking.find({
      showtimeId: showtime._id,
      paymentStatus: { $in: ['Paid', 'Pending'] }
    });

    // Check expiration of pending bookings and collect reserved seats
    const now = new Date();
    const reservedSeats = [];
    for (const b of bookings) {
      if (b.paymentStatus === 'Pending' && new Date(b.expiresAt) < now) {
        // Mark as expired in DB
        await Booking.findByIdAndUpdate(b._id, { paymentStatus: 'Expired' });
        continue;
      }
      reservedSeats.push(...b.selectedSeats);
    }

    res.status(200).json({
      success: true,
      showtime: {
        _id: showtime._id,
        date: showtime.date,
        startTime: showtime.startTime,
        price: showtime.price,
        movie: showtime.movieId,
        studio: {
          _id: studio._id,
          name: studio.name,
          classType: studio.classType,
          cinema: cinema
        }
      },
      seats: seats.map(s => ({
        _id: s._id,
        row: s.row,
        number: s.number,
        type: s.type,
        label: `${s.row}-${s.number}`,
        isBooked: reservedSeats.includes(`${s.row}-${s.number}`)
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- ADMIN ENDPOINTS (CRUD) ---

// Cinema CRUD
const createCinema = async (req, res) => {
  try {
    const { name, location, description } = req.body;
    if (!name || !location) return res.status(400).json({ success: false, message: 'Nama dan lokasi wajib diisi' });

    const cinema = await Cinema.create({ name, location, description });
    await logAdminAction(req.user.id, 'CREATE_CINEMA', 'Cinema', cinema);
    res.status(201).json({ success: true, message: 'Bioskop berhasil dibuat', cinema });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateCinema = async (req, res) => {
  try {
    const cinema = await Cinema.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await logAdminAction(req.user.id, 'UPDATE_CINEMA', 'Cinema', { id: req.params.id, name: cinema.name });
    res.status(200).json({ success: true, message: 'Bioskop berhasil diperbarui', cinema });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteCinema = async (req, res) => {
  try {
    const cinema = await Cinema.findById(req.params.id);
    if (!cinema) return res.status(404).json({ success: false, message: 'Bioskop tidak ditemukan' });
    await Cinema.findByIdAndDelete(req.params.id);
    await logAdminAction(req.user.id, 'DELETE_CINEMA', 'Cinema', { id: req.params.id, name: cinema.name });
    res.status(200).json({ success: true, message: 'Bioskop berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Studio CRUD
const createStudio = async (req, res) => {
  try {
    const { name, cinemaId, classType, basePrice, rowsCount = 5, seatsPerRow = 8 } = req.body;
    if (!name || !cinemaId || !classType || !basePrice) {
      return res.status(400).json({ success: false, message: 'Harap lengkapi data studio' });
    }

    const studio = await Studio.create({ name, cinemaId, classType, basePrice: Number(basePrice) });

    // Generate seats automatically
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].slice(0, Number(rowsCount));
    for (const row of rows) {
      for (let num = 1; num <= Number(seatsPerRow); num++) {
        await Seat.create({
          studioId: studio._id,
          row,
          number: num,
          type: row === 'E' && classType !== 'Premiere' ? 'Sweetbox' : 'Regular'
        });
      }
    }

    await logAdminAction(req.user.id, 'CREATE_STUDIO', 'Studio', studio);
    res.status(201).json({ success: true, message: 'Studio dan kursi berhasil dibuat', studio });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateStudio = async (req, res) => {
  try {
    const studio = await Studio.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await logAdminAction(req.user.id, 'UPDATE_STUDIO', 'Studio', { id: req.params.id, name: studio.name });
    res.status(200).json({ success: true, message: 'Studio berhasil diperbarui', studio });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteStudio = async (req, res) => {
  try {
    const studio = await Studio.findById(req.params.id);
    if (!studio) return res.status(404).json({ success: false, message: 'Studio tidak ditemukan' });
    await Studio.findByIdAndDelete(req.params.id);
    await Seat.find({ studioId: req.params.id }).then(async (seats) => {
      // Clean up seats
      for (const s of seats) {
        await Seat.findByIdAndDelete(s._id);
      }
    });
    await logAdminAction(req.user.id, 'DELETE_STUDIO', 'Studio', { id: req.params.id, name: studio.name });
    res.status(200).json({ success: true, message: 'Studio dan kursi berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Showtime CRUD
const createShowtime = async (req, res) => {
  try {
    const { movieId, studioId, date, startTime, price } = req.body;
    if (!movieId || !studioId || !date || !startTime || !price) {
      return res.status(400).json({ success: false, message: 'Harap lengkapi data jadwal tayang' });
    }

    // Check clash in studio showtime
    const clash = await Showtime.findOne({ studioId, date, startTime });
    if (clash) {
      return res.status(400).json({ success: false, message: 'Jadwal bertabrakan dengan jadwal studio yang ada' });
    }

    const showtime = await Showtime.create({ movieId, studioId, date, startTime, price: Number(price) });
    await logAdminAction(req.user.id, 'CREATE_SHOWTIME', 'Showtime', showtime);

    const io = req.app.get('socketio');
    if (io) io.emit('showtimes-updated');

    res.status(201).json({ success: true, message: 'Jadwal tayang berhasil dibuat', showtime });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateShowtime = async (req, res) => {
  try {
    const showtime = await Showtime.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await logAdminAction(req.user.id, 'UPDATE_SHOWTIME', 'Showtime', { id: req.params.id });

    const io = req.app.get('socketio');
    if (io) io.emit('showtimes-updated');

    res.status(200).json({ success: true, message: 'Jadwal tayang berhasil diperbarui', showtime });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteShowtime = async (req, res) => {
  try {
    await Showtime.findByIdAndDelete(req.params.id);
    await logAdminAction(req.user.id, 'DELETE_SHOWTIME', 'Showtime', { id: req.params.id });

    const io = req.app.get('socketio');
    if (io) io.emit('showtimes-updated');

    res.status(200).json({ success: true, message: 'Jadwal tayang berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCinemas,
  getCinemaStudios,
  getShowtimes,
  getShowtimeDetails,
  createCinema,
  updateCinema,
  deleteCinema,
  createStudio,
  updateStudio,
  deleteStudio,
  createShowtime,
  updateShowtime,
  deleteShowtime
};
