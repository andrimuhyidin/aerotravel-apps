/**
 * API: Upload Partner Logo
 * POST /api/partner/whitelabel/logo - Upload company logo to Supabase Storage
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
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 2MB.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `partner-${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `partner-logos/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('partner-assets')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      logger.error('Failed to upload logo', uploadError, { userId: user.id });
      throw uploadError;
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('partner-assets').getPublicUrl(filePath);

    logger.info('Logo uploaded successfully', {
      userId: user.id,
      filePath,
      publicUrl,
    });

    return NextResponse.json({
      success: true,
      logoUrl: publicUrl,
    });
  } catch (error) {
    logger.error('Failed to upload logo', error, { userId: user.id });
    throw error;
  }
});

