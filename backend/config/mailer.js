const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');

const resendApiKey = process.env.RESEND_API_KEY;
let resend = null;

if (resendApiKey && resendApiKey.startsWith('re_')) {
  try {
    resend = new Resend(resendApiKey);
    console.log('Resend Mailer Initialized with API Key.');
  } catch (error) {
    console.error(' Resend Mailer Initialization Error:', error.message);
  }
} else {
  console.log(' RESEND_API_KEY is not defined or invalid. Emails will be logged to backend/logs/otp.log and console.');
}

// Ensure logs directory exists
const logDir = path.join(__dirname, '..', 'logs');
try {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
} catch (err) {
  console.warn('⚠️ Could not create logs directory (likely read-only serverless environment):', err.message);
}
const logFile = path.join(logDir, 'otp.log');

const writeToLogFile = (message) => {
  const timestamp = new Date().toISOString();
  try {
    fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`, 'utf8');
  } catch (err) {
    console.warn('⚠️ Could not write to log file:', err.message);
  }
};

const getCurrentTimeIndonesian = () => {
  const now = new Date();
  return now.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'medium',
    timeStyle: 'medium'
  }) + ' WIB';
};

// Send email via Resend menggunakan domain terverifikasi bioskopku.my.id
const sendResendEmail = async (to, subject, htmlContent) => {
  if (!resend) return false;
  try {
    const response = await resend.emails.send({
      from: 'BioskopKu <no-reply@bioskopku.my.id>',
      to: to,
      subject: subject,
      html: htmlContent,
    });

    if (response && response.error) {
      console.error(` Resend API Error for recipient ${to}:`, response.error.message);
      return false;
    }

    console.log(` Email berhasil dikirim ke ${to}`);
    return true;
  } catch (error) {
    console.error(` Resend Exception ketika mengirim ke ${to}:`, error.message);
    return false;
  }
};

// 1. Send OTP Pendaftaran Akun Baru
const sendRegisterOTP = async (email, name, otp) => {
  const subject = 'Verifikasi Pendaftaran Akun BioskopKu';
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #1a1a1a; border-radius: 8px; background-color: #0d0d0d; color: #ffffff;">
      <h2 style="color: #ffaa00; text-align: center; border-bottom: 2px solid #ffaa00; padding-bottom: 10px;">Pendaftaran Akun BioskopKu</h2>
      <p>Halo, <strong>${name}</strong>!</p>
      <p>Terima kasih telah melakukan pendaftaran akun baru di BioskopKu. Untuk menyelesaikan proses pendaftaran ini, silakan masukkan kode OTP berikut pada aplikasi:</p>
      <div style="background-color: #1a1a1a; padding: 15px; text-align: center; border-radius: 6px; font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #ffaa00; margin: 20px 0; border: 1px solid #333;">
        ${otp}
      </div>
      <p style="font-size: 12px; color: #888888; text-align: center; margin-top: 20px;">Kode OTP ini berlaku selama 10 menit demi keamanan akun Anda. Mohon untuk tidak membagikan kode ini kepada pihak lain.</p>
    </div>
  `;

  const logMessage = `[REGISTER OTP] Sent to ${email} (${name}): ${otp}`;
  console.log(`\n========================================\n ${logMessage}\n========================================\n`);
  writeToLogFile(logMessage);

  if (resend) {
    return await sendResendEmail(email, subject, htmlContent);
  }
  return true;
};

// 2. Send Notifikasi Login
const sendLoginAlert = async (email, name) => {
  const subject = 'Notifikasi Keamanan: Percobaan Masuk Akun BioskopKu';
  const timeStr = getCurrentTimeIndonesian();
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #1a1a1a; border-radius: 8px; background-color: #0d0d0d; color: #ffffff;">
      <h2 style="color: #ffaa00; text-align: center; border-bottom: 2px solid #ffaa00; padding-bottom: 10px;">Keamanan Akun BioskopKu</h2>
      <p>Halo, <strong>${name}</strong>!</p>
      <p>Kami mendeteksi aktivitas masuk baru pada akun BioskopKu Anda dengan alamat email <strong>${email}</strong>.</p>
      <div style="background-color: #1a1a1a; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #333; line-height: 1.6;">
        <p style="margin: 0;"><strong>Waktu Masuk:</strong> ${timeStr}</p>
        <p style="margin: 5px 0 0 0;"><strong>Status:</strong> Berhasil Masuk</p>
      </div>
      <p>Apabila ini merupakan aktivitas Anda, Anda dapat mengabaikan pesan ini. Namun, jika Anda tidak merasa melakukan aktivitas masuk ini, silakan segera ubah kata sandi Anda atau hubungi layanan pelanggan kami demi menjaga keamanan akun Anda.</p>
    </div>
  `;

  const logMessage = `[LOGIN ALERT] Sent to ${email} (${name}) at ${timeStr}`;
  console.log(`\n========================================\n ${logMessage}\n========================================\n`);
  writeToLogFile(logMessage);

  if (resend) {
    return await sendResendEmail(email, subject, htmlContent);
  }
  return true;
};

// 3. Send OTP Lupa Password
const sendForgotPasswordOTP = async (email, name, otp) => {
  const subject = 'Permintaan Atur Ulang Kata Sandi Akun BioskopKu';
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #1a1a1a; border-radius: 8px; background-color: #0d0d0d; color: #ffffff;">
      <h2 style="color: #ffaa00; text-align: center; border-bottom: 2px solid #ffaa00; padding-bottom: 10px;">Atur Ulang Kata Sandi BioskopKu</h2>
      <p>Halo, <strong>${name}</strong>!</p>
      <p>Kami menerima permintaan untuk mengatur ulang kata sandi akun BioskopKu Anda. Masukkan kode OTP berikut pada halaman pemulihan sandi:</p>
      <div style="background-color: #1a1a1a; padding: 15px; text-align: center; border-radius: 6px; font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #ffaa00; margin: 20px 0; border: 1px solid #333;">
        ${otp}
      </div>
      <p style="font-size: 12px; color: #888888; text-align: center; margin-top: 20px;">Kode OTP ini hanya berlaku selama 10 menit. Jika Anda tidak merasa mengajukan permintaan ini, silakan abaikan email ini.</p>
    </div>
  `;

  const logMessage = `[FORGOT PASSWORD OTP] Sent to ${email} (${name}): ${otp}`;
  console.log(`\n========================================\n ${logMessage}\n========================================\n`);
  writeToLogFile(logMessage);

  if (resend) {
    return await sendResendEmail(email, subject, htmlContent);
  }
  return true;
};

// 4. Send Notifikasi Ubah Password
const sendChangePasswordAlert = async (email, name) => {
  const subject = 'Notifikasi Keamanan: Perubahan Kata Sandi Akun BioskopKu';
  const timeStr = getCurrentTimeIndonesian();
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #1a1a1a; border-radius: 8px; background-color: #0d0d0d; color: #ffffff;">
      <h2 style="color: #ffaa00; text-align: center; border-bottom: 2px solid #ffaa00; padding-bottom: 10px;">Perubahan Kata Sandi Berhasil</h2>
      <p>Halo, <strong>${name}</strong>!</p>
      <p>Kami menginformasikan bahwa kata sandi untuk akun BioskopKu Anda (<strong>${email}</strong>) telah berhasil diubah.</p>
      <div style="background-color: #1a1a1a; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #333; line-height: 1.6;">
        <p style="margin: 0;"><strong>Waktu Perubahan:</strong> ${timeStr}</p>
        <p style="margin: 5px 0 0 0;"><strong>Aksi:</strong> Perbaruan Kata Sandi</p>
      </div>
      <p>Jika Anda merasa tidak melakukan perubahan kata sandi ini, harap segera menghubungi tim layanan pelanggan kami untuk melakukan penguncian akun sementara demi keamanan data Anda.</p>
    </div>
  `;

  const logMessage = `[CHANGE PASSWORD ALERT] Sent to ${email} (${name}) at ${timeStr}`;
  console.log(`\n========================================\n ${logMessage}\n========================================\n`);
  writeToLogFile(logMessage);

  if (resend) {
    return await sendResendEmail(email, subject, htmlContent);
  }
  return true;
};

// 5. Digital Ticket Email
const sendTicketEmail = async (email, name, ticket) => {
  const subject = `Tiket Digital BioskopKu Anda - ${ticket.ticketCode}`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #1a1a1a; border-radius: 8px; background-color: #0d0d0d; color: #ffffff;">
      <h2 style="color: #ffaa00; text-align: center; border-bottom: 2px solid #ffaa00; padding-bottom: 10px;">Tiket Digital BioskopKu</h2>
      <p>Halo, <strong>${name}</strong>!</p>
      <p>Pembayaran Anda berhasil! Berikut adalah detail tiket digital Anda:</p>
      <div style="border-top: 1px dashed #333; border-bottom: 1px dashed #333; padding: 15px 0; margin: 20px 0;">
        <p><strong>Kode Booking:</strong> ${ticket.ticketCode}</p>
        <p><strong>Film:</strong> ${ticket.movieTitle}</p>
        <p><strong>Cinema:</strong> ${ticket.cinemaName} (${ticket.studioName})</p>
        <p><strong>Tanggal/Jam:</strong> ${ticket.date} - ${ticket.startTime}</p>
        <p><strong>Kursi:</strong> ${ticket.seats}</p>
        <p><strong>Total Pembayaran:</strong> Rp ${ticket.totalPrice.toLocaleString('id-ID')}</p>
      </div>
      <div style="text-align: center; margin: 20px 0;">
        <p>Scan QR Code berikut di bioskop untuk masuk:</p>
        <img src="${ticket.qrCode}" alt="QR Code Booking" style="width: 180px; height: 180px; background-color: white; padding: 10px; border-radius: 8px;" />
      </div>
      <p style="font-size: 12px; color: #888888; text-align: center;">Selamat menonton! Terima kasih telah menggunakan BioskopKu.</p>
    </div>
  `;

  const logMessage = `Ticket Issued for ${email} (${name}) - Code: ${ticket.ticketCode}`;
  console.log(`\n========================================\n🎫 ${logMessage}\n========================================\n`);
  writeToLogFile(logMessage);

  if (resend) {
    return await sendResendEmail(email, subject, htmlContent);
  }
  return true;
};

// Backward-compatible sendOTP method
const sendOTP = async (email, name, otp) => {
  return sendRegisterOTP(email, name, otp);
};

module.exports = {
  sendRegisterOTP,
  sendLoginAlert,
  sendForgotPasswordOTP,
  sendChangePasswordAlert,
  sendTicketEmail,
  sendOTP
};
