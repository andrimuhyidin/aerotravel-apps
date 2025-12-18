/**
 * API: Admin Guide Live Tracking
 * GET /api/admin/guide/live-tracking
 *
 * Returns aggregated current locations of guides + SOS status
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (_request: NextRequest) => {
  const supabase = await createClient();

  const allowed = await hasRole(['super_admin', 'ops_admin']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: locations, error: locError } = await supabase
    .from('guide_locations')
    .select(
      `
      guide_id,
      trip_id,
      latitude,
      longitude,
      accuracy_meters,
      is_online,
      last_seen_at,
      guide:users(full_name, phone),
      trip:trips(trip_code, trip_date)
    `
    );

  if (locError) {
    logger.error('Failed to fetch guide_locations', locError);
    return NextResponse.json({ error: 'Failed to load locations' }, { status: 500 });
  }

  const { data: sosAlerts, error: sosError } = await supabase
    .from('sos_alerts')
    .select('id, trip_id, guide_id, status')
    .eq('status', 'active');

  if (sosError) {
    logger.error('Failed to fetch SOS alerts', sosError);
  }

  const activeSos = new Set(
    (sosAlerts ?? []).map((a) => `${a.guide_id}-${a.trip_id}`)
  );

  const guides = (locations ?? []).map((loc) => {
    const hasActiveSOS = activeSos.has(`${loc.guide_id}-${loc.trip_id}`);

    return {
      guideId: loc.guide_id as string,
      name: (loc.guide as { full_name: string | null } | null)?.full_name ?? '',
      phone: (loc.guide as { phone: string | null } | null)?.phone ?? '',
      tripId: loc.trip_id as string | null,
      tripCode: (loc.trip as { trip_code: string | null } | null)?.trip_code ?? '',
      latitude: Number(loc.latitude),
      longitude: Number(loc.longitude),
      accuracyMeters: loc.accuracy_meters as number | null,
      isOnline: Boolean(loc.is_online),
      lastSeenAt: loc.last_seen_at as string,
      hasActiveSOS,
    };
  });

  return NextResponse.json({ guides });
});
