const ImageKit = require('@imagekit/nodejs');
const multer = require('multer');
const path = require('path');

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// Use memory storage so we can pipe to ImageKit
const memoryStorage = multer.memoryStorage();

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only image files are allowed'), false);
};

const videoFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('video/')) cb(null, true);
  else cb(new Error('Only video files are allowed'), false);
};

const uploadProduct = multer({
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: imageFilter,
});

const uploadAvatar = multer({
  storage: memoryStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: imageFilter,
});

const uploadVideo = multer({
  storage: memoryStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: videoFilter,
});

// Upload a buffer to ImageKit and return { url, fileId }
const uploadToImageKit = (buffer, originalName, folder) => {
  const ext = path.extname(originalName) || '.jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  return imagekit.upload({
    file: buffer,
    fileName,
    folder,
    useUniqueFileName: false,
  });
};

// Delete a file from ImageKit by its fileId
const deleteFromImageKit = (fileId) => imagekit.deleteFile(fileId);

module.exports = {
  imagekit,
  uploadProduct,
  uploadAvatar,
  uploadVideo,
  uploadToImageKit,
  deleteFromImageKit,
};
