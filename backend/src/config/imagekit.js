const ImageKit = require('@imagekit/nodejs');
const multer = require('multer');
const path = require('path');

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

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
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: imageFilter,
});

const uploadAvatar = multer({
  storage: memoryStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
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
  uploadVideo,
  uploadToImageKit,
  deleteFromImageKit,
};
