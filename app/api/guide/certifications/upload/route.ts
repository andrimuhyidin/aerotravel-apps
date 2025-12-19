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

  // Validate file type
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
  }

  try {
    // Ensure bucket exists
    const { ensureBucketExists } = await import('@/lib/storage/ensure-bucket');
    await ensureBucketExists('guide-documents');
  } catch (error) {
    logger.warn('Failed to ensure bucket exists, continuing with fallback', { error });
  }

  // Convert file to buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

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
