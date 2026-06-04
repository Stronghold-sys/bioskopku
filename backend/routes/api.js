const express = require('express');
const router = express.Router();

const { protect, admin } = require('../middleware/auth');

// Controllers
const authController = require('../controllers/authController');
const movieController = require('../controllers/movieController');
const cinemaController = require('../controllers/cinemaController');
const bookingController = require('../controllers/bookingController');
const promoController = require('../controllers/promoController');
const adminController = require('../controllers/adminController');

// ==========================================
// AUTH ROUTES
// ==========================================
router.post('/auth/register', authController.register);
router.post('/auth/verify-otp', authController.verifyOTP);
router.post('/auth/login', authController.login);
router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/reset-password', authController.resetPassword);
router.get('/auth/profile', protect, authController.getProfile);
router.put('/auth/profile', protect, authController.updateProfile);
router.post('/auth/refresh', authController.refreshToken);
router.post('/auth/logout', protect, authController.logout);

// ==========================================
// MOVIE ROUTES
// ==========================================
router.get('/movies', movieController.getMovies);
router.get('/movies/:id', movieController.getMovieById);
router.post('/movies', protect, admin, movieController.createMovie);
router.put('/movies/:id', protect, admin, movieController.updateMovie);
router.delete('/movies/:id', protect, admin, movieController.deleteMovie);

// ==========================================
// CINEMA & STUDIO ROUTES
// ==========================================
router.get('/cinemas', cinemaController.getCinemas);
router.get('/cinemas/:cinemaId/studios', cinemaController.getCinemaStudios);
router.post('/cinemas', protect, admin, cinemaController.createCinema);
router.put('/cinemas/:id', protect, admin, cinemaController.updateCinema);
router.delete('/cinemas/:id', protect, admin, cinemaController.deleteCinema);

router.post('/studios', protect, admin, cinemaController.createStudio);
router.put('/studios/:id', protect, admin, cinemaController.updateStudio);
router.delete('/studios/:id', protect, admin, cinemaController.deleteStudio);

// ==========================================
// SHOWTIME ROUTES
// ==========================================
router.get('/showtimes', cinemaController.getShowtimes);
router.get('/showtimes/:id', cinemaController.getShowtimeDetails);
router.post('/showtimes', protect, admin, cinemaController.createShowtime);
router.put('/showtimes/:id', protect, admin, cinemaController.updateShowtime);
router.delete('/showtimes/:id', protect, admin, cinemaController.deleteShowtime);

// ==========================================
// BOOKING & PAYMENT ROUTES
// ==========================================
router.post('/bookings', protect, bookingController.createBooking);
router.get('/bookings/user', protect, bookingController.getUserBookings);
router.get('/bookings/:id/checkout', protect, bookingController.checkout);

router.post('/payments/confirm', protect, bookingController.confirmPayment);

// ==========================================
// TICKET ROUTES
// ==========================================
router.get('/tickets/:bookingId', protect, bookingController.getTicketDetails);

// ==========================================
// PROMO ROUTES
// ==========================================
router.get('/promos', promoController.getPromos);
router.post('/promos/validate', protect, promoController.validatePromoCode);
router.post('/promos', protect, admin, promoController.createPromo);
router.put('/promos/:id', protect, admin, promoController.updatePromo);
router.delete('/promos/:id', protect, admin, promoController.deletePromo);

// ==========================================
// ADMIN DASHBOARD & REPORTS
// ==========================================
router.get('/admin/dashboard', protect, admin, adminController.getDashboardStats);
router.get('/admin/audit-logs', protect, admin, adminController.getAuditLogs);
router.get('/admin/users', protect, admin, adminController.getUsers);
router.put('/admin/users/:id/verify', protect, admin, adminController.toggleUserVerification);
router.get('/admin/reports', protect, admin, adminController.getReports);

module.exports = router;
