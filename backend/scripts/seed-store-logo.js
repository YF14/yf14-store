/**
 * One-off: upload a logo file to Cloudflare Images and save URL in MongoDB (StoreSettings).
 * Requires MONGODB_URI + Cloudflare env vars (same as the API).
 *
 * Usage: node scripts/seed-store-logo.js path/to/logo.png
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { uploadToCloudflareImages } = require('../src/config/cloudflareMedia');
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
  const result = await uploadToCloudflareImages(buf, name);
  const fileId = result.fileId;
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
