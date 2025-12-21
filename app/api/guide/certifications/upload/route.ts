/**
 * API: Upload Certification Document
 * POST /api/guide/certifications/upload - Upload certificate image
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // Define allowed file types
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  
  // Validate file extension
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!allowedExtensions.includes(fileExtension)) {
    return NextResponse.json(
      { error: 'File type not allowed. Only JPG, PNG, and WebP images are supported.' },
      { status: 400 }
    );
  }

  // Validate MIME type
  if (!allowedImageTypes.includes(file.type.toLowerCase())) {
    return NextResponse.json(
      { error: 'Invalid file type. File must be a valid image (JPG, PNG, or WebP).' },
      { status: 400 }
    );
  }

  // Validate file size (max 5MB for documents)
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
      { status: 400 }
    );
  }

  // Additional validation: Check if file is actually an image by reading first bytes
  // This helps prevent MIME type spoofing
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // Check magic bytes for common image formats
  const isJPEG = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
  const isWebP = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;
  
  if (!isJPEG && !isPNG && !isWebP) {
    return NextResponse.json(
      { error: 'File does not appear to be a valid image. Please upload a valid JPG, PNG, or WebP file.' },
      { status: 400 }
    );
  }

  try {
    // Ensure bucket exists
    const { ensureBucketExists } = await import('@/lib/storage/ensure-bucket');
    await ensureBucketExists('guide-documents');
  } catch (error) {
    logger.warn('Failed to ensure bucket exists, continuing with fallback', { error });
  }

  // Buffer already created during validation

  // Upload to Supabase Storage
  const fileName = `certifications/${user.id}/${Date.now()}-${file.name}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('guide-documents')
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    logger.error('Failed to upload certification document', uploadError, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 });
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from('guide-documents').getPublicUrl(fileName);

  logger.info('Certification document uploaded', {
    guideId: user.id,
    fileName,
    url: publicUrl,
  });

  return NextResponse.json({
    success: true,
    url: publicUrl,
    fileName,
  });
});
