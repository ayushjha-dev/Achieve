/**
 * Generates the predictable thumbnail file path for a given original file path.
 * e.g., "user_id/timestamp_filename.pdf" -> "user_id/timestamp_filename_thumb.jpg"
 */
export function getThumbnailPath(filePath: string): string {
  const lastDot = filePath.lastIndexOf('.');
  if (lastDot === -1) {
    return `${filePath}_thumb.jpg`;
  }
  return `${filePath.substring(0, lastDot)}_thumb.jpg`;
}
