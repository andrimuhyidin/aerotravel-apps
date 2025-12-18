/**
 * API: Incident Report Photo Upload
 * POST /api/guide/incidents/upload - Upload photos for incident report
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const photoFiles: File[] = [];
  const guideId = formData.get('guideId') as string;

  // Collect all photo files
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('photo_') && value instanceof File) {
      photoFiles.push(value);
    }
  }

  if (photoFiles.length === 0) {
    return NextResponse.json({ error: 'No photos provided' }, { status: 400 });
  }

  // Upload photos to Supabase Storage
  const uploadedUrls: string[] = [];

  for (const photo of photoFiles) {
    const fileName = `incidents/${guideId}/${Date.now()}-${photo.name}`;
    const arrayBuffer = await photo.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await supabase.storage
      .from('guide-assets')
      .upload(fileName, buffer, {
        contentType: photo.type,
        upsert: false,
      });

    if (error) {
      console.error('Photo upload error:', error);
      continue;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('guide-assets').getPublicUrl(data.path);

    uploadedUrls.push(publicUrl);
  }

  if (uploadedUrls.length === 0) {
    return NextResponse.json({ error: 'Failed to upload photos' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    urls: uploadedUrls,
  });
});
