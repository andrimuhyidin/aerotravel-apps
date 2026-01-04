/**
 * Photo Upload Utilities with Compression
 * Client-side image compression before upload
 */

import { logger } from '@/lib/utils/logger';

export type UploadProgress = {
  loaded: number;
  total: number;
  percentage: number;
};

export type UploadResult = {
  success: boolean;
  url?: string;
  error?: string;
};

/**
 * Compress image using Canvas API
 */
export async function compressImage(
  file: File,
  maxWidth = 1920,
  maxHeight = 1920,
  quality = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }
        
        // Create canvas and compress
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      if (typeof e.target?.result === 'string') {
        img.src = e.target.result;
      } else {
        reject(new Error('Invalid file data'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Upload image with progress tracking
 */
export async function uploadImage(
  file: File | Blob,
  endpoint: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress({
            loaded: e.loaded,
            total: e.total,
            percentage: Math.round((e.loaded / e.total) * 100),
          });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText) as { url?: string; success?: boolean };
            resolve({
              success: true,
              url: response.url,
            });
          } catch {
            resolve({
              success: true,
            });
          }
        } else {
          resolve({
            success: false,
            error: `Upload failed: ${xhr.statusText}`,
          });
        }
      });

      xhr.addEventListener('error', () => {
        resolve({
          success: false,
          error: 'Network error during upload',
        });
      });

      xhr.addEventListener('abort', () => {
        resolve({
          success: false,
          error: 'Upload cancelled',
        });
      });

      xhr.open('POST', endpoint);
      xhr.send(formData);
    });
  } catch (error) {
    logger.error('[PhotoUpload] Upload error', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Upload multiple images with batch processing
 */
export async function uploadImages(
  files: File[],
  endpoint: string,
  options?: {
    compress?: boolean;
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    onProgress?: (index: number, progress: UploadProgress) => void;
    onComplete?: (index: number, result: UploadResult) => void;
  }
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    if (!file) {
      results.push({
        success: false,
        error: 'File is undefined',
      });
      continue;
    }
    
    try {
      // Compress if requested
      let processedFile: File | Blob = file;
      if (options?.compress) {
        processedFile = await compressImage(
          file,
          options.maxWidth,
          options.maxHeight,
          options.quality
        );
      }

      // Upload with progress
      const result = await uploadImage(processedFile, endpoint, (progress) => {
        options?.onProgress?.(i, progress);
      });

      results.push(result);
      options?.onComplete?.(i, result);
    } catch (error) {
      logger.error('[PhotoUpload] Batch upload error', error, { index: i });
      results.push({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

/**
 * Get file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

