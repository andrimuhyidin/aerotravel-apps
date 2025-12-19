/**
 * API: Share Trip Timeline
 * POST /api/guide/trips/[id]/timeline/share - Create share link for timeline
 * GET /api/guide/trips/[id]/timeline/share - Get existing share link
 */

import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const resolvedParams = await params;
  const { id: tripId } = resolvedParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('guide_trip_timeline_shares')
    .select('*')
    .eq('trip_id', tripId)
    .eq('guide_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    logger.error('Failed to fetch share link', error, { tripId, guideId: user.id });
    return NextResponse.json({ error: 'Failed to fetch share link' }, { status: 500 });
  }

  return NextResponse.json({
    share: data,
    shareUrl: data
      ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id'}/share/timeline/${data.share_token}`
      : null,
  });
});

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const resolvedParams = await params;
  const { id: tripId } = resolvedParams;
  const supabase = await createClient();
  const body = (await request.json().catch(() => ({}))) as { expiresInHours?: number };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Deactivate existing shares
  await supabase
    .from('guide_trip_timeline_shares')
    .update({ is_active: false })
    .eq('trip_id', tripId)
    .eq('guide_id', user.id);

  // Generate share token
  const shareToken = randomBytes(32).toString('hex');

  // Calculate expiration
  const expiresAt = body.expiresInHours
    ? new Date(Date.now() + body.expiresInHours * 60 * 60 * 1000).toISOString()
    : null;

  const { data, error } = await supabase
    .from('guide_trip_timeline_shares')
    .insert({
      trip_id: tripId,
      guide_id: user.id,
      share_token: shareToken,
      expires_at: expiresAt,
      is_active: true,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create share link', error, { tripId, guideId: user.id });
    return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 });
  }

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id'}/share/timeline/${shareToken}`;

  logger.info('Timeline share created', {
    shareId: data.id,
    tripId,
    guideId: user.id,
  });

  return NextResponse.json({
    success: true,
    share: data,
    shareUrl,
  });
});
