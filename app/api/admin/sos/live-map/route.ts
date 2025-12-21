/**
 * API: Admin SOS Live Map
 * GET /api/admin/sos/live-map - Get active SOS alerts with locations for live map
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const allowed = await hasRole(['super_admin', 'ops_admin']);
  
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const client = supabase as unknown as any;

  // Get active SOS alerts with latest location
  const { data: activeAlerts, error: alertsError } = await client.rpc('get_active_sos_alerts');

  if (alertsError) {
    logger.error('Failed to fetch active SOS alerts', alertsError);
    return NextResponse.json(
      { error: 'Failed to fetch active SOS alerts' },
      { status: 500 }
    );
  }

  // Get location history for each alert (last 50 points for breadcrumb trail)
  const alertsWithHistory = await Promise.all(
    (activeAlerts || []).map(async (alert: { id: string }) => {
      const { data: history } = await client
        .from('sos_location_history')
        .select('latitude, longitude, recorded_at')
        .eq('sos_alert_id', alert.id)
        .order('recorded_at', { ascending: false })
        .limit(50);

      return {
        ...alert,
        locationHistory: (history || []).reverse(), // Oldest first for trail
      };
    })
  );

  return NextResponse.json({
    success: true,
    alerts: alertsWithHistory,
    count: alertsWithHistory.length,
  });
});

/**
 * POST /api/admin/sos/live-map/resolve - Resolve SOS alert
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const allowed = await hasRole(['super_admin', 'ops_admin']);
  
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as {
    sos_alert_id: string;
    resolution_notes?: string;
  };

  const client = supabase as unknown as any;

  // Stop streaming and resolve alert
  await client.rpc('stop_sos_streaming', { p_sos_alert_id: body.sos_alert_id });

  const { data: updatedAlert, error } = await client
    .from('sos_alerts')
    .update({
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      resolved_by: user.id,
      resolution_notes: body.resolution_notes || null,
      streaming_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', body.sos_alert_id)
    .select()
    .single();

  if (error) {
    logger.error('Failed to resolve SOS alert', error, {
      sosAlertId: body.sos_alert_id,
    });
    return NextResponse.json(
      { error: 'Failed to resolve SOS alert' },
      { status: 500 }
    );
  }

  logger.info('SOS alert resolved', {
    sosAlertId: body.sos_alert_id,
    resolvedBy: user.id,
  });

  return NextResponse.json({
    success: true,
    alert: updatedAlert,
  });
});

