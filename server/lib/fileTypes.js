export const MAX_FILE_BYTES = 10 * 1024 * 1024;

const SIGNATURES = {
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]],
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  // RIFF....WEBP; bytes 4-7 are the chunk size, so only check the fixed parts.
  "image/webp": [[0x52, 0x49, 0x46, 0x46, null, null, null, null, 0x57, 0x45, 0x42, 0x50]],
};

export const ALLOWED_MEDIA_TYPES = Object.keys(SIGNATURES);

export function matchesSignature(bytes, mediaType) {
  return (SIGNATURES[mediaType] || []).some((sig) => sig.every((b, i) => b === null || bytes[i] === b));
}
