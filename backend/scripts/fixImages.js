require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Product = require('../src/models/Product');

// Proper dress images from Unsplash (verified dress photos)
const imageUpdates = {
  'velvet-midnight-gown': [
    { url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=85', alt: 'Velvet Midnight Gown', isPrimary: true },
    { url: 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?w=800&q=85', alt: 'Velvet Midnight Gown back' },
  ],
  'crystal-embellished-evening-dress': [
    { url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=85', alt: 'Crystal Evening Dress', isPrimary: true },
    { url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&q=85', alt: 'Crystal Evening Dress detail' },
  ],
  'silk-off-shoulder-gown': [
    { url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=85', alt: 'Silk Off-Shoulder Gown', isPrimary: true },
    { url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=85', alt: 'Silk Gown side view' },
  ],
  'sequin-mini-cocktail-dress': [
    { url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=85', alt: 'Sequin Cocktail Dress', isPrimary: true },
    { url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=85', alt: 'Sequin Dress detail' },
  ],
  'wrap-midi-cocktail-dress': [
    { url: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&q=85', alt: 'Wrap Midi Dress', isPrimary: true },
    { url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=85', alt: 'Wrap Dress back' },
  ],
  'floral-chiffon-maxi-dress': [
    { url: 'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=800&q=85', alt: 'Floral Chiffon Maxi', isPrimary: true },
    { url: 'https://images.unsplash.com/photo-1485518994671-5b0492955069?w=800&q=85', alt: 'Floral Maxi detail' },
  ],
  'satin-slip-maxi-dress': [
    { url: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=800&q=85', alt: 'Satin Slip Maxi Dress', isPrimary: true },
    { url: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=800&q=85', alt: 'Satin Dress side' },
  ],
  'lace-bodycon-mini-dress': [
    { url: 'https://images.unsplash.com/photo-1604014137671-64e9a79e2e39?w=800&q=85', alt: 'Lace Bodycon Mini Dress', isPrimary: true },
    { url: 'https://images.unsplash.com/photo-1612336307429-8a898d10e223?w=800&q=85', alt: 'Lace Dress detail' },
  ],
  'puff-sleeve-mini-dress': [
    { url: 'https://images.unsplash.com/photo-1594938298603-c8148c4b4d56?w=800&q=85', alt: 'Puff Sleeve Mini Dress', isPrimary: true },
    { url: 'https://images.unsplash.com/photo-1467043237213-65f2da53396f?w=800&q=85', alt: 'Puff Sleeve detail' },
  ],
  'ribbed-knit-midi-dress': [
    { url: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800&q=85', alt: 'Ribbed Knit Midi Dress', isPrimary: true },
    { url: 'https://images.unsplash.com/photo-1600717535275-0b18ede2f7fc?w=800&q=85', alt: 'Knit Dress side' },
  ],
  'denim-shirt-dress': [
    { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=85', alt: 'Denim Shirt Dress', isPrimary: true },
    { url: 'https://images.unsplash.com/photo-1542295669297-4d352b042bca?w=800&q=85', alt: 'Denim Dress detail' },
  ],
  'linen-sundress': [
    { url: 'https://images.unsplash.com/photo-1623609163859-ca93c959b98a?w=800&q=85', alt: 'Linen Sundress', isPrimary: true },
    { url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=85', alt: 'Linen Sundress back' },
  ],
  'floral-wrap-sundress': [
    { url: 'https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?w=800&q=85', alt: 'Floral Wrap Sundress', isPrimary: true },
    { url: 'https://images.unsplash.com/photo-1487147264018-f937fba0c817?w=800&q=85', alt: 'Floral Sundress detail' },
  ],
};

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected');

  for (const [slug, images] of Object.entries(imageUpdates)) {
    const result = await Product.findOneAndUpdate({ slug }, { $set: { images } }, { new: true });
    if (result) {
      console.log(`Updated: ${result.name}`);
    } else {
      console.log(`Not found: ${slug}`);
    }
  }

  console.log('\nAll images updated!');
  process.exit(0);
}

fix().catch(err => { console.error(err); process.exit(1); });
