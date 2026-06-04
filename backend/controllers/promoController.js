const Promo = require('../models/Promo');
const AuditLog = require('../models/AuditLog');

const logAdminAction = async (adminUserId, action, targetResource, payload) => {
  try {
    await AuditLog.create({
      adminUserId,
      action,
      targetResource,
      payload: JSON.stringify(payload),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to write audit log:', error.message);
  }
};

const getPromos = async (req, res) => {
  try {
    const promos = await Promo.find();
    res.status(200).json({ success: true, promos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const validatePromoCode = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Masukkan kode promo' });

    const promo = await Promo.findOne({ code: code.toUpperCase() });
    if (!promo) {
      return res.status(404).json({ success: false, message: 'Kode promo tidak ditemukan' });
    }

    const today = new Date().toISOString().split('T')[0];
    if (promo.expiryDate < today) {
      return res.status(400).json({ success: false, message: 'Kode promo telah kedaluwarsa' });
    }

    res.status(200).json({
      success: true,
      message: 'Kode promo berhasil digunakan!',
      promo: {
        code: promo.code,
        discountPercentage: promo.discountPercentage,
        maxDiscount: promo.maxDiscount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createPromo = async (req, res) => {
  try {
    const { code, discountPercentage, description, posterUrl, maxDiscount, expiryDate } = req.body;
    if (!code || !discountPercentage || !description || !posterUrl || !maxDiscount || !expiryDate) {
      return res.status(400).json({ success: false, message: 'Harap lengkapi semua data promo' });
    }

    const existing = await Promo.findOne({ code: code.toUpperCase() });
    if (existing) return res.status(400).json({ success: false, message: 'Kode promo sudah ada' });

    const promo = await Promo.create({
      code: code.toUpperCase(),
      discountPercentage: Number(discountPercentage),
      description,
      posterUrl,
      maxDiscount: Number(maxDiscount),
      expiryDate
    });

    await logAdminAction(req.user.id, 'CREATE_PROMO', 'Promo', promo);

    const io = req.app.get('socketio');
    if (io) io.emit('promos-updated');

    res.status(201).json({ success: true, message: 'Promo berhasil ditambahkan', promo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updatePromo = async (req, res) => {
  try {
    const promo = await Promo.findByIdAndUpdate(req.params.id, {
      ...req.body,
      code: req.body.code ? req.body.code.toUpperCase() : undefined
    }, { new: true });
    await logAdminAction(req.user.id, 'UPDATE_PROMO', 'Promo', { id: req.params.id, code: promo.code });

    const io = req.app.get('socketio');
    if (io) io.emit('promos-updated');

    res.status(200).json({ success: true, message: 'Promo berhasil diperbarui', promo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deletePromo = async (req, res) => {
  try {
    const promo = await Promo.findById(req.params.id);
    if (!promo) return res.status(404).json({ success: false, message: 'Promo tidak ditemukan' });
    await Promo.findByIdAndDelete(req.params.id);
    await logAdminAction(req.user.id, 'DELETE_PROMO', 'Promo', { id: req.params.id, code: promo.code });

    const io = req.app.get('socketio');
    if (io) io.emit('promos-updated');

    res.status(200).json({ success: true, message: 'Promo berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPromos,
  validatePromoCode,
  createPromo,
  updatePromo,
  deletePromo
};
