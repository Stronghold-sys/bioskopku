const Booking = require('../models/Booking');
const Showtime = require('../models/Showtime');
const Movie = require('../models/Movie');
const Studio = require('../models/Studio');
const Cinema = require('../models/Cinema');
const Seat = require('../models/Seat');
const Payment = require('../models/Payment');
const Ticket = require('../models/Ticket');
const Promo = require('../models/Promo');
const { sendTicketEmail } = require('../config/mailer');
const QRCode = require('qrcode');

// Access to socket server reference (will be attached in server.js)
let ioInstance = null;
const setSocketIo = (io) => {
  ioInstance = io;
};

const emitRealtimeUpdate = (eventName, data) => {
  if (ioInstance) {
    ioInstance.emit(eventName, data);
  }
};

const createBooking = async (req, res) => {
  try {
    const { showtimeId, selectedSeats, promoCode } = req.body;
    if (!showtimeId || !selectedSeats || selectedSeats.length === 0) {
      return res.status(400).json({ success: false, message: 'Jadwal tayang dan kursi wajib diisi' });
    }

    const showtime = await Showtime.findById(showtimeId).populate('studioId');
    if (!showtime) {
      return res.status(404).json({ success: false, message: 'Jadwal tayang tidak ditemukan' });
    }

    const studio = showtime.studioId;

    // Check double booking - search paid or pending non-expired bookings for these seats
    const now = new Date();
    const existingBookings = await Booking.find({
      showtimeId,
      paymentStatus: { $in: ['Paid', 'Pending'] }
    });

    const bookedSeats = [];
    for (const b of existingBookings) {
      if (b.paymentStatus === 'Pending' && new Date(b.expiresAt) < now) {
        // Automatically release expired booking
        await Booking.findByIdAndUpdate(b._id, { paymentStatus: 'Expired' });
        continue;
      }
      bookedSeats.push(...b.selectedSeats);
    }

    // Check if any selected seat is already booked
    const overlap = selectedSeats.filter(seat => bookedSeats.includes(seat));
    if (overlap.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Kursi ${overlap.join(', ')} sudah dipesan oleh pengguna lain`,
        bookedSeats
      });
    }

    // Calculate total price
    const subtotal = showtime.price * selectedSeats.length;
    let totalPrice = subtotal;
    let discount = 0;

    if (promoCode) {
      const promo = await Promo.findOne({ code: promoCode.toUpperCase() });
      if (promo) {
        const today = new Date().toISOString().split('T')[0];
        if (promo.expiryDate >= today) {
          discount = Math.min((subtotal * promo.discountPercentage) / 100, promo.maxDiscount);
          totalPrice = subtotal - discount;
        }
      }
    }

    // Booking expires in 5 minutes
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const booking = await Booking.create({
      userId: req.user.id,
      showtimeId,
      selectedSeats,
      subtotal,
      promoCode: promoCode ? promoCode.toUpperCase() : null,
      totalPrice,
      paymentStatus: 'Pending',
      expiresAt
    });

    // Emit real-time lock update to all users watching this seat map
    emitRealtimeUpdate('seats-locked', {
      showtimeId,
      lockedSeats: selectedSeats
    });

    res.status(201).json({
      success: true,
      message: 'Kursi berhasil dibooking sementara. Silakan selesaikan pembayaran.',
      booking
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const checkout = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: 'showtimeId',
        populate: [{ path: 'movieId' }, { path: 'studioId' }]
      });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Pemesanan tidak ditemukan' });
    }

    if (booking.paymentStatus !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Status pemesanan bukan pending' });
    }

    if (new Date(booking.expiresAt) < new Date()) {
      await Booking.findByIdAndUpdate(booking._id, { paymentStatus: 'Expired' });
      emitRealtimeUpdate('seats-released', { showtimeId: booking.showtimeId._id, releasedSeats: booking.selectedSeats });
      return res.status(400).json({ success: false, message: 'Pemesanan telah kedaluwarsa' });
    }

    res.status(200).json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const confirmPayment = async (req, res) => {
  try {
    const { bookingId, paymentMethod } = req.body;
    if (!bookingId || !paymentMethod) {
      return res.status(400).json({ success: false, message: 'Booking ID dan metode pembayaran wajib diisi' });
    }

    const booking = await Booking.findById(bookingId).populate({
      path: 'showtimeId',
      populate: [{ path: 'movieId' }, { path: 'studioId' }]
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Pemesanan tidak ditemukan' });
    }

    if (booking.paymentStatus === 'Paid') {
      return res.status(400).json({ success: false, message: 'Pembayaran sudah dikonfirmasi sebelumnya' });
    }

    if (booking.paymentStatus === 'Expired' || new Date(booking.expiresAt) < new Date()) {
      await Booking.findByIdAndUpdate(booking._id, { paymentStatus: 'Expired' });
      emitRealtimeUpdate('seats-released', { showtimeId: booking.showtimeId._id, releasedSeats: booking.selectedSeats });
      return res.status(400).json({ success: false, message: 'Pembayaran gagal karena waktu pemesanan habis' });
    }

    // Update status to Paid
    await Booking.findByIdAndUpdate(bookingId, { paymentStatus: 'Paid' });

    // Create payment transaction
    const transactionId = 'TX-' + Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const payment = await Payment.create({
      bookingId,
      amount: booking.totalPrice,
      paymentMethod,
      transactionId,
      status: 'Success',
      paidAt: new Date().toISOString()
    });

    // Generate unique Ticket Code
    const ticketCode = 'TK-' + Math.floor(10000000 + Math.random() * 90000000).toString();

    // Generate QR Code containing Ticket details
    const qrData = JSON.stringify({
      code: ticketCode,
      movie: booking.showtimeId.movieId.title,
      seats: booking.selectedSeats.join(', '),
      time: `${booking.showtimeId.date} ${booking.showtimeId.startTime}`
    });
    const qrCode = await QRCode.toDataURL(qrData);

    const ticket = await Ticket.create({
      bookingId,
      ticketCode,
      qrCode,
      scannedStatus: false
    });

    // Populate data for email
    const cinema = await Cinema.findById(booking.showtimeId.studioId.cinemaId);
    const movie = booking.showtimeId.movieId;
    const studio = booking.showtimeId.studioId;

    const emailPayload = {
      ticketCode,
      movieTitle: movie.title,
      cinemaName: cinema ? cinema.name : 'TiketKu Cinema',
      studioName: studio.name,
      date: booking.showtimeId.date,
      startTime: booking.showtimeId.startTime,
      seats: booking.selectedSeats.join(', '),
      totalPrice: booking.totalPrice,
      qrCode
    };

    // Send email notification (non-blocking)
    sendTicketEmail(req.user.email, req.user.name, emailPayload).catch(err => {
      console.error('Email error:', err.message);
    });

    // Emit real-time seats sold update
    emitRealtimeUpdate('seats-sold', {
      showtimeId: booking.showtimeId._id,
      soldSeats: booking.selectedSeats
    });

    // Emit live dashboard notification
    emitRealtimeUpdate('dashboard-update', {
      type: 'PAYMENT_RECEIVED',
      amount: booking.totalPrice,
      movieTitle: movie.title
    });

    res.status(200).json({
      success: true,
      message: 'Pembayaran berhasil dikonfirmasi dan tiket telah diterbitkan.',
      payment,
      ticketId: ticket._id
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id })
      .populate({
        path: 'showtimeId',
        populate: [{ path: 'movieId' }, { path: 'studioId' }]
      })
      .sort('-createdAt');

    // Filter out expired bookings on the fly
    const now = new Date();
    const updatedBookings = await Promise.all(bookings.map(async (b) => {
      if (b.paymentStatus === 'Pending' && new Date(b.expiresAt) < now) {
        await Booking.findByIdAndUpdate(b._id, { paymentStatus: 'Expired' });
        b.paymentStatus = 'Expired';
      }
      return b;
    }));

    res.status(200).json({ success: true, bookings: updatedBookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTicketDetails = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ bookingId: req.params.bookingId });
    if (!ticket) {
      // Check if ticket exists by ticket ID directly
      const ticketById = await Ticket.findById(req.params.bookingId);
      if (!ticketById) {
        return res.status(404).json({ success: false, message: 'Tiket tidak ditemukan' });
      }
      return resolveTicketDetails(ticketById, res);
    }
    return resolveTicketDetails(ticket, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper resolver for tickets
const resolveTicketDetails = async (ticket, res) => {
  const booking = await Booking.findById(ticket.bookingId)
    .populate({
      path: 'showtimeId',
      populate: [{ path: 'movieId' }, { path: 'studioId' }]
    })
    .populate('userId');

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Pemesanan terkait tiket tidak ditemukan' });
  }

  const cinema = await Cinema.findById(booking.showtimeId.studioId.cinemaId);
  const payment = await Payment.findOne({ bookingId: booking._id });

  res.status(200).json({
    success: true,
    ticket: {
      _id: ticket._id,
      ticketCode: ticket.ticketCode,
      qrCode: ticket.qrCode,
      scannedStatus: ticket.scannedStatus,
      booking: {
        _id: booking._id,
        selectedSeats: booking.selectedSeats,
        totalPrice: booking.totalPrice,
        paymentStatus: booking.paymentStatus,
        createdAt: booking.createdAt,
      },
      user: {
        name: booking.userId.name,
        email: booking.userId.email
      },
      movie: booking.showtimeId.movieId,
      showtime: {
        date: booking.showtimeId.date,
        startTime: booking.showtimeId.startTime,
        studioName: booking.showtimeId.studioId.name,
        cinemaName: cinema ? cinema.name : 'TiketKu Cinema',
        cinemaLocation: cinema ? cinema.location : ''
      },
      payment: payment ? {
        paymentMethod: payment.paymentMethod,
        transactionId: payment.transactionId,
        paidAt: payment.paidAt
      } : null
    }
  });
};

module.exports = {
  createBooking,
  checkout,
  confirmPayment,
  getUserBookings,
  getTicketDetails,
  setSocketIo
};
