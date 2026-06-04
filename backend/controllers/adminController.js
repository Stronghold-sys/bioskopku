const Booking = require('../models/Booking');
const User = require('../models/User');
const Movie = require('../models/Movie');
const Showtime = require('../models/Showtime');
const Payment = require('../models/Payment');
const Ticket = require('../models/Ticket');
const AuditLog = require('../models/AuditLog');

const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalMovies = await Movie.countDocuments();
    const totalShowtimes = await Showtime.countDocuments();

    // Calculate revenue and ticket counts from Paid bookings
    const paidBookings = await Booking.find({ paymentStatus: 'Paid' })
      .populate({
        path: 'showtimeId',
        populate: [{ path: 'movieId' }]
      });

    let totalRevenue = 0;
    let totalTicketsSold = 0;
    const movieSales = {};

    for (const b of paidBookings) {
      totalRevenue += b.totalPrice;
      totalTicketsSold += b.selectedSeats.length;

      // Group sales by movie
      const movie = b.showtimeId?.movieId;
      if (movie) {
        const title = movie.title;
        if (!movieSales[title]) {
          movieSales[title] = {
            title,
            revenue: 0,
            tickets: 0,
            posterUrl: movie.posterUrl
          };
        }
        movieSales[title].revenue += b.totalPrice;
        movieSales[title].tickets += b.selectedSeats.length;
      }
    }

    // Recent system activity (audit logs)
    const recentLogs = await AuditLog.find()
      .populate('adminUserId')
      .sort('-timestamp')
      .limit(10);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalMovies,
        totalShowtimes,
        totalRevenue,
        totalTicketsSold,
        movieSales: Object.values(movieSales),
        recentLogs
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find().sort('-timestamp');
    // Ensure admin user info is populated in each log
    const populated = await Promise.all(logs.map(async (log) => {
      const user = await User.findById(log.adminUserId);
      return {
        ...log,
        adminUser: user ? { name: user.name, email: user.email } : null
      };
    }));

    res.status(200).json({ success: true, logs: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).sort('-createdAt');
    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const toggleUserVerification = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { isVerified: !user.isVerified },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: `Status verifikasi pengguna berhasil diubah menjadi ${updated.isVerified ? 'Aktif' : 'Nonaktif'}`,
      user: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getReports = async (req, res) => {
  try {
    const { startDate, endDate, movieId, paymentStatus } = req.query;

    const query = {};
    // Add date boundaries to bookings (standard Mongo format or mock check)
    // For convenience in filter calculations, we fetch all bookings first and filter in JS
    let bookings = await Booking.find(query)
      .populate({
        path: 'showtimeId',
        populate: [{ path: 'movieId' }, { path: 'studioId' }]
      })
      .populate('userId');

    // Filter in Javascript to remain 100% compliant with JSON database structure
    if (startDate) {
      bookings = bookings.filter(b => b.createdAt.split('T')[0] >= startDate);
    }
    if (endDate) {
      bookings = bookings.filter(b => b.createdAt.split('T')[0] <= endDate);
    }
    if (movieId) {
      bookings = bookings.filter(b => b.showtimeId && (b.showtimeId.movieId === movieId || (b.showtimeId.movieId && b.showtimeId.movieId._id === movieId)));
    }
    if (paymentStatus) {
      bookings = bookings.filter(b => b.paymentStatus === paymentStatus);
    }

    // Sort descending
    bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Summary math
    const totalTransactions = bookings.length;
    const paidCount = bookings.filter(b => b.paymentStatus === 'Paid').length;
    const pendingCount = bookings.filter(b => b.paymentStatus === 'Pending').length;
    const cancelledCount = bookings.filter(b => b.paymentStatus === 'Cancelled' || b.paymentStatus === 'Expired').length;
    const totalRevenue = bookings
      .filter(b => b.paymentStatus === 'Paid')
      .reduce((sum, b) => sum + b.totalPrice, 0);

    res.status(200).json({
      success: true,
      summary: {
        totalTransactions,
        paidCount,
        pendingCount,
        cancelledCount,
        totalRevenue
      },
      transactions: bookings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getAuditLogs,
  getUsers,
  toggleUserVerification,
  getReports
};
