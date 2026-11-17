/**
 * Image processing: EXIF stripping and encryption
 */

import sharp from 'sharp';
import { readFile } from 'fs/promises';
import { extname } from 'path';

/**
 * Strip EXIF/GPS/XMP metadata from image by re-encoding
 * Returns safe JPEG/PNG with bounded size
 */
export async function stripImageMetadata(imagePath: string): Promise<Buffer> {
  const ext = extname(imagePath).toLowerCase();
  
  // Validate MIME type
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];
  if (!allowedExts.includes(ext)) {
    throw new Error(`Unsupported image format: ${ext}. Allowed: ${allowedExts.join(', ')}`);
  }
  
  const imageBuffer = await readFile(imagePath);
  
  // Re-encode with sharp to strip all metadata
  // NOTE: Do NOT call .withMetadata() - that preserves/adds metadata
  const pipeline = sharp(imageBuffer)
    .resize(2048, 2048, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  
  // Convert to appropriate format
  let output: Buffer;
  if (ext === '.png') {
    output = await pipeline.png({ quality: 90 }).toBuffer();
  } else if (ext === '.webp') {
    output = await pipeline.webp({ quality: 85 }).toBuffer();
  } else {
    // Default to JPEG for jpg/jpeg
    output = await pipeline.jpeg({ quality: 85, mozjpeg: true }).toBuffer();
  }
  
  // Enforce size limit (5MB)
  const MAX_SIZE = 5 * 1024 * 1024;
  if (output.length > MAX_SIZE) {
    throw new Error(`Image too large after processing: ${(output.length / 1024 / 1024).toFixed(2)}MB (max 5MB)`);
  }
  
  return output;
}

/**
 * Get MIME type from file extension
 */
export function getMimeType(ext: string): string {
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
  };
  return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
}
