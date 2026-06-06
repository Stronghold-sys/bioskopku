const User = require('../models/User');
const Movie = require('../models/Movie');
const Cinema = require('../models/Cinema');
const Studio = require('../models/Studio');
const Seat = require('../models/Seat');
const Showtime = require('../models/Showtime');
const Promo = require('../models/Promo');
const bcrypt = require('bcryptjs');
const { generateObjectId } = require('./db');

const seedDB = async () => {
  try {
    console.log('🌱 Seeding database...');

    // 1. Seed Admin & Standard User if not exists
    let admin = await User.findOne({ email: 'admin@bioskopku.com' });
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    if (!admin) {
      admin = await User.create({
        name: 'Administrator',
        email: 'admin@bioskopku.com',
        password: hashedAdminPassword,
        role: 'admin',
        isVerified: true
      });
      console.log('✅ Admin user created: admin@bioskopku.com / admin123');
    } else {
      admin.role = 'admin';
      admin.password = hashedAdminPassword;
      await User.findByIdAndUpdate(admin._id, { role: 'admin', password: hashedAdminPassword });
      console.log('✅ Admin user updated: role=admin, password=admin123');
    }
    let adminId = admin._id;

    // Reset valenciafebi567@gmail.com to standard user role and ensure it exists
    const valenciaUser = await User.findOne({ email: 'valenciafebi567@gmail.com' });
    const hashedValenciaPassword = await bcrypt.hash('admin123', 10);
    if (valenciaUser) {
      await User.findByIdAndUpdate(valenciaUser._id, { role: 'user', password: hashedValenciaPassword });
      console.log('✅ valenciafebi567@gmail.com reset to user role and password: admin123.');
    } else {
      await User.create({
        name: 'Valencia Febi',
        email: 'valenciafebi567@gmail.com',
        password: hashedValenciaPassword,
        role: 'user',
        isVerified: true
      });
      console.log('✅ valenciafebi567@gmail.com created as standard user with password: admin123.');
    }

    let standardUser = await User.findOne({ email: 'user@bioskopku.com' });
    if (!standardUser) {
      const hashedUserPassword = await bcrypt.hash('user123', 10);
      standardUser = await User.create({
        name: 'User',
        email: 'user@bioskopku.com',
        password: hashedUserPassword,
        role: 'user',
        isVerified: true
      });
      console.log('✅ Standard user created: user@bioskopku.com / user123');
    }
    let userId = standardUser._id;

    // 2. Seed Movies
    const movieCount = await Movie.countDocuments();
    let movieIds = [];
    if (movieCount === 0) {
      const moviesSeed = require('./movies_seed.json');
      const createdMovies = await Movie.create(moviesSeed);
      movieIds = createdMovies.map(m => m._id);
      console.log('✅ 150 Movies successfully programmatically seeded in bulk.');
    } else {
      const existingMovies = await Movie.find();
      movieIds = existingMovies.map(m => m._id);
    }

    // 3. Seed Cinemas, Studios, Seats
    const cinemaCount = await Cinema.countDocuments();
    let cinemaIds = [];
    let studioIds = [];

    if (cinemaCount === 0) {
      const cinemas = [
        { name: 'Cinema XXI', location: 'Plaza Indonesia, Jakarta', description: 'Pengalaman menonton film berkelas premium dengan kenyamanan maksimal.' },
        { name: 'CGV Cinemas Indonesia', location: 'Grand Indonesia, Jakarta', description: 'Bioskop modern dengan teknologi audio visual termutakhir dan area santai yang luas.' },
        { name: 'Cinépolis Indonesia', location: 'Senayan Park, Jakarta', description: 'Menghadirkan konsep bioskop mewah dan inovatif untuk keluarga.' },
        { name: 'Flix Cinema', location: 'Mall of Indonesia, Jakarta', description: 'Bioskop butik dengan desain unik dan suasana intim serta ramah lingkungan.' },
        { name: 'Platinum Cineplex', location: 'Cibinong City Mall, Bogor', description: 'Hiburan film berkualitas tinggi yang terjangkau untuk semua kalangan masyarakat.' }
      ];

      for (const c of cinemas) {
        const createdCinema = await Cinema.create(c);
        cinemaIds.push(createdCinema._id);

        // Studios for each Cinema
        const studios = [
          { name: 'Studio 1 (IMAX)', classType: 'IMAX', basePrice: 75000, cinemaId: createdCinema._id },
          { name: 'Studio 2 (Regular)', classType: 'Regular', basePrice: 40000, cinemaId: createdCinema._id },
          { name: 'Studio 3 (Premiere)', classType: 'Premiere', basePrice: 100000, cinemaId: createdCinema._id }
        ];

        for (const s of studios) {
          const createdStudio = await Studio.create(s);
          studioIds.push(createdStudio._id);

          // Seats for each Studio
          const rows = s.classType === 'Premiere' ? ['A', 'B', 'C', 'D'] : ['A', 'B', 'C', 'D', 'E'];
          const maxNum = s.classType === 'Premiere' ? 6 : 8;

          const seatsToCreate = [];
          for (const row of rows) {
            for (let num = 1; num <= maxNum; num++) {
              seatsToCreate.push({
                studioId: createdStudio._id,
                row,
                number: num,
                type: row === 'E' && s.classType !== 'Premiere' ? 'Sweetbox' : 'Regular'
              });
            }
          }
          await Seat.create(seatsToCreate);
        }
      }
      console.log('✅ Cinemas, Studios, and Seats successfully seeded in bulk.');
    } else {
      const existingCinemas = await Cinema.find();
      cinemaIds = existingCinemas.map(c => c._id);
      const existingStudios = await Studio.find();
      studioIds = existingStudios.map(s => s._id);
    }

    // 4. Seed Showtimes
    const showtimeCount = await Showtime.countDocuments();
    if (showtimeCount === 0 && movieIds.length > 0 && studioIds.length > 0) {
      let showtimeIdx = 0;
      const todayStr = new Date().toISOString().split('T')[0]; // 2026-06-04

      for (const movieId of movieIds) {
        const movie = await Movie.findById(movieId);
        if (movie && movie.releaseDate <= todayStr) {
          const dates = [
            todayStr,
            new Date(Date.now() + 86400000).toISOString().split('T')[0] // Tomorrow
          ];
          const times = ['11:00', '14:00', '17:00', '20:00'];

          const studioId = studioIds[showtimeIdx % studioIds.length];
          const studio = await Studio.findById(studioId);
          const basePrice = studio ? studio.basePrice : 40000;

          await Showtime.create({
            movieId,
            studioId,
            date: dates[0],
            startTime: times[showtimeIdx % times.length],
            price: basePrice
          });

          await Showtime.create({
            movieId,
            studioId,
            date: dates[1],
            startTime: times[(showtimeIdx + 2) % times.length],
            price: basePrice
          });

          showtimeIdx++;
        }
      }
      console.log('✅ Showtimes seeded only for released movies.');
    }

    // 5. Seed Promos
    const promoCount = await Promo.countDocuments();
    if (promoCount === 0) {
      const promos = [
        {
          code: 'BIOSKOPKUSTART',
          discountPercentage: 20,
          description: 'Dapatkan diskon 20% untuk pembelian tiket pertama Anda dengan BioskopKu. Terbatas untuk pengguna baru!',
          posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=60',
          maxDiscount: 20000,
          expiryDate: '2026-12-31'
        },
        {
          code: 'WEEKENDSERU',
          discountPercentage: 15,
          description: 'Jadikan akhir pekan Anda lebih seru dengan diskon 15% untuk semua studio Regular dan IMAX.',
          posterUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=500&auto=format&fit=crop&q=60',
          maxDiscount: 15000,
          expiryDate: '2026-12-31'
        },
        {
          code: 'CINEPREMIUM',
          discountPercentage: 25,
          description: 'Diskon eksklusif 25% untuk studio kelas Premiere. Nikmati kenyamanan menonton terbaik.',
          posterUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=500&auto=format&fit=crop&q=60',
          maxDiscount: 30000,
          expiryDate: '2026-12-31'
        }
      ];

      for (const p of promos) {
        await Promo.create(p);
      }
      console.log('✅ Promos seeded.');
    }

    console.log('🌱 Database Seeding Completed Successfully.');
  } catch (error) {
    console.error('❌ Seeding database failed:', error);
  }
};

module.exports = seedDB;
