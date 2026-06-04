-- SQL DDL for BioskopKu Supabase Migration
-- This script creates the 11 tables matching the application's models.
-- Column names are double-quoted to preserve case sensitivity and match Mongoose property names.

-- Drop tables if they exist
DROP TABLE IF EXISTS "AuditLogs" CASCADE;
DROP TABLE IF EXISTS "Payments" CASCADE;
DROP TABLE IF EXISTS "Tickets" CASCADE;
DROP TABLE IF EXISTS "Bookings" CASCADE;
DROP TABLE IF EXISTS "Showtimes" CASCADE;
DROP TABLE IF EXISTS "Seats" CASCADE;
DROP TABLE IF EXISTS "Studios" CASCADE;
DROP TABLE IF EXISTS "Cinemas" CASCADE;
DROP TABLE IF EXISTS "Promos" CASCADE;
DROP TABLE IF EXISTS "Movies" CASCADE;
DROP TABLE IF EXISTS "Users" CASCADE;

-- 1. Users Table
CREATE TABLE "Users" (
    "_id" VARCHAR(24) PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL UNIQUE,
    "password" VARCHAR(255) NOT NULL,
    "role" VARCHAR(50) DEFAULT 'user',
    "isVerified" BOOLEAN DEFAULT false,
    "otp" VARCHAR(50),
    "otpExpiresAt" VARCHAR(100),
    "refreshToken" VARCHAR(500),
    "createdAt" VARCHAR(100),
    "updatedAt" VARCHAR(100)
);

-- 2. Movies Table
CREATE TABLE "Movies" (
    "_id" VARCHAR(24) PRIMARY KEY,
    "title" VARCHAR(255) NOT NULL,
    "posterUrl" TEXT NOT NULL,
    "trailerUrl" TEXT NOT NULL,
    "synopsis" TEXT NOT NULL,
    "genre" VARCHAR(255) NOT NULL,
    "duration" INT NOT NULL,
    "rating" VARCHAR(50) NOT NULL,
    "releaseDate" VARCHAR(100) NOT NULL,
    "createdAt" VARCHAR(100),
    "updatedAt" VARCHAR(100)
);

-- 3. Cinemas Table
CREATE TABLE "Cinemas" (
    "_id" VARCHAR(24) PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "location" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "createdAt" VARCHAR(100),
    "updatedAt" VARCHAR(100)
);

-- 4. Studios Table
CREATE TABLE "Studios" (
    "_id" VARCHAR(24) PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "cinemaId" VARCHAR(24) NOT NULL REFERENCES "Cinemas"("_id") ON DELETE CASCADE,
    "classType" VARCHAR(100) NOT NULL,
    "basePrice" INT NOT NULL,
    "createdAt" VARCHAR(100),
    "updatedAt" VARCHAR(100)
);

-- 5. Seats Table
CREATE TABLE "Seats" (
    "_id" VARCHAR(24) PRIMARY KEY,
    "studioId" VARCHAR(24) NOT NULL REFERENCES "Studios"("_id") ON DELETE CASCADE,
    "row" VARCHAR(50) NOT NULL,
    "number" INT NOT NULL,
    "type" VARCHAR(100) DEFAULT 'Regular',
    "createdAt" VARCHAR(100),
    "updatedAt" VARCHAR(100)
);

-- 6. Showtimes Table
CREATE TABLE "Showtimes" (
    "_id" VARCHAR(24) PRIMARY KEY,
    "movieId" VARCHAR(24) NOT NULL REFERENCES "Movies"("_id") ON DELETE CASCADE,
    "studioId" VARCHAR(24) NOT NULL REFERENCES "Studios"("_id") ON DELETE CASCADE,
    "date" VARCHAR(100) NOT NULL,
    "startTime" VARCHAR(100) NOT NULL,
    "price" INT NOT NULL,
    "createdAt" VARCHAR(100),
    "updatedAt" VARCHAR(100)
);

-- 7. Bookings Table
CREATE TABLE "Bookings" (
    "_id" VARCHAR(24) PRIMARY KEY,
    "userId" VARCHAR(24) NOT NULL REFERENCES "Users"("_id") ON DELETE CASCADE,
    "showtimeId" VARCHAR(24) NOT NULL REFERENCES "Showtimes"("_id") ON DELETE CASCADE,
    "selectedSeats" JSONB NOT NULL,
    "subtotal" INT NOT NULL,
    "promoCode" VARCHAR(255) DEFAULT NULL,
    "totalPrice" INT NOT NULL,
    "paymentStatus" VARCHAR(100) DEFAULT 'Pending',
    "expiresAt" VARCHAR(100) NOT NULL,
    "createdAt" VARCHAR(100),
    "updatedAt" VARCHAR(100)
);

-- 8. Tickets Table
CREATE TABLE "Tickets" (
    "_id" VARCHAR(24) PRIMARY KEY,
    "bookingId" VARCHAR(24) NOT NULL REFERENCES "Bookings"("_id") ON DELETE CASCADE,
    "ticketCode" VARCHAR(255) NOT NULL,
    "qrCode" TEXT NOT NULL,
    "scannedStatus" BOOLEAN DEFAULT false,
    "createdAt" VARCHAR(100),
    "updatedAt" VARCHAR(100)
);

-- 9. Payments Table
CREATE TABLE "Payments" (
    "_id" VARCHAR(24) PRIMARY KEY,
    "bookingId" VARCHAR(24) NOT NULL REFERENCES "Bookings"("_id") ON DELETE CASCADE,
    "amount" INT NOT NULL,
    "paymentMethod" VARCHAR(255) NOT NULL,
    "transactionId" VARCHAR(255) NOT NULL,
    "status" VARCHAR(100) DEFAULT 'Pending',
    "paidAt" VARCHAR(100),
    "createdAt" VARCHAR(100),
    "updatedAt" VARCHAR(100)
);

-- 10. Promos Table
CREATE TABLE "Promos" (
    "_id" VARCHAR(24) PRIMARY KEY,
    "code" VARCHAR(255) NOT NULL UNIQUE,
    "discountPercentage" INT NOT NULL,
    "description" TEXT NOT NULL,
    "posterUrl" TEXT NOT NULL,
    "maxDiscount" INT NOT NULL,
    "expiryDate" VARCHAR(100) NOT NULL,
    "createdAt" VARCHAR(100),
    "updatedAt" VARCHAR(100)
);

-- 11. AuditLogs Table
CREATE TABLE "AuditLogs" (
    "_id" VARCHAR(24) PRIMARY KEY,
    "adminUserId" VARCHAR(24) NOT NULL REFERENCES "Users"("_id") ON DELETE CASCADE,
    "action" VARCHAR(255) NOT NULL,
    "targetResource" VARCHAR(255) NOT NULL,
    "payload" TEXT,
    "timestamp" VARCHAR(100) NOT NULL,
    "createdAt" VARCHAR(100),
    "updatedAt" VARCHAR(100)
);

-- Disable Row Level Security (RLS) on all tables for backend access
ALTER TABLE "Users" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Movies" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Cinemas" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Studios" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Seats" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Showtimes" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Bookings" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Tickets" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Payments" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Promos" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLogs" DISABLE ROW LEVEL SECURITY;
