/**
 * Image processing utilities
 * - EXIF stripping
 * - Image compression
 * - Encryption preparation
 */

/**
 * Strip EXIF data from image file
 * Creates a canvas, draws the image, and returns a new blob without metadata
 */
export async function stripExifData(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw image
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      
      // Convert to blob (this strips EXIF)
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      }, file.type || 'image/jpeg', 0.9);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

/**
 * Read file as ArrayBuffer
 */
export function readFileAsArrayBuffer(file: File | Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as ArrayBuffer'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Convert ArrayBuffer to Blob URL
 */
export function arrayBufferToBlobUrl(buffer: ArrayBuffer, type: string = 'image/jpeg'): string {
  const blob = new Blob([buffer], { type });
  return URL.createObjectURL(blob);
}

/**
 * Revoke blob URL
 */
export function revokeBlobUrl(url: string) {
  URL.revokeObjectURL(url);
}
