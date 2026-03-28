const multer = require('multer');
const path = require('path');

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

const CF_API = 'https://api.cloudflare.com/client/v4';

const CONTENT_TYPE_BY_EXT = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp',
  '.tif': 'image/tiff',
  '.tiff': 'image/tiff',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
  '.mp4': 'video/mp4',
  '.m4v': 'video/x-m4v',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.mkv': 'video/x-matroska',
  '.avi': 'video/x-msvideo',
  '.ogv': 'video/ogg',
  '.flv': 'video/x-flv',
  '.wmv': 'video/x-ms-wmv',
};

function guessContentType(originalName) {
  const ext = path.extname(originalName || '').toLowerCase();
  return CONTENT_TYPE_BY_EXT[ext] || 'application/octet-stream';
}

function requireAccount() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !token) {
    throw new Error('Cloudflare: set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN');
  }
  return { accountId, token };
}

function imageDeliveryUrl(imageId, variantName = 'public') {
  const hash = process.env.CLOUDFLARE_IMAGES_ACCOUNT_HASH;
  if (!hash || !imageId) return null;
  return `https://imagedelivery.net/${hash}/${encodeURIComponent(imageId)}/${variantName}`;
}

function parseCfError(json, fallback) {
  const parts = json?.errors?.map((e) => e.message).filter(Boolean);
  return parts?.length ? parts.join('; ') : fallback;
}

/**
 * Cloudflare Images — returns { url, fileId } (fileId = image id for DELETE).
 */
async function uploadToCloudflareImages(buffer, originalName) {
  const { accountId, token } = requireAccount();
  const ext = path.extname(originalName || '') || '.jpg';
  const filename = originalName || `upload${ext}`;
  const blob = new Blob([buffer], { type: guessContentType(originalName) });
  const form = new FormData();
  form.append('file', blob, filename);

  const res = await fetch(`${CF_API}/accounts/${accountId}/images/v1`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(parseCfError(json, res.statusText || 'Images upload failed'));
  }
  const r = json.result;
  let url = Array.isArray(r.variants) && r.variants.length ? r.variants[0] : null;
  if (!url) url = imageDeliveryUrl(r.id);
  if (!url) {
    throw new Error('Cloudflare Images: no variant URL in response; set CLOUDFLARE_IMAGES_ACCOUNT_HASH');
  }
  return { url, fileId: r.id };
}

async function deleteCloudflareImage(imageId) {
  if (!imageId) throw new Error('Missing image id');
  const { accountId, token } = requireAccount();
  const res = await fetch(`${CF_API}/accounts/${accountId}/images/v1/${encodeURIComponent(imageId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(parseCfError(json, res.statusText || 'Images delete failed'));
  }
}

/**
 * Cloudflare Stream — returns { url (HLS), fileId (uid), thumbnail }.
 */
async function uploadToCloudflareStream(buffer, originalName) {
  const { accountId, token } = requireAccount();
  const ext = path.extname(originalName || '') || '.mp4';
  const filename = originalName || `video${ext}`;
  const blob = new Blob([buffer], { type: guessContentType(originalName) });
  const form = new FormData();
  form.append('file', blob, filename);

  const res = await fetch(`${CF_API}/accounts/${accountId}/stream`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(parseCfError(json, res.statusText || 'Stream upload failed'));
  }
  const r = json.result;
  const hls = r.playback?.hls || r.playback?.hlsURL || r.hls;
  if (!hls) {
    throw new Error('Cloudflare Stream: missing HLS playback URL in API response');
  }
  const thumbnail = typeof r.thumbnail === 'string' ? r.thumbnail : '';
  return { url: hls, fileId: r.uid, thumbnail, readyToStream: !!r.readyToStream };
}

async function deleteCloudflareStreamVideo(uid) {
  if (!uid) throw new Error('Missing video uid');
  const { accountId, token } = requireAccount();
  const res = await fetch(`${CF_API}/accounts/${accountId}/stream/${encodeURIComponent(uid)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(parseCfError(json, res.statusText || 'Stream delete failed'));
  }
}

module.exports = {
  uploadProduct,
  uploadAvatar,
  uploadLogo,
  uploadVideo,
  uploadToCloudflareImages,
  deleteCloudflareImage,
  uploadToCloudflareStream,
  deleteCloudflareStreamVideo,
};
