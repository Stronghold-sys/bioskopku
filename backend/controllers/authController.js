const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendRegisterOTP, sendLoginAlert, sendForgotPasswordOTP, sendChangePasswordAlert } = require('../config/mailer');

const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_ACCESS_SECRET || 'tiketku_jwt_access_secret_key_2026_super_secure', {
    expiresIn: '7d'
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'tiketku_jwt_refresh_secret_key_2026_super_secure', {
    expiresIn: '7d'
  });
};

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Harap isi semua kolom' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // If user exists but is not verified, allow them to re-verify by sending a new OTP
      if (!existingUser.isVerified) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

        await User.findByIdAndUpdate(existingUser._id, { otp, otpExpiresAt });
        await sendRegisterOTP(email, name, otp);
        return res.status(200).json({
          success: true,
          message: 'Akun Anda belum diverifikasi. OTP baru telah dikirim ke email Anda.',
          email
        });
      }
      return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    await User.create({
      name,
      email,
      password: hashedPassword,
      otp,
      otpExpiresAt,
      role: 'user',
      isVerified: false
    });

    await sendRegisterOTP(email, name, otp);

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil. Kode OTP dikirim ke email Anda.',
      email
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Harap berikan email dan OTP' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Kode OTP tidak valid' });
    }

    const expiresAt = new Date(user.otpExpiresAt);
    if (expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Kode OTP telah kedaluwarsa' });
    }

    // Verify user
    await User.findByIdAndUpdate(user._id, {
      isVerified: true,
      otp: null,
      otpExpiresAt: null
    });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token to user DB
    await User.findByIdAndUpdate(user._id, { refreshToken });

    res.status(200).json({
      success: true,
      message: 'Verifikasi akun berhasil',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Harap isi email dan password' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email atau password salah' });
    }

    if (!user.isVerified) {
      // Re-trigger OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      await User.findByIdAndUpdate(user._id, { otp, otpExpiresAt });
      await sendRegisterOTP(user.email, user.name, otp);

      return res.status(403).json({
        success: false,
        message: 'Akun Anda belum terverifikasi. Kami telah mengirimkan ulang kode OTP.',
        needsVerification: true,
        email: user.email
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email atau password salah' });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    await User.findByIdAndUpdate(user._id, { refreshToken });

    // Send login alert email (non-blocking)
    sendLoginAlert(user.email, user.name).catch(err => console.error('Login alert email error:', err.message));

    res.status(200).json({
      success: true,
      message: 'Login berhasil',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Harap masukkan email Anda' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Akun dengan email tersebut tidak ditemukan' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await User.findByIdAndUpdate(user._id, { otp, otpExpiresAt });
    await sendForgotPasswordOTP(email, user.name, otp);

    res.status(200).json({
      success: true,
      message: 'Kode OTP untuk reset password telah dikirim ke email Anda',
      email
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Harap isi semua kolom' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Kode OTP tidak valid' });
    }

    const expiresAt = new Date(user.otpExpiresAt);
    if (expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Kode OTP telah kedaluwarsa' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      otp: null,
      otpExpiresAt: null
    });

    // Send password reset confirmation email (non-blocking)
    sendChangePasswordAlert(user.email, user.name).catch(err => console.error('Change password alert email error:', err.message));

    res.status(200).json({
      success: true,
      message: 'Password berhasil diubah. Silakan login kembali.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, password } = req.body;
    const updates = {};
    if (name) updates.name = name;
    let passwordUpdated = false;
    if (password) {
      updates.password = await bcrypt.hash(password, 10);
      passwordUpdated = true;
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updates, { new: true });

    if (passwordUpdated) {
      sendChangePasswordAlert(updatedUser.email, updatedUser.name).catch(err => console.error('Change password alert email error:', err.message));
    }

    res.status(200).json({
      success: true,
      message: 'Profil berhasil diperbarui',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Refresh token tidak dilampirkan' });
    }

    const user = await User.findOne({ refreshToken: token });
    if (!user) {
      return res.status(403).json({ success: false, message: 'Refresh token tidak valid' });
    }

    jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'tiketku_jwt_refresh_secret_key_2026_super_secure', (err, decoded) => {
      if (err || decoded.id !== user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Token kedaluwarsa atau tidak valid' });
      }

      const accessToken = generateAccessToken(user._id);
      res.status(200).json({ success: true, accessToken });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const logout = async (req, res) => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    }
    res.status(200).json({ success: true, message: 'Logout berhasil' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  register,
  verifyOTP,
  login,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  refreshToken,
  logout
};
