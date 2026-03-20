require('dotenv').config();
const mongoose = require('mongoose');
const Color = require('../src/models/Color');

const DEFAULT_COLORS = [
  { name: 'Black', code: '#000000' },
  { name: 'White', code: '#FFFFFF' },
  { name: 'Red', code: '#DC2626' },
  { name: 'Blue', code: '#2563EB' },
  { name: 'Pink', code: '#EC4899' },
  { name: 'Green', code: '#16A34A' },
  { name: 'Beige', code: '#D4A574' },
  { name: 'Navy', code: '#1E3A5F' },
  { name: 'Gold', code: '#C9A96E' },
  { name: 'Gray', code: '#6B7280' },
  { name: 'Brown', code: '#92400E' },
  { name: 'Purple', code: '#7C3AED' },
  { name: 'Orange', code: '#EA580C' },
  { name: 'Yellow', code: '#CA8A04' },
  { name: 'Maroon', code: '#7F1D1D' },
  { name: 'Olive', code: '#4D7C0F' },
  { name: 'Teal', code: '#0D9488' },
  { name: 'Coral', code: '#F97316' },
  { name: 'Burgundy', code: '#881337' },
  { name: 'Cream', code: '#FFFDD0' },
  { name: 'Khaki', code: '#BDB76B' },
  { name: 'Lavender', code: '#A78BFA' },
  { name: 'Peach', code: '#FDBA74' },
  { name: 'Silver', code: '#C0C0C0' },
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  let added = 0;
  let skipped = 0;

  for (const color of DEFAULT_COLORS) {
    const exists = await Color.findOne({ name: color.name });
    if (exists) {
      skipped++;
    } else {
      await Color.create(color);
      added++;
      console.log(`  + ${color.name} (${color.code})`);
    }
  }

  console.log(`\nDone: ${added} colors added, ${skipped} already existed.`);
  const total = await Color.countDocuments();
  console.log(`Total colors in palette: ${total}`);
  await mongoose.disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });
