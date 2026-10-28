const ALLOWED_IMAGE_HOSTS = new Set([
  'firebasestorage.googleapis.com',
  'lh3.googleusercontent.com',
]);

/** True when next/image is allowed to render this URL. */
export function isRenderableImageUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && ALLOWED_IMAGE_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}
