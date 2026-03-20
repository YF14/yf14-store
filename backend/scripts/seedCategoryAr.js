require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../src/models/Category');

const AR_NAMES = {
  'Evening Dresses': 'فساتين سهرة',
  'Cocktail Dresses': 'فساتين كوكتيل',
  'Maxi Dresses': 'فساتين طويلة',
  'Mini Dresses': 'فساتين قصيرة',
  'Casual Dresses': 'فساتين كاجوال',
  'Summer Dresses': 'فساتين صيفية',
};

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const categories = await Category.find();
  let updated = 0;

  for (const cat of categories) {
    const arName = AR_NAMES[cat.name];
    if (arName && cat.nameAr !== arName) {
      cat.nameAr = arName;
      await cat.save();
      console.log(`  ✓ ${cat.name} → ${arName}`);
      updated++;
    }
  }

  console.log(`\nDone: ${updated} categories updated with Arabic names.`);
  await mongoose.disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });
