/**
 * Promote or create an admin user (does not wipe the database — unlike npm run seed).
 *
 * Usage (from backend/):
 *   npm run create-admin -- you@email.com YourSecurePassword
 * Or set in .env:
 *   ADMIN_EMAIL=you@email.com
 *   ADMIN_PASSWORD=YourSecurePassword
 *   npm run create-admin
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const email = (process.argv[2] || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = process.argv[3] || process.env.ADMIN_PASSWORD;
const firstName = process.env.ADMIN_FIRST_NAME || 'Admin';
const lastName = process.env.ADMIN_LAST_NAME || 'User';

async function main() {
  if (!email || !password) {
    console.error(
      'Missing email or password.\n\n' +
        'Option A — CLI (from backend folder):\n' +
        '  npm run create-admin -- your@email.com YourSecurePassword\n\n' +
        'Option B — .env then:\n' +
        '  ADMIN_EMAIL=your@email.com\n' +
        '  ADMIN_PASSWORD=YourSecurePassword\n' +
        '  npm run create-admin\n',
    );
    process.exit(1);
  }

  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not set in .env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  let user = await User.findOne({ email });
  if (user) {
    user.role = 'admin';
    user.isActive = true;
    user.isVerified = true;
    user.password = password;
    await user.save();
    console.log(`Updated existing user to admin: ${email}`);
  } else {
    await User.create({
      firstName,
      lastName,
      email,
      password,
      role: 'admin',
      isActive: true,
      isVerified: true,
    });
    console.log(`Created new admin user: ${email}`);
  }

  console.log('Done. Log in on the storefront, then open /admin.');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
