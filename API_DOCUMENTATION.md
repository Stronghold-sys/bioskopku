# Dokumentasi API Lengkap - TiketKu

Dokumentasi ini mencakup spesifikasi detail untuk RESTful API aplikasi TiketKu (BioskopKu), termasuk format request body, parameter query, kode status HTTP, skema autentikasi, serta contoh respons sukses dan gagal.

---

## 1. Skema Global & Keamanan

- **Base URL**: `http://localhost:5000/api/v1`
- **Format Data**: JSON (`Content-Type: application/json` untuk POST/PUT/DELETE)
- **Skema Autentikasi**: JSON Web Token (JWT) Bearer Token.
  - Untuk endpoint yang membutuhkan proteksi, sertakan header:
    `Authorization: Bearer <access_token>`

---

## 2. API Endpoint - Auth & Profil

### A. Registrasi Akun

Mendaftarkan pengguna baru dengan email dan password. Pengguna baru akan berstatus `isVerified: false` sampai kode OTP diverifikasi.

- **URL**: `/auth/register`
- **Method**: `POST`
- **Autentikasi**: Publik
- **Request Body**:

  ```json
  {
    "name": "User",
    "email": "user@tiketku.com",
    "password": "user123"
  }
  ```

- **Respons Sukses (201 Created)**:

  ```json
  {
    "message": "Registrasi berhasil. Silakan cek email Anda untuk kode verifikasi OTP.",
    "user": {
      "id": "665f84d63be5ff4218a5be01",
      "name": "John Doe",
      "email": "user@tiketku.com",
      "role": "user",
      "isVerified": false
    }
  }
  ```

- **Respons Gagal (400 Bad Request - Email Sudah Terdaftar)**:

  ```json
  {
    "message": "Email sudah terdaftar."
  }
  ```

---

### B. Verifikasi OTP

Memverifikasi 6-digit kode OTP yang dikirimkan ke email untuk mengaktifkan akun pengguna.

- **URL**: `/auth/verify-otp`
- **Method**: `POST`
- **Autentikasi**: Publik
- **Request Body**:

  ```json
  {
    "email": "user@tiketku.com",
    "otp": "123456"
  }
  ```

- **Respons Sukses (200 OK)**:

  ```json
  {
    "message": "Akun berhasil diverifikasi. Silakan login.",
    "isVerified": true
  }
  ```

- **Respons Gagal (400 Bad Request - OTP Salah / Expired)**:

  ```json
  {
    "message": "Kode OTP tidak valid atau telah kadaluarsa."
  }
  ```

---

### C. Login Pengguna

Melakukan autentikasi email dan password. Menghasilkan `accessToken` (berlaku 15 menit) dan `refreshToken` (berlaku 7 hari).

- **URL**: `/auth/login`
- **Method**: `POST`
- **Autentikasi**: Publik
- **Request Body**:

  ```json
  {
    "email": "user@tiketku.com",
    "password": "user123"
  }
  ```

- **Respons Sukses (200 OK)**:

  ```json
  {
    "message": "Login berhasil.",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2NWY4NGQ2M2JlNWZmNDIxOGE1YmUwMSIsInJvbGUiOiJ1c2VyIiw...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2NWY4NGQ2M2JlNWZmNDIxOGE1YmUwMSIs...",
    "user": {
      "id": "665f84d63be5ff4218a5be01",
      "name": "John Doe",
      "email": "user@tiketku.com",
      "role": "user",
      "isVerified": true
    }
  }
  ```

- **Respons Gagal (401 Unauthorized - Password Salah atau Akun Belum Verifikasi)**:

  ```json
  {
    "message": "Password salah."
  }
  ```

---

### D. Request OTP Lupa Password

Meminta pengiriman OTP ke email pengguna untuk proses pemulihan (reset) password.

- **URL**: `/auth/forgot-password`
- **Method**: `POST`
- **Autentikasi**: Publik
- **Request Body**:

  ```json
  {
    "email": "user@tiketku.com"
  }
  ```

- **Respons Sukses (200 OK)**:

  ```json
  {
    "message": "Kode OTP untuk reset password telah dikirim ke email Anda."
  }
  ```

---

