require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const EMAIL = 'yousifadnanx1@gmail.com';
const PASSWORD = 'Admin@123456';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  let user = await User.findOne({ email: EMAIL });
  if (user) {
    user.role = 'admin';
    user.isActive = true;
    user.password = PASSWORD;
    await user.save();
    console.log(`Updated existing user to admin: ${EMAIL}`);
  } else {
    user = await User.create({
      firstName: 'Yousif',
      lastName: 'Admin',
      email: EMAIL,
      password: PASSWORD,
      role: 'admin',
      isActive: true,
      isVerified: true,
    });
    console.log(`Created new admin user: ${EMAIL}`);
  }

  console.log('Admin credentials:');
  console.log(`  Email:    ${EMAIL}`);
  console.log(`  Password: ${PASSWORD}`);
  await mongoose.disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });
