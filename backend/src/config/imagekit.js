const ImageKit = require('@imagekit/nodejs');
const multer = require('multer');
const path = require('path');

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

const memoryStorage = multer.memoryStorage();

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.heic', '.heif', '.bmp', '.svg', '.tif', '.tiff']);
const VIDEO_EXT = new Set(['.mp4', '.m4v', '.webm', '.mov', '.mkv', '.avi', '.ogv', '.flv', '.wmv']);

const imageFilter = (req, file, cb) => {
  const mime = (file.mimetype || '').toLowerCase();
  if (mime.startsWith('video/')) {
    return cb(new Error('Only image files are allowed'), false);
  }
  if (mime.startsWith('image/')) return cb(null, true);
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (IMAGE_EXT.has(ext)) return cb(null, true);
  cb(new Error('Only image files are allowed'), false);
};

const videoFilter = (req, file, cb) => {
  const mime = (file.mimetype || '').toLowerCase();
  if (mime.startsWith('image/')) {
    return cb(new Error('Only video files are allowed'), false);
  }
  if (mime.startsWith('video/')) return cb(null, true);
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (VIDEO_EXT.has(ext)) return cb(null, true);
  cb(new Error('Only video files are allowed'), false);
};

const uploadProduct = multer({
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: imageFilter,
});

const uploadAvatar = multer({
  storage: memoryStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: imageFilter,
});

/** Store logo / branding (larger than avatar). */
const uploadLogo = multer({
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter,
});

const uploadVideo = multer({
  storage: memoryStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: videoFilter,
});

const uploadToImageKit = async (buffer, originalName, folder) => {
  const ext = path.extname(originalName) || '.jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const result = await imagekit.files.upload({
    file: buffer.toString('base64'),
    fileName,
    folder,
    useUniqueFileName: false,
  });
  return result;
};

const deleteFromImageKit = (fileId) => imagekit.files.delete(fileId);

module.exports = {
  imagekit,
  uploadProduct,
  uploadAvatar,
  uploadLogo,
  uploadVideo,
  uploadToImageKit,
  deleteFromImageKit,
};