### E. Konfirmasi Reset Password

Mengubah password lama menjadi password baru dengan menyertakan kode OTP yang valid.

- **URL**: `/auth/reset-password`
- **Method**: `POST`
- **Autentikasi**: Publik
- **Request Body**:

  ```json
  {
    "email": "user@tiketku.com",
    "otp": "123456",
    "newPassword": "newsecurepassword123"
  }
  ```

- **Respons Sukses (200 OK)**:

  ```json
  {
    "message": "Password berhasil diperbarui. Silakan login dengan password baru Anda."
  }
  ```

---

### F. Ambil Profil User

Mengambil detail profil pengguna yang sedang login.

- **URL**: `/auth/profile`
- **Method**: `GET`
- **Autentikasi**: Protected (JWT User/Admin)
- **Respons Sukses (200 OK)**:

  ```json
  {
    "user": {
      "id": "665f84d63be5ff4218a5be01",
      "name": "User",
      "email": "user@tiketku.com",
      "role": "user",
      "isVerified": true,
      "createdAt": "2026-06-04T12:00:00.000Z"
    }
  }
  ```

---

## 3. API Endpoint - Movies (Film)

### A. Dapatkan Daftar Film (Katalog)

Mengambil semua daftar film dengan fitur pencarian, penyaringan genre, pengurutan, dan paginasi.

- **URL**: `/movies`
- **Method**: `GET`
- **Autentikasi**: Publik
- **Query Parameter**:
  - `search` (Pencarian judul, opsional)
  - `genre` (Filter genre, opsional)
  - `sortBy` (Mengurutkan berdasarkan: `releaseDate`, `title`, dll., default: `releaseDate`)
  - `sortOrder` (`asc` / `desc`, default: `desc`)
  - `page` (Halaman aktif, default: `1`)
  - `limit` (Jumlah item per halaman, default: `12`)
- **Respons Sukses (200 OK)**:

  ```json
  {
    "movies": [
      {
        "_id": "665f84d63be5ff4218a5be10",
        "title": "Agak Laen",
        "posterUrl": "https://image.tmdb.org/t/p/w500/agaklaen.jpg",
        "trailerUrl": "https://www.youtube.com/embed/AgakLaenLink",
        "synopsis": "Empat sekawan penjaga rumah hantu berusaha menyelamatkan wahana mereka...",
        "genre": "Comedy, Horror",
        "duration": 119,
        "rating": "SU",
        "releaseDate": "2024-02-01"
      }
    ],
    "pagination": {
      "totalItems": 1,
      "totalPages": 1,
      "currentPage": 1,
      "limit": 12
    }
  }
  ```

---

### B. Tambah Film Baru (Admin Only)

Menambahkan film baru ke katalog bioskop.

- **URL**: `/movies`
- **Method**: `POST`
- **Autentikasi**: Protected (JWT Admin)
- **Request Body**:

  ```json
  {
    "title": "Dilan 1990",
    "posterUrl": "https://image.tmdb.org/t/p/w500/dilan1990.jpg",
    "trailerUrl": "https://www.youtube.com/embed/Dilan1990Link",
    "synopsis": "Milea bertemu dengan Dilan di sebuah SMA di Bandung pada tahun 1990...",
    "genre": "Drama, Romance",
    "duration": 110,
    "rating": "R13+",
    "releaseDate": "2018-01-25"
  }
  ```

- **Respons Sukses (201 Created)**:

  ```json
  {
    "message": "Film berhasil ditambahkan.",
    "movie": {
      "_id": "665f84d63be5ff4218a5be11",
      "title": "Dilan 1990",
      "posterUrl": "https://image.tmdb.org/t/p/w500/dilan1990.jpg",
      "trailerUrl": "https://www.youtube.com/embed/Dilan1990Link",
      "synopsis": "Milea bertemu dengan Dilan di sebuah SMA di Bandung pada tahun 1990...",
      "genre": "Drama, Romance",
      "duration": 110,
      "rating": "R13+",
      "releaseDate": "2018-01-25"
    }
  }
  ```

---

## 4. API Endpoint - Showtimes & Seats

### A. Dapatkan Jadwal Tayang (Showtimes)

