/**
 * Ensure Storage Bucket Exists
 * Helper to check and create storage bucket if needed
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

/**
 * Ensure bucket exists, create if not
 */
export async function ensureBucketExists(bucketName: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    
    // Try to list bucket (will fail if doesn't exist)
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      logger.error('Failed to list buckets', listError);
      return false;
    }

    // Check if bucket exists
    const bucketExists = buckets?.some((b) => b.name === bucketName);

    if (bucketExists) {
      return true;
    }

    // Try to create bucket (requires service role)
    // Note: This might fail if using anon key, bucket should be created manually
    const { error: createError } = await supabase.storage.createBucket(bucketName, {
      public: false, // Private bucket
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['image/png', 'image/jpeg', 'application/pdf'],
    });

    if (createError) {
      logger.warn('Failed to create bucket (may need manual creation)', {
        bucketName,
        error: createError,
      });
      return false;
    }

    logger.info('Storage bucket created', { bucketName });
    return true;
  } catch (error) {
    logger.error('Failed to ensure bucket exists', error, { bucketName });
    return false;
  }
}
