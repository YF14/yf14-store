/**
 * Permanently delete a user account by email (MongoDB only — no cascade to orders/cart).
 *
 * Usage (from backend/):
 *   npm run delete-user -- user@email.com
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const email = (process.argv[2] || '').trim().toLowerCase();

async function main() {
  if (!email) {
    console.error('Usage: npm run delete-user -- user@email.com');
    process.exit(1);
  }
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not set in .env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const res = await User.deleteOne({ email });
  await mongoose.disconnect();

  if (res.deletedCount === 0) {
    console.error(`No user found: ${email}`);
    process.exit(1);
  }
  console.log(`Deleted user: ${email}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
