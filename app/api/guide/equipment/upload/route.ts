/**
 * API: Upload Equipment Photo
 * POST /api/guide/equipment/upload - Upload equipment photo with GPS metadata
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
  const latitude = formData.get('latitude') ? parseFloat(formData.get('latitude') as string) : null;
  const longitude = formData.get('longitude') ? parseFloat(formData.get('longitude') as string) : null;

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
  const fileName = `equipment/${user.id}/${Date.now()}-${file.name}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('guide-documents')
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    logger.error('Failed to upload equipment photo', uploadError, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from('guide-documents').getPublicUrl(fileName);

  logger.info('Equipment photo uploaded', {
    guideId: user.id,
    fileName,
    url: publicUrl,
    gps: latitude && longitude ? { latitude, longitude } : null,
  });

  return NextResponse.json({
    success: true,
    url: publicUrl,
    fileName,
    gps: latitude && longitude ? { latitude, longitude } : null,
    timestamp: new Date().toISOString(),
  });
});
