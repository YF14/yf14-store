const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const StoreSettings = require('../models/StoreSettings');
const {
  uploadProduct,
  uploadAvatar,
  uploadLogo,
  uploadVideo,
  uploadToImageKit,
  deleteFromImageKit,
} = require('../config/imagekit');

// Upload up to 10 product images
router.post('/product', protect, adminOnly, uploadProduct.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    const uploads = await Promise.all(
      req.files.map((file, i) =>
        uploadToImageKit(file.buffer, file.originalname, '/yf14-store/products').then((result) => ({
          url: result.url,
          fileId: result.fileId,
          alt: req.body.alt || '',
          isPrimary: i === 0,
        }))
      )
    );
    res.json({ images: uploads });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Store logo → ImageKit + MongoDB (replaces previous logo file when possible)
router.post('/store-logo', protect, adminOnly, uploadLogo.single('logo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const prev = await StoreSettings.findOne({ key: 'site' });
    if (prev?.logoFileId) {
      try {
        await deleteFromImageKit(prev.logoFileId);
      } catch (e) {
        // Old asset may already be deleted — continue
      }
    }
    const result = await uploadToImageKit(req.file.buffer, req.file.originalname, '/yf14-store/branding');
    const fileId = result.fileId || result.file_id;
    await StoreSettings.findOneAndUpdate(
      { key: 'site' },
      { $set: { logoUrl: result.url, logoFileId: fileId || '' } },
      { upsert: true, new: true }
    );
    res.json({ logoUrl: result.url, fileId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload a single user avatar
router.post('/avatar', protect, uploadAvatar.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const result = await uploadToImageKit(req.file.buffer, req.file.originalname, '/yf14-store/avatars');
    res.json({ url: result.url, fileId: result.fileId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload a single product video
router.post('/video', protect, adminOnly, uploadVideo.single('video'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const result = await uploadToImageKit(req.file.buffer, req.file.originalname, '/yf14-store/videos');
    res.json({ url: result.url, fileId: result.fileId, resourceType: 'video' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete an image by fileId
router.delete('/image', protect, adminOnly, async (req, res) => {
  try {
    const { fileId } = req.body;
    if (!fileId) return res.status(400).json({ error: 'fileId required' });
    await deleteFromImageKit(fileId);
    res.json({ message: 'Image deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a video by fileId
router.delete('/video', protect, adminOnly, async (req, res) => {
  try {
    const { fileId } = req.body;
    if (!fileId) return res.status(400).json({ error: 'fileId required' });
    await deleteFromImageKit(fileId);
    res.json({ message: 'Video deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
