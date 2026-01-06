/**
 * Normalizes a URL by adding https:// protocol if missing
 * @param url - The URL input from user
 * @returns Normalized URL with proper protocol
 */
export function normalizeUrl(url: string): string {
  if (!url) return url;

  const trimmedUrl = url.trim();

  // If it's already a full URL with protocol, return as is
  if (/^https?:\/\//i.test(trimmedUrl)) {
    return trimmedUrl;
  }

  // If it starts with www. or contains a dot (domain), add https://
  if (/^www\.|\./.test(trimmedUrl)) {
    return `https://${trimmedUrl}`;
  }

  // For other cases, return as is (might be relative links, anchors, etc.)
  return trimmedUrl;
}
