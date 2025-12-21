/**
 * API: Upload Handover Item Photo
 * POST /api/guide/logistics/handover/item-photo
 * Upload photo for a specific item in handover (before handover is created)
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
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

  const branchContext = await getBranchContext(user.id);

  if (!branchContext.branchId && !branchContext.isSuperAdmin) {
    return NextResponse.json({ error: 'Branch context required' }, { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const tripId = formData.get('tripId') as string;

    if (!file || !tripId) {
      return NextResponse.json({ error: 'File and tripId are required' }, { status: 400 });
    }

    // Validate file type (images only)
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (max 5MB for item photos)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 },
      );
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `item-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `handovers/${branchContext.branchId}/${tripId}/${fileName}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('guide-evidence')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      logger.error('Failed to upload handover item photo', uploadError, { tripId, guideId: user.id });
      return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from('guide-evidence').getPublicUrl(filePath);

    logger.info('Handover item photo uploaded', { tripId, guideId: user.id, filePath });

    return NextResponse.json({
      url: urlData.publicUrl,
      path: filePath,
    });
  } catch (error) {
    logger.error('Failed to process handover item photo', error);
    return NextResponse.json({ error: 'Failed to process photo' }, { status: 500 });
  }
});
