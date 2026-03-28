const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  nameAr: { type: String, trim: true, default: '' },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: String,
  image: { url: String, publicId: String },
  /** Optional emoji shown in admin category list */
  icon: { type: String, default: '', trim: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  /** Short label shown in admin (e.g. SALE, NEW) — optional storefront use later */
  flag: { type: String, default: '', trim: true, maxlength: 32 },
  /** Highlight category in admin / future nav emphasis */
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  /**
   * Hidden categories are admin-only. They never appear in storefront navigation,
   * search results, filters, or public API responses. Products tagged to a hidden
   * category receive unlimited stock (stock deduction is skipped on orders).
   */
  isHidden: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
  seoTitle: String,
  seoDescription: String,
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

categorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent',
});

module.exports = mongoose.model('Category', categorySchema);