Mengambil daftar jadwal tayang film berdasarkan ID Film dan Tanggal penayangan.

- **URL**: `/showtimes`
- **Method**: `GET`
- **Autentikasi**: Publik
- **Query Parameter**:
  - `movieId` (ID Film, wajib)
  - `date` (Format YYYY-MM-DD, wajib)
- **Respons Sukses (200 OK)**:

  ```json
  [
    {
      "_id": "665f84d63be5ff4218a5be30",
      "movieId": "665f84d63be5ff4218a5be10",
      "date": "2026-06-04",
      "startTime": "14:00",
      "price": 40000,
      "studioId": {
        "_id": "665f84d63be5ff4218a5be20",
        "name": "Studio 2 (Regular)",
        "classType": "Regular",
        "cinemaId": {
          "_id": "665f84d63be5ff4218a5be15",
          "name": "Cinema XXI",
          "location": "Plaza Indonesia, Jakarta"
        }
      }
    }
  ]
  ```

---

### B. Detail Jadwal Tayang & Denah Kursi

Mengambil detail showtime tertentu lengkap dengan status ketersediaan kursi secara real-time.

- **URL**: `/showtimes/:id`
- **Method**: `GET`
- **Autentikasi**: Publik
- **Respons Sukses (200 OK)**:

  ```json
  {
    "showtime": {
      "_id": "665f84d63be5ff4218a5be30",
      "date": "2026-06-04",
      "startTime": "14:00",
      "price": 40000,
      "movie": {
        "title": "Agak Laen",
        "posterUrl": "https://image.tmdb.org/t/p/w500/agaklaen.jpg"
      },
      "studio": {
        "name": "Studio 2 (Regular)",
        "classType": "Regular",
        "cinemaName": "Cinema XXI"
      }
    },
    "seats": [
      {
        "id": "665f84d63be5ff4218a5be51",
        "row": "A",
        "number": 1,
        "type": "Regular",
        "status": "available" // status: available | locked | sold
      },
      {
        "id": "665f84d63be5ff4218a5be52",
        "row": "A",
        "number": 2,
        "type": "Regular",
        "status": "sold"
      }
    ]
  }
  ```

---

## 5. API Endpoint - Booking & Pembayaran

### A. Membuat Pemesanan Kursi (Booking)

Melakukan booking sementara pada beberapa nomor kursi. Kursi yang dipilih akan bertatus `locked` selama 5 menit untuk proses checkout.

- **URL**: `/bookings`
- **Method**: `POST`
- **Autentikasi**: Protected (JWT User)
- **Request Body**:

  ```json
  {
    "showtimeId": "665f84d63be5ff4218a5be30",
    "selectedSeats": ["A-1", "A-3"],
    "promoCode": "BIOSKOPKUSTART" // opsional
  }
  ```

- **Respons Sukses (201 Created)**:

  ```json
  {
    "message": "Kursi berhasil dibooking sementara. Silakan selesaikan pembayaran dalam 5 menit.",
    "booking": {
      "_id": "665f84d63be5ff4218a5be99",
      "userId": "665f84d63be5ff4218a5be01",
      "showtimeId": "665f84d63be5ff4218a5be30",
      "selectedSeats": ["A-1", "A-3"],
      "subtotal": 80000,
      "discountAmount": 10000,
      "totalPrice": 70000,
      "paymentStatus": "Pending",
      "expiresAt": "2026-06-04T14:30:00.000Z"
    }
  }
  ```

- **Respons Gagal (400 Bad Request - Kursi Sudah Dipesan/Dikunci)**:

  ```json
  {
    "message": "Kursi A-1 sudah dipesan atau sedang dikunci oleh pengguna lain."
  }
  ```

---

### B. Konfirmasi Pembayaran (Checkout)

Menyelesaikan transaksi dengan menentukan metode pembayaran. Server merubah status booking menjadi `Paid`, mengunci kursi secara permanen (`sold`), dan menghasilkan tiket digital beserta kode QR.

- **URL**: `/payments/confirm`
- **Method**: `POST`
- **Autentikasi**: Protected (JWT User)
- **Request Body**:

  ```json
  {
    "bookingId": "665f84d63be5ff4218a5be99",
    "paymentMethod": "E-Wallet (GoPay/Dana)"
  }
  ```

