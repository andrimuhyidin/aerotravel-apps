/**
 * API: Admin SOS Management
 * GET /api/admin/sos        - List active SOS alerts
 * POST /api/admin/sos       - Update SOS status (acknowledge / resolve)
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async () => {
  // Use regular client for auth
  const authClient = await createClient();

  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check authorization using user metadata
  const userRole = user.user_metadata?.role as string;
  const allowedRoles = ['super_admin', 'ops_admin'];
  if (!userRole || !allowedRoles.includes(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Use admin client for data queries
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from('sos_alerts')
    .select(
      `
      id,
      trip_id,
      guide_id,
      branch_id,
      status,
      latitude,
      longitude,
      location_name,
      accuracy_meters,
      created_at,
      acknowledged_at,
      resolved_at,
      message,
      guide:users!sos_alerts_guide_id_fkey(full_name, phone),
      trip:trips(trip_code, trip_date)
    `
    )
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    logger.error('Failed to fetch SOS alerts', error);
    return NextResponse.json({ error: 'Failed to load SOS alerts' }, { status: 500 });
  }

  return NextResponse.json({ alerts: data });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Use regular client for auth
  const authClient = await createClient();

  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check authorization using user metadata
  const userRole = user.user_metadata?.role as string;
  const allowedRoles = ['super_admin', 'ops_admin'];
  if (!userRole || !allowedRoles.includes(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Use admin client for data queries
  const supabase = await createAdminClient();

  const body = (await request.json()) as {
    id?: string;
    action?: 'acknowledge' | 'resolve';
    resolutionNotes?: string;
  };

  const { id, action, resolutionNotes } = body;

  if (!id || !action) {
    return NextResponse.json({ error: 'Missing id or action' }, { status: 400 });
  }

  const now = new Date().toISOString();

  let updateData: Record<string, unknown> = {};
  if (action === 'acknowledge') {
    updateData = {
      status: 'acknowledged',
      acknowledged_at: now,
      acknowledged_by: user.id,
    };
  } else if (action === 'resolve') {
    updateData = {
      status: 'resolved',
      resolved_at: now,
      resolved_by: user.id,
      resolution_notes: resolutionNotes ?? null,
    };
  }

  const { error } = (await supabase
    .from('sos_alerts')
    .update(updateData as Record<string, unknown>)
    .eq('id', id)) as { error: Error | null };

  if (error) {
    logger.error('Failed to update SOS alert', error, { id, action });
    return NextResponse.json({ error: 'Failed to update SOS alert' }, { status: 500 });
  }

  logger.info('SOS alert updated', { id, action, userId: user.id });

  return NextResponse.json({ success: true });
});
