const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { connectDB } = require('../backend/config/db');
const seedDB = require('../backend/config/seeder');
const apiRoutes = require('../backend/routes/api');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
const uploadDir = process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadDir));

// API routing
app.use('/api/v1', apiRoutes);

// Health Check
app.get('/', (req, res) => {
  res.send('BioskopKu API Server is running on Vercel!');
});

// Initialize DB and Seeder (run once on cold start)
let isInitialized = false;
const initialize = async () => {
  if (!isInitialized) {
    await connectDB();
    await seedDB();
    isInitialized = true;
  }
};

// Wrap handler so DB is connected before any request
const handler = async (req, res) => {
  await initialize();
  return app(req, res);
};

module.exports = handler;
