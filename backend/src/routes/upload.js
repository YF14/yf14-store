const express = require('express');
const router = express.Router();
const { protect, requireAdminOrPermission } = require('../middleware/auth');
const StoreSettings = require('../models/StoreSettings');
const {
  uploadProduct,
  uploadAvatar,
  uploadLogo,
  uploadVideo,
  uploadToCloudflareImages,
  deleteCloudflareImage,
  uploadToCloudflareStream,
  deleteCloudflareStreamVideo,
} = require('../config/cloudflareMedia');
const cacheBust = require('../services/cacheInvalidation');

// Upload up to 10 product images → Cloudflare Images
router.post('/product', protect, requireAdminOrPermission('products'), uploadProduct.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    const uploads = await Promise.all(
      req.files.map((file, i) =>
        uploadToCloudflareImages(file.buffer, file.originalname).then((result) => ({
          url: result.url,
          fileId: result.fileId,
          alt: req.body.alt || '',
          isPrimary: i === 0,
        }))
      )
    );
    cacheBust.bustProducts();
    res.json({ images: uploads });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Store logo → Cloudflare Images + MongoDB
router.post('/store-logo', protect, requireAdminOrPermission('settings'), uploadLogo.single('logo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const prev = await StoreSettings.findOne({ key: 'site' });
    if (prev?.logoFileId) {
      try {
        await deleteCloudflareImage(prev.logoFileId);
      } catch (e) {
        // Old asset may already be deleted — continue
      }
    }
    const result = await uploadToCloudflareImages(req.file.buffer, req.file.originalname);
    await StoreSettings.findOneAndUpdate(
      { key: 'site' },
      { $set: { logoUrl: result.url, logoFileId: result.fileId || '' } },
      { upsert: true, new: true }
    );
    cacheBust.bustSettings();
    res.json({ logoUrl: result.url, fileId: result.fileId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload a single user avatar → Cloudflare Images
router.post('/avatar', protect, uploadAvatar.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const result = await uploadToCloudflareImages(req.file.buffer, req.file.originalname);
    res.json({ url: result.url, fileId: result.fileId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload a single product video → Cloudflare Stream (HLS playback URL)
router.post('/video', protect, requireAdminOrPermission('products'), uploadVideo.single('video'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const result = await uploadToCloudflareStream(req.file.buffer, req.file.originalname);
    res.json({
      url: result.url,
      fileId: result.fileId,
      thumbnail: result.thumbnail || '',
      readyToStream: result.readyToStream,
      resourceType: 'video',
    });
    cacheBust.bustProducts();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a product image by Cloudflare Images id (stored as fileId)
router.delete('/image', protect, requireAdminOrPermission('products'), async (req, res) => {
  try {
    const { fileId } = req.body;
    if (!fileId) return res.status(400).json({ error: 'fileId required' });
    await deleteCloudflareImage(fileId);
    cacheBust.bustProducts();
    res.json({ message: 'Image deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a product video by Stream uid (stored as fileId)
router.delete('/video', protect, requireAdminOrPermission('products'), async (req, res) => {
  try {
    const { fileId } = req.body;
    if (!fileId) return res.status(400).json({ error: 'fileId required' });
    await deleteCloudflareStreamVideo(fileId);
    cacheBust.bustProducts();
    res.json({ message: 'Video deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
