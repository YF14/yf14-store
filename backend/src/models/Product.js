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
  description: { type: String, default: '' },
  shortDescription: { type: String },
  price: { type: Number, required: true, min: 0 },
  comparePrice: { type: Number }, // original price (for sale)
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  /** Display order within category (lower = earlier). Used on shop when sorting by category order. */
  categorySortOrder: { type: Number, default: 0 },
  /** Order on /sale when sorting by sale order (admin “Sales” panel). */
  saleSortOrder: { type: Number, default: 0 },
  /** Order on /featured when sorting by curated order (admin Featured panel). */
  featuredSortOrder: { type: Number, default: 0 },
  /** Order on /new-arrivals when sorting by curated order (admin New arrivals panel). */
  newArrivalSortOrder: { type: Number, default: 0 },
  /** Set when any variant stock is updated (admin stock page ordering). */
  lastStockUpdateAt: { type: Date },
  tags: [String],
  images: [{
    url: { type: String, required: true },
    publicId: String,
    fileId: String,
    alt: String,
    isPrimary: { type: Boolean, default: false },
    /** Empty = shared for all colors; otherwise must match variant `color` name. */
    color: { type: String, default: '', trim: true },
  }],
  videos: [{
    url: { type: String, required: true },
    fileId: String,
    thumbnail: String,
    color: { type: String, default: '', trim: true },
  }],
  variants: [variantSchema],
  reviews: [reviewSchema],
  averageRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  totalSold: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false },
  /** Legacy; sale listing and badges use comparePrice > price only. */
  isOnSale: { type: Boolean, default: false },
  isBestSeller: { type: Boolean, default: false },
  material: String,
  careInstructions: String,
  seoTitle: String,
  seoDescription: String,
  weight: Number, // in grams for shipping
  /**
   * Admin-only: IDs of hidden categories this product is tagged to.
   * While non-empty the product has unlimited stock (order deduction skipped).
   * Never exposed in public API responses.
   */
  hiddenCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
}, { timestamps: true });

// Indexes
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ category: 1, categorySortOrder: 1 });
productSchema.index({ saleSortOrder: 1 });
productSchema.index({ isFeatured: 1, featuredSortOrder: 1 });
productSchema.index({ isNewArrival: 1, newArrivalSortOrder: 1 });
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