- **Respons Sukses (200 OK)**:

  ```json
  {
    "message": "Pembayaran berhasil dikonfirmasi. Tiket digital telah diterbitkan.",
    "payment": {
      "_id": "665f84d63be5ff4218a5bf11",
      "bookingId": "665f84d63be5ff4218a5be99",
      "amount": 70000,
      "paymentMethod": "E-Wallet (GoPay/Dana)",
      "transactionId": "TX-1780581458814-998",
      "status": "Paid",
      "paidAt": "2026-06-04T14:26:00.000Z"
    },
    "ticket": {
      "ticketCode": "TKT-260604-A1A3",
      "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA..."
    }
  }
  ```

- **Respons Gagal (400 Bad Request - Booking Expired)**:

  ```json
  {
    "message": "Batas waktu pembayaran untuk pemesanan ini telah kadaluarsa."
  }
  ```

---

### C. Dapatkan Detail Tiket Digital

Mengambil berkas e-ticket digital lengkap dengan QR code yang siap dipindai.

- **URL**: `/tickets/:bookingId`
- **Method**: `GET`
- **Autentikasi**: Protected (JWT User/Admin)
- **Respons Sukses (200 OK)**:

  ```json
  {
    "ticket": {
      "_id": "665f84d63be5ff4218a5c001",
      "ticketCode": "TKT-260604-A1A3",
      "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA...",
      "scannedStatus": false,
      "booking": {
        "selectedSeats": ["A-1", "A-3"],
        "totalPrice": 70000,
        "paymentStatus": "Paid",
        "showtime": {
          "date": "2026-06-04",
          "startTime": "14:00",
          "movie": {
            "title": "Agak Laen",
            "posterUrl": "https://image.tmdb.org/t/p/w500/agaklaen.jpg",
            "genre": "Comedy, Horror",
            "duration": 119
          },
          "studio": {
            "name": "Studio 2 (Regular)",
            "cinemaName": "Cinema XXI"
          }
        },
        "user": {
          "name": "User",
          "email": "user@tiketku.com"
        }
      }
    }
  }
  ```

---

## 6. API Endpoint - Admin Area

### A. Statistik Dashboard Admin

Mengambil dashboard stats berupa total pendapatan, jumlah user terdaftar, total penjualan tiket, serta log aktivitas server real-time.

- **URL**: `/admin/dashboard`
- **Method**: `GET`
- **Autentikasi**: Protected (JWT Admin Only)
- **Respons Sukses (200 OK)**:

  ```json
  {
    "stats": {
      "totalRevenue": 24500000,
      "activeUsers": 482,
      "ticketsSold": 612,
      "moviesCount": 150
    },
    "recentBookings": [
      {
        "_id": "665f84d63be5ff4218a5be99",
        "userName": "User",
        "movieTitle": "Agak Laen",
        "totalPrice": 70000,
        "status": "Paid",
        "date": "2026-06-04T14:26:00.000Z"
      }
    ]
  }
  ```

---

### B. Laporan Transaksi Keuangan

Mengambil rekapitulasi laporan keuangan dengan filter tanggal, bioskop, maupun status pembayaran.

- **URL**: `/admin/reports`
- **Method**: `GET`
- **Autentikasi**: Protected (JWT Admin Only)
- **Query Parameter**:
  - `startDate` (Format YYYY-MM-DD, opsional)
  - `endDate` (Format YYYY-MM-DD, opsional)
  - `paymentStatus` (`Paid` / `Pending`, opsional)
- **Respons Sukses (200 OK)**:

  ```json
  {
    "summary": {
      "totalTransactions": 145,
      "totalPaidRevenue": 5800000,
      "totalPendingAmount": 160000
    },
    "transactions": [
      {
        "transactionId": "TX-1780581458814-998",
        "date": "2026-06-04",
        "userName": "User",
        "movieTitle": "Agak Laen",
        "amount": 70000,
        "paymentMethod": "E-Wallet (GoPay/Dana)",
        "status": "Paid"
      }
    ]
  }
  ```
