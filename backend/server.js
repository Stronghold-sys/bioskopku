const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { connectDB } = require('./config/db');
const seedDB = require('./config/seeder');
const apiRoutes = require('./routes/api');
const { setSocketIo } = require('./controllers/bookingController');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const server = http.createServer(app);

// Configure Socket.io
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for local testing and presentation
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Pass socket reference to controllers
setSocketIo(io);
app.set('socketio', io);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
const uploadDir = process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadDir));

// API routing
app.use('/api/v1', apiRoutes);

// Health Check
app.get('/', (req, res) => {
  res.send('BioskopKu API Server is running...');
});

// Socket.io Real-time connection handler
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Join a room for a specific showtime seat map
  socket.on('join-showtime', (showtimeId) => {
    socket.join(`showtime_${showtimeId}`);
    console.log(`👤 Socket ${socket.id} joined showtime room: showtime_${showtimeId}`);
  });

  // Leave showtime room
  socket.on('leave-showtime', (showtimeId) => {
    socket.leave(`showtime_${showtimeId}`);
    console.log(`👤 Socket ${socket.id} left showtime room: showtime_${showtimeId}`);
  });

  // Handle temporary seat selection broadcast
  socket.on('select-seats', ({ showtimeId, seats, userId }) => {
    // Broadcast to other users in the same room that seats are being selected/viewed
    socket.to(`showtime_${showtimeId}`).emit('seats-selecting', { seats, userId });
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

// Start Server
const startServer = async () => {
  // Connect database
  await connectDB();

  // Seed database
  await seedDB();

  server.listen(PORT, () => {
    console.log(` Server running on port http://localhost:${PORT}`);
  });
};

startServer();
