/**
 * Supabase Storage Helper
 * Sesuai PRD 2.2.B - Object Storage (Supabase Storage)
 * 
 * Utility untuk upload/download file dengan:
 * - Private Buckets untuk dokumentasi sensitif
 * - Auto-Expiration untuk foto KTP (H+30)
 */

import 'server-only';

import { createClient } from '@/lib/supabase/server';

export type UploadOptions = {
  bucket: string;
  path: string;
  file: File | Buffer;
  contentType?: string;
  cacheControl?: string;
  upsert?: boolean;
};

export type StorageFile = {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: Record<string, unknown>;
};

/**
 * Upload file ke Supabase Storage
 */
export async function uploadFile(options: UploadOptions): Promise<string> {
  const supabase = await createClient();

    const fileData =
      options.file instanceof Buffer
        ? options.file
        : options.file instanceof File
        ? await options.file.arrayBuffer()
        : Buffer.from(options.file);

  const { data, error } = await supabase.storage
    .from(options.bucket)
    .upload(options.path, fileData, {
      contentType: options.contentType || 'application/octet-stream',
      cacheControl: options.cacheControl || '3600',
      upsert: options.upsert || false,
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(options.bucket).getPublicUrl(data.path);

  return publicUrl;
}

/**
 * Delete file dari Supabase Storage
 * Digunakan untuk Auto-Retention Policy (PRD 6.2.A)
 */
export async function deleteFile(
  bucket: string,
  path: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    throw new Error(`Storage delete failed: ${error.message}`);
  }
}

/**
 * Get signed URL untuk private file (expires in 1 hour)
 */
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw new Error(`Signed URL creation failed: ${error.message}`);
  }

  return data.signedUrl;
}

/**
 * List files dalam bucket
 */
export async function listFiles(
  bucket: string,
  folder?: string
): Promise<StorageFile[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .list(folder || '', {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' },
    });

  if (error) {
    throw new Error(`List files failed: ${error.message}`);
  }

  return data as StorageFile[];
}

