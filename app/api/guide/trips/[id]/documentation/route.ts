/**
 * API: Guide Trip Documentation URL
 * POST /api/guide/trips/[id]/documentation
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const POST = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const supabase = await createClient();
  const { id: tripId } = await context.params;

  const body = await request.json();
  const { url } = body as { url?: string };

  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  // Ensure user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Optional: ensure this guide is assigned to the trip
  const { data: assignment } = await supabase
    .from('trip_guides')
    .select('trip_id')
    .eq('trip_id', tripId)
    .eq('guide_id', user.id)
    .maybeSingle();

  if (!assignment) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const now = new Date().toISOString();

  const { error } = await supabase
    .from('trips')
    .update({
      documentation_url: url.trim(),
      documentation_uploaded_at: now,
    })
    .eq('id', tripId);

  if (error) {
    logger.error('Failed to save documentation URL', error, { tripId, guideId: user.id });
    return NextResponse.json({ error: 'Failed to save documentation' }, { status: 500 });
  }

  logger.info('Trip documentation URL saved', { tripId, guideId: user.id });

  return NextResponse.json({ success: true });
});
