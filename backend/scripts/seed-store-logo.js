/**
 * One-off: upload a logo file to ImageKit and save URL in MongoDB (StoreSettings).
 * Requires MONGODB_URI + ImageKit env vars (same as the API).
 *
 * Usage: node scripts/seed-store-logo.js path/to/logo.png
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { uploadToImageKit } = require('../src/config/imagekit');
const StoreSettings = require('../src/models/StoreSettings');

async function main() {
  const filePath = process.argv[2];
  if (!filePath || !fs.existsSync(filePath)) {
    console.error('Usage: node scripts/seed-store-logo.js <path-to-image.png>');
    process.exit(1);
  }
  if (!process.env.MONGODB_URI) {
    console.error('Missing MONGODB_URI');
    process.exit(1);
  }
  const buf = fs.readFileSync(filePath);
  const name = path.basename(filePath);
  const result = await uploadToImageKit(buf, name, '/yf14-store/branding');
  const fileId = result.fileId || result.file_id;
  await mongoose.connect(process.env.MONGODB_URI);
  await StoreSettings.findOneAndUpdate(
    { key: 'site' },
    { $set: { logoUrl: result.url, logoFileId: fileId || '' } },
    { upsert: true, new: true }
  );
  console.log('Saved logoUrl:', result.url);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
