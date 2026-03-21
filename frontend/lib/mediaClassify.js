/**
 * Classify a File from <input type="file"> for product media uploads.
 * Browsers sometimes omit MIME types or use application/octet-stream (esp. Windows).
 */
export function classifyProductMediaFile(file) {
  const mime = (file.type || '').toLowerCase();
  const name = file.name || '';

  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('image/')) return 'image';

  if (/\.(mp4|m4v|webm|mov|mkv|avi|ogv|flv|wmv)$/i.test(name)) return 'video';
  if (/\.(jpe?g|png|gif|webp|avif|heic|heif|bmp|svg|tiff?)$/i.test(name)) return 'image';

  if (mime === 'application/octet-stream' || !mime) {
    return 'unknown';
  }

  return 'unknown';
}
