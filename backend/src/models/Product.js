const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  size: { type: String, required: true, enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'] },
  color: { type: String, required: true },
  colorCode: { type: String, default: '#000000' }, // hex color
  stock: { type: Number, required: true, default: 0, min: 0 },
  sku: { type: String, unique: true, sparse: true },
  price: Number, // override product price if needed
});

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, trim: true },
  body: { type: String, required: true, trim: true },
  verified: { type: Boolean, default: false }, // verified purchase
  helpful: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, required: true },
  shortDescription: { type: String },
  price: { type: Number, required: true, min: 0 },
  comparePrice: { type: Number }, // original price (for sale)
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  tags: [String],
  images: [{
    url: { type: String, required: true },
    publicId: String,
    alt: String,
    isPrimary: { type: Boolean, default: false },
  }],
  variants: [variantSchema],
  reviews: [reviewSchema],
  averageRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  totalSold: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false },
  isBestSeller: { type: Boolean, default: false },
  material: String,
  careInstructions: String,
  seoTitle: String,
  seoDescription: String,
  weight: Number, // in grams for shipping
}, { timestamps: true });

// Indexes
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ averageRating: -1 });
productSchema.index({ totalSold: -1 });
productSchema.index({ createdAt: -1 });

// Calculate average rating
productSchema.methods.calculateRating = function () {
  if (this.reviews.length === 0) {
    this.averageRating = 0;
    this.reviewCount = 0;
  } else {
    const sum = this.reviews.reduce((acc, r) => acc + r.rating, 0);
    this.averageRating = Math.round((sum / this.reviews.length) * 10) / 10;
    this.reviewCount = this.reviews.length;
  }
};

// Get total stock
productSchema.virtual('totalStock').get(function () {
  return this.variants.reduce((sum, v) => sum + v.stock, 0);
});

// Discount percentage
productSchema.virtual('discountPercentage').get(function () {
  if (this.comparePrice && this.comparePrice > this.price) {
    return Math.round(((this.comparePrice - this.price) / this.comparePrice) * 100);
  }
  return 0;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
