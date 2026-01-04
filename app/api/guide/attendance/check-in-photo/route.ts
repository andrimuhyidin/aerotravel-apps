/**
 * API: Upload Check-in Photo Evidence
 * POST /api/guide/attendance/check-in-photo
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

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const tripId = formData.get('tripId') as string;

    if (!file || !tripId) {
      return NextResponse.json({ error: 'File and tripId are required' }, { status: 400 });
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `check-in-${tripId}-${Date.now()}.${fileExt}`;
    const filePath = `guide-attendance/${user.id}/${fileName}`;

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
      logger.error('Failed to upload check-in photo', uploadError, { tripId, guideId: user.id });
      return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from('guide-evidence').getPublicUrl(filePath);

    logger.info('Check-in photo uploaded', { tripId, guideId: user.id, filePath });

    return NextResponse.json({ url: urlData.publicUrl, path: filePath });
  } catch (error) {
    logger.error('Failed to process check-in photo', error);
    return NextResponse.json({ error: 'Failed to process photo' }, { status: 500 });
  }
});
