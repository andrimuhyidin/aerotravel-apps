/**
 * API: Upload Profile Avatar
 * POST /api/guide/profile/avatar/upload - Upload guide profile avatar
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

  // Verify user is guide
  const client = supabase as unknown as any;
  const { data: userProfile } = await client
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!userProfile || userProfile.role !== 'guide') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'File is required' }, { status: 400 });
  }

  // Validate file type (only images)
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
  }

  // Validate file size (max 5MB for avatars)
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
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

  // Generate unique filename
  const fileExt = file.name.split('.').pop() || 'jpg';
  const fileName = `avatars/${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  // Convert File to ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Delete old avatar if exists
  const { data: currentProfile } = await client
    .from('users')
    .select('avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  if (currentProfile?.avatar_url) {
    try {
      // Extract path from URL (remove domain)
      const oldPath = currentProfile.avatar_url.split('/storage/v1/object/public/guide-documents/')[1];
      if (oldPath) {
        await supabase.storage.from('guide-documents').remove([oldPath]);
      }
    } catch (deleteError) {
      logger.warn('Failed to delete old avatar', { error: deleteError, userId: user.id });
      // Continue with upload even if delete fails
    }
  }

  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('guide-documents')
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: true, // Allow overwrite
    });

  if (uploadError) {
    logger.error('Failed to upload avatar', uploadError, {
      userId: user.id,
      fileName,
    });
    return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 });
  }

  // Get public URL
  const { data: urlData } = supabase.storage.from('guide-documents').getPublicUrl(fileName);
  const avatarUrl = urlData.publicUrl;

  // Update user profile with avatar URL
  const { error: updateError } = await client
    .from('users')
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (updateError) {
    logger.error('Failed to update avatar URL in profile', updateError, {
      userId: user.id,
      avatarUrl,
    });
    // Try to delete uploaded file
    await supabase.storage.from('guide-documents').remove([fileName]);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }

  logger.info('Avatar uploaded successfully', {
    userId: user.id,
    fileName,
    avatarUrl,
  });

  return NextResponse.json({
    success: true,
    avatar_url: avatarUrl,
  });
});

