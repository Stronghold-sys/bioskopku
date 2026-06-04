const { dbModel } = require('../config/db');

const promoSchema = {
  code: { type: String, required: true, unique: true },
  discountPercentage: { type: Number, required: true },
  description: { type: String, required: true },
  posterUrl: { type: String, required: true },
  maxDiscount: { type: Number, required: true },
  expiryDate: { type: String, required: true } // YYYY-MM-DD
};

module.exports = dbModel('Promo', promoSchema);
