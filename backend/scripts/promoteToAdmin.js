/**
 * Promote an existing account to full admin (super admin) without changing password.
 *
 * Usage (from backend/):
 *   npm run promote-admin -- you@email.com
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const email = (process.argv[2] || '').trim().toLowerCase();

async function main() {
  if (!email) {
    console.error('Usage: npm run promote-admin -- user@email.com');
    process.exit(1);
  }
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not set in .env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOne({ email });
  if (!user) {
    console.error(`No user found with email: ${email}`);
    console.error('They must register first, or run: npm run create-admin -- email@example.com Password');
    await mongoose.disconnect();
    process.exit(1);
  }

  user.role = 'admin';
  user.adminPermissions = [];
  user.isActive = true;
  user.isVerified = true;
  await user.save();

  console.log(`OK — ${email} is now admin (full access).`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
