require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');
};

const categories = [
  { name: 'Evening Dresses', slug: 'evening-dresses', description: 'Elegant evening wear for special occasions' },
  { name: 'Casual Dresses', slug: 'casual-dresses', description: 'Effortless everyday style' },
  { name: 'Cocktail Dresses', slug: 'cocktail-dresses', description: 'Perfect for parties and events' },
  { name: 'Maxi Dresses', slug: 'maxi-dresses', description: 'Floor-length elegance' },
  { name: 'Mini Dresses', slug: 'mini-dresses', description: 'Bold and confident short styles' },
  { name: 'Summer Dresses', slug: 'summer-dresses', description: 'Light and breezy warm-weather styles' },
];

const seed = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});

    // Create admin
    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: process.env.ADMIN_EMAIL || 'admin@maisonelara.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123456',
      role: 'admin',
      isVerified: true,
    });
    console.log('✅ Admin created:', admin.email);

    // Create categories
    const createdCategories = await Category.insertMany(categories);
    console.log('✅ Categories created:', createdCategories.length);

    // Create sample products
    const products = [
      {
        name: 'Velvet Midnight Gown',
        slug: 'velvet-midnight-gown',
        description: 'An opulent velvet evening gown with a sweeping train and delicate off-shoulder neckline. Crafted from the finest Italian velvet, this piece embodies timeless luxury.',
        shortDescription: 'Off-shoulder velvet evening gown with sweeping train',
        price: 485,
        comparePrice: 650,
        category: createdCategories[0]._id,
        tags: ['evening', 'velvet', 'luxury', 'black'],
        images: [
          { url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800', alt: 'Velvet Midnight Gown', isPrimary: true },
          { url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800', alt: 'Velvet Midnight Gown Detail' },
        ],
        variants: [
          { size: 'XS', color: 'Midnight Black', colorCode: '#0a0a0a', stock: 3 },
          { size: 'S', color: 'Midnight Black', colorCode: '#0a0a0a', stock: 5 },
          { size: 'M', color: 'Midnight Black', colorCode: '#0a0a0a', stock: 4 },
          { size: 'L', color: 'Midnight Black', colorCode: '#0a0a0a', stock: 2 },
          { size: 'XL', color: 'Midnight Black', colorCode: '#0a0a0a', stock: 1 },
          { size: 'S', color: 'Deep Burgundy', colorCode: '#722F37', stock: 5 },
          { size: 'M', color: 'Deep Burgundy', colorCode: '#722F37', stock: 3 },
          { size: 'L', color: 'Deep Burgundy', colorCode: '#722F37', stock: 2 },
        ],
        isFeatured: true,
        isBestSeller: true,
        material: '100% Italian Velvet',
        careInstructions: 'Dry clean only',
      },
      {
        name: 'Silk Reverie Slip Dress',
        slug: 'silk-reverie-slip-dress',
        description: 'Whisper-soft silk charmeuse falls in liquid drapes. A minimalist statement piece that transitions effortlessly from day to evening.',
        shortDescription: 'Minimalist silk charmeuse slip dress',
        price: 285,
        category: createdCategories[1]._id,
        tags: ['silk', 'minimalist', 'slip dress', 'champagne'],
        images: [
          { url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800', alt: 'Silk Reverie Slip Dress', isPrimary: true },
        ],
        variants: [
          { size: 'XS', color: 'Champagne', colorCode: '#F7E7CE', stock: 6 },
          { size: 'S', color: 'Champagne', colorCode: '#F7E7CE', stock: 8 },
          { size: 'M', color: 'Champagne', colorCode: '#F7E7CE', stock: 7 },
          { size: 'L', color: 'Champagne', colorCode: '#F7E7CE', stock: 4 },
          { size: 'S', color: 'Blush Rose', colorCode: '#FFB6C1', stock: 6 },
          { size: 'M', color: 'Blush Rose', colorCode: '#FFB6C1', stock: 5 },
        ],
        isFeatured: true,
        isNewArrival: true,
        material: '100% Silk Charmeuse',
        careInstructions: 'Hand wash cold or dry clean',
      },
      {
        name: 'Lace Reverie Cocktail Dress',
        slug: 'lace-reverie-cocktail-dress',
        description: 'Intricate French lace overlay on a structured silhouette. Perfect for your next soirée, this dress balances sophistication with feminine charm.',
        shortDescription: 'French lace overlay cocktail dress',
        price: 320,
        comparePrice: 420,
        category: createdCategories[2]._id,
        tags: ['lace', 'cocktail', 'ivory', 'french'],
        images: [
          { url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800', alt: 'Lace Reverie Cocktail Dress', isPrimary: true },
        ],
        variants: [
          { size: 'XS', color: 'Ivory', colorCode: '#FFFFF0', stock: 4 },
          { size: 'S', color: 'Ivory', colorCode: '#FFFFF0', stock: 6 },
          { size: 'M', color: 'Ivory', colorCode: '#FFFFF0', stock: 5 },
          { size: 'L', color: 'Ivory', colorCode: '#FFFFF0', stock: 3 },
          { size: 'S', color: 'Dusty Rose', colorCode: '#DCAE96', stock: 4 },
          { size: 'M', color: 'Dusty Rose', colorCode: '#DCAE96', stock: 3 },
        ],
        isFeatured: true,
        material: 'French Lace over Silk Lining',
        careInstructions: 'Dry clean only',
      },
      {
        name: 'Floral Reverie Maxi',
        slug: 'floral-reverie-maxi',
        description: 'Hand-painted floral print on flowing chiffon. This maxi dress captures the essence of a Mediterranean summer in every detail.',
        shortDescription: 'Hand-painted floral chiffon maxi dress',
        price: 245,
        category: createdCategories[3]._id,
        tags: ['floral', 'maxi', 'chiffon', 'summer', 'boho'],
        images: [
          { url: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=800', alt: 'Floral Reverie Maxi', isPrimary: true },
        ],
        variants: [
          { size: 'XS', color: 'Garden Bloom', colorCode: '#E8C5B0', stock: 5 },
          { size: 'S', color: 'Garden Bloom', colorCode: '#E8C5B0', stock: 8 },
          { size: 'M', color: 'Garden Bloom', colorCode: '#E8C5B0', stock: 7 },
          { size: 'L', color: 'Garden Bloom', colorCode: '#E8C5B0', stock: 5 },
          { size: 'XL', color: 'Garden Bloom', colorCode: '#E8C5B0', stock: 3 },
        ],
        isNewArrival: true,
        material: '100% Chiffon',
        careInstructions: 'Hand wash or gentle machine wash',
      },
      {
        name: 'Crystal Shift Mini',
        slug: 'crystal-shift-mini',
        description: 'Embellished with hand-sewn crystals along the neckline. A modern mini dress that commands attention with understated luxury.',
        shortDescription: 'Crystal-embellished shift mini dress',
        price: 385,
        category: createdCategories[4]._id,
        tags: ['crystal', 'mini', 'party', 'embellished'],
        images: [
          { url: 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=800', alt: 'Crystal Shift Mini', isPrimary: true },
        ],
        variants: [
          { size: 'XS', color: 'Pearl White', colorCode: '#F0EAD6', stock: 3 },
          { size: 'S', color: 'Pearl White', colorCode: '#F0EAD6', stock: 5 },
          { size: 'M', color: 'Pearl White', colorCode: '#F0EAD6', stock: 4 },
          { size: 'L', color: 'Pearl White', colorCode: '#F0EAD6', stock: 2 },
          { size: 'S', color: 'Midnight Black', colorCode: '#0a0a0a', stock: 4 },
          { size: 'M', color: 'Midnight Black', colorCode: '#0a0a0a', stock: 3 },
        ],
        isFeatured: true,
        isBestSeller: true,
        material: 'Crepe with Crystal Embellishments',
        careInstructions: 'Dry clean only',
      },
      {
        name: 'Breezy Linen Summer Dress',
        slug: 'breezy-linen-summer-dress',
        description: 'Relaxed linen in a flattering A-line silhouette. Simple, breathable, and effortlessly chic for sun-drenched days.',
        shortDescription: 'Relaxed A-line linen summer dress',
        price: 165,
        category: createdCategories[5]._id,
        tags: ['linen', 'summer', 'casual', 'a-line'],
        images: [
          { url: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800', alt: 'Breezy Linen Summer Dress', isPrimary: true },
        ],
        variants: [
          { size: 'XS', color: 'Sand Beige', colorCode: '#C2B280', stock: 10 },
          { size: 'S', color: 'Sand Beige', colorCode: '#C2B280', stock: 12 },
          { size: 'M', color: 'Sand Beige', colorCode: '#C2B280', stock: 10 },
          { size: 'L', color: 'Sand Beige', colorCode: '#C2B280', stock: 8 },
          { size: 'XL', color: 'Sand Beige', colorCode: '#C2B280', stock: 5 },
          { size: 'S', color: 'Sky Blue', colorCode: '#87CEEB', stock: 8 },
          { size: 'M', color: 'Sky Blue', colorCode: '#87CEEB', stock: 7 },
          { size: 'L', color: 'Sky Blue', colorCode: '#87CEEB', stock: 5 },
        ],
        isNewArrival: true,
        totalSold: 45,
        material: '100% Linen',
        careInstructions: 'Machine wash cold',
      },
    ];

    const createdProducts = await Product.insertMany(products);
    console.log('✅ Products created:', createdProducts.length);

    // Create promo code
    const PromoCode = require('../models/PromoCode');
    await PromoCode.create({
      code: 'WELCOME15',
      description: '15% off your first order',
      type: 'percentage',
      value: 15,
      minOrderAmount: 50,
      maxDiscount: 100,
      perUserLimit: 1,
    });
    console.log('✅ Promo code created: WELCOME15');

    console.log('\n🎉 Database seeded successfully!');
    console.log(`   Admin: ${admin.email} / ${process.env.ADMIN_PASSWORD || 'Admin@123456'}`);
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seed();
