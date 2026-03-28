/**
 * Hard-deletes every Product and clears carts, wishlists, and promo product links.
 * Orders are kept (line items still have name/image snapshots); product refs become stale.
 *
 * Usage: node scripts/deleteAllProducts.js --yes
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const Cart = require('../src/models/Cart');
const User = require('../src/models/User');
const PromoCode = require('../src/models/PromoCode');

async function main() {
  if (!process.argv.includes('--yes')) {
    console.error('Refusing to run without --yes (destructive). Example: node scripts/deleteAllProducts.js --yes');
    process.exit(1);
  }
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not set');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  const del = await Product.deleteMany({});
  const carts = await Cart.updateMany({}, { $set: { items: [] } });
  const users = await User.updateMany({}, { $set: { wishlist: [] } });
  const promos = await PromoCode.updateMany({}, { $set: { applicableProducts: [] } });
  console.log(
    `Products deleted: ${del.deletedCount}. Carts modified: ${carts.modifiedCount}. ` +
      `Users (wishlist cleared): ${users.modifiedCount}. Promos (product list cleared): ${promos.modifiedCount}.`
  );
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
