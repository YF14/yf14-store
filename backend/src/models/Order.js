const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  size: { type: String, required: true },
  color: { type: String, required: true },
  colorCode: String,
  quantity: { type: Number, required: true, min: 1 },
  variantId: mongoose.Schema.Types.ObjectId,
});

const shippingAddressSchema = new mongoose.Schema({
  firstName: String,
  lastName:  String,
  street:    String,
  city:      String,
  state:     String,
  zipCode:   String,
  country:   String,
  phone:     String,
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  guestInfo: {
    name:  String,
    phone: String,
    email: String,
    city:  String,
    town:  String,
  },
  items: [orderItemSchema],
  shippingAddress: shippingAddressSchema,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  statusHistory: [{
    status: String,
    note: String,
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  }],
  subtotal: { type: Number, required: true },
  shippingCost: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  promoCode: String,
  promoDiscount: { type: Number, default: 0 },
  paymentMethod: { type: String, default: 'stripe' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  stripePaymentIntentId: String,
  stripeChargeId: String,
  trackingNumber: String,
  shippingCarrier: String,
  estimatedDelivery: Date,
  deliveredAt: Date,
  notes: String,
  isGift: { type: Boolean, default: false },
  giftMessage: String,
}, { timestamps: true });

// Generate simple sequential order number
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const last = await mongoose.model('Order').findOne({}, { orderNumber: 1 }, { sort: { createdAt: -1 } });
    let nextNum = 1001;
    if (last?.orderNumber) {
      const num = parseInt(last.orderNumber.replace('#', ''), 10);
      if (!isNaN(num)) nextNum = num + 1;
    }
    this.orderNumber = `#${nextNum}`;
  }
  next();
});

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
