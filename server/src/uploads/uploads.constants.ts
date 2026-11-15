export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export const IMAGE_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type ImageContentType = (typeof IMAGE_CONTENT_TYPES)[number];
