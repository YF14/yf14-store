const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: String,
  type: { type: String, enum: ['percentage', 'fixed'], required: true },
  value: { type: Number, required: true, min: 0 },
  minOrderAmount: { type: Number, default: 0 },
  maxDiscount: Number, // cap for percentage discounts
  usageLimit: { type: Number, default: null }, // null = unlimited
  usedCount: { type: Number, default: 0 },
  perUserLimit: { type: Number, default: 1 }, // times per user
  usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  startDate: Date,
  endDate: Date,
  isActive: { type: Boolean, default: true },
  applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
}, { timestamps: true });

promoCodeSchema.methods.isValid = function (userId, orderAmount, locale = 'ar') {
  const { t, iqd } = require('../utils/messages');
  const now = new Date();
  if (!this.isActive) return { valid: false, message: t(locale, 'promoInactive') };
  if (this.startDate && now < this.startDate) return { valid: false, message: t(locale, 'promoNotYetActive') };
  if (this.endDate && now > this.endDate) return { valid: false, message: t(locale, 'promoExpired') };
  if (this.usageLimit && this.usedCount >= this.usageLimit) return { valid: false, message: t(locale, 'promoUsageLimit') };
  if (orderAmount < this.minOrderAmount) return { valid: false, message: t(locale, 'promoMinOrder', { amount: iqd(this.minOrderAmount) }) };
  const userUsageCount = this.usedBy.filter(id => id.toString() === userId.toString()).length;
  if (userUsageCount >= this.perUserLimit) return { valid: false, message: t(locale, 'promoAlreadyUsed') };
  return { valid: true };
};

promoCodeSchema.methods.calculateDiscount = function (orderAmount) {
  let discount = 0;
  if (this.type === 'percentage') {
    discount = (orderAmount * this.value) / 100;
    if (this.maxDiscount) discount = Math.min(discount, this.maxDiscount);
  } else {
    discount = Math.min(this.value, orderAmount);
  }
  return Math.round(discount * 100) / 100;
};

module.exports = mongoose.model('PromoCode', promoCodeSchema);
