/**
 * API: Profile
 * PATCH /api/profile - Update current user's profile
 * GET /api/profile - Get current user's profile
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { logger } from '@/lib/utils/logger';
import { getCurrentUser, createClient } from '@/lib/supabase/server';

export const GET = withErrorHandler(async () => {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    profile: user.profile,
    activeRole: user.activeRole,
  });
});

export const PATCH = withErrorHandler(async (request: NextRequest) => {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { full_name, phone, bio, avatar_url } = body;

  // Validate required fields
  if (!full_name || full_name.length < 2) {
    return NextResponse.json(
      { error: 'Full name must be at least 2 characters' },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Update user profile in database
  const { data, error } = await supabase
    .from('users')
    .update({
      full_name,
      phone: phone || null,
      bio: bio || null,
      avatar_url: avatar_url || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    logger.error('Failed to update profile', error, { userId: user.id });
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }

  logger.info('Profile updated', { userId: user.id });

  return NextResponse.json({
    success: true,
    profile: data,
  });
});

