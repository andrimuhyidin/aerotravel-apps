/**
 * API: Upload Photo
 * POST /api/guide/photos/upload - Upload photo (direct or from queue)
 * Rate Limited: 5 uploads per minute per user
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { checkGuideRateLimit, createRateLimitHeaders, guideUploadRateLimit } from '@/lib/rate-limit/guide-limits';
import { createClient } from '@/lib/supabase/server';
import { extractEXIFData } from '@/lib/utils/exif-extractor';
import { logger } from '@/lib/utils/logger';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit check
  const rateLimit = await checkGuideRateLimit(guideUploadRateLimit, user.id, 'upload foto');
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: rateLimit.error },
      { status: 429, headers: createRateLimitHeaders(rateLimit.remaining, rateLimit.reset) }
    );
  }

  const branchContext = await getBranchContext(user.id);

  if (!branchContext.branchId && !branchContext.isSuperAdmin) {
    return NextResponse.json({ error: 'Branch context required' }, { status: 400 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const tripId = formData.get('tripId') as string | null;
  const type = formData.get('type') as string | null;
  const itemId = formData.get('itemId') as string | null;
  const latitude = formData.get('latitude') ? parseFloat(formData.get('latitude') as string) : null;
  const longitude = formData.get('longitude') ? parseFloat(formData.get('longitude') as string) : null;
  const timestamp = formData.get('timestamp') as string | null;

  if (!file) {
    return NextResponse.json({ error: 'File is required' }, { status: 400 });
  }

  if (!type) {
    return NextResponse.json({ error: 'Type is required' }, { status: 400 });
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
  }

  // Validate file size (max 10MB)
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
      { status: 400 }
    );
  }

  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${type}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `guide-photos/${branchContext.branchId}/${type}/${fileName}`;

    // Convert File to ArrayBuffer for Supabase Storage
    const arrayBuffer = await file.arrayBuffer();

    // Extract EXIF data from photo (GPS, timestamp, etc.)
    let exifData = null;
    let exifLatitude = latitude;
    let exifLongitude = longitude;
    let exifTimestamp = timestamp;

    try {
      const exif = await extractEXIFData(arrayBuffer);
      if (exif) {
        exifData = exif;
        // Prioritize EXIF GPS/timestamp over formData if available
        if (exif.latitude && exif.longitude) {
          exifLatitude = exif.latitude;
          exifLongitude = exif.longitude;
        }
        if (exif.timestamp) {
          exifTimestamp = exif.timestamp;
        }
      }
    } catch (exifError) {
      logger.warn('Failed to extract EXIF data', { error: exifError });
      // Continue without EXIF data
    }
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('guide-photos')
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      logger.error('Failed to upload photo to storage', uploadError, {
        guideId: user.id,
        tripId,
        type,
      });
      return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from('guide-photos').getPublicUrl(filePath);
    const photoUrl = urlData.publicUrl;

    // Store photo metadata in database (optional - for tracking)
    const client = supabase as unknown as any;
    const { error: metadataError } = await client.from('guide_photo_uploads').insert({
      guide_id: user.id,
      branch_id: branchContext.branchId,
      trip_id: tripId || null,
      photo_type: type,
      item_id: itemId || null,
      file_path: filePath,
      file_url: photoUrl,
      file_size: file.size,
      latitude: exifLatitude || latitude || null,
      longitude: exifLongitude || longitude || null,
      captured_at: exifTimestamp || timestamp || new Date().toISOString(),
      uploaded_at: new Date().toISOString(),
      exif_data: exifData,
    });

    if (metadataError) {
      logger.warn('Failed to save photo metadata', {
        error: metadataError,
        guideId: user.id,
        tripId,
      });
      // Don't fail the upload if metadata save fails
    }

    logger.info('Photo uploaded successfully', {
      guideId: user.id,
      tripId,
      type,
      filePath,
      fileSize: file.size,
    });

    return NextResponse.json({
      success: true,
      url: photoUrl,
      photoUrl,
      filePath,
    });
  } catch (error) {
    logger.error('Photo upload error', error, {
      guideId: user.id,
      tripId,
      type,
    });
    return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
  }
});

