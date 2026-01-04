/**
 * API: Manifest Access Audit Log
 * GET /api/guide/manifest/audit?tripId=xxx - Get access audit log for trip
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const tripId = searchParams.get('tripId');

  if (!tripId) {
    return NextResponse.json({ error: 'tripId is required' }, { status: 400 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  // Verify guide assignment
  const { data: assignment } = await client
    .from('trip_guides')
    .select('id')
    .eq('trip_id', tripId)
    .eq('guide_id', user.id)
    .maybeSingle();

  if (!assignment) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get access logs for this trip (only for this guide)
  const { data: logs, error } = await client
    .from('manifest_access_logs')
    .select('*')
    .eq('trip_id', tripId)
    .eq('guide_id', user.id)
    .order('accessed_at', { ascending: false })
    .limit(50);

  if (error) {
    logger.error('Failed to fetch manifest access logs', error, { tripId, guideId: user.id });
    return NextResponse.json(
      { error: 'Failed to fetch access logs' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    logs: logs || [],
    count: (logs || []).length,
  });
});

